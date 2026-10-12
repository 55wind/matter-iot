/* 판단부: 벽 표면 습도를 계산해 가습기·선풍기를 임계 전에 조절한다. */
#include <zephyr/kernel.h>
#include <zephyr/shell/shell.h>
#include <math.h>
#include <stdarg.h>
#include <stdlib.h>
#include "decision.h"

#define ON_TH     75.0f  /* 가습 정지선 = ISO 임계 80% - 측정 불확실성 5%p */
#define OFF_TH    70.0f  /* 재개선 (히스테리시스) */
#define ISO_TH    80.0f  /* ISO 13788 곰팡이 임계 표면 습도 */
#define AH_MIN     6.0f  /* 점막 방어 절대습도 하한 g/m3 (Shaman & Kohn) */
#define AH_START   6.5f  /* 이 아래로 떨어지면 가습 */
#define AH_STOP    8.0f  /* 이 위로 오르면 가습 정지 */
#define LEARN_MIN  3.0f  /* 선풍기를 켠 뒤 효과를 재는 시간 (분) */
#define LEARN_MAX 15.0f  /* 효과가 안 보일 때 기다리는 최대 시간 (분) */
#define MANUAL_MIN 30.0f /* 앱에서 직접 조작하면 이 시간 동안 존중 (분), 단 80% 이상이면 방어 우선 */
#define BED_RATE   0.3f  /* D 국면 판정: 침구 습도가 분당 이만큼 오르면 취침, 내리면 기상 (%p/분) */
#define BED_GAP    5.0f  /* 취침 판정: 침구가 실내보다 이만큼 이상 습할 때만 (%p) */
#define BED_DRY_ON 60.0f /* C 침구 건조: 기상 후 침구 습도가 이 이상이면 선풍기로 말림 (진드기 번식 습도) */
#define BED_DRY_OFF 50.0f /* 이 아래로 마르면 건조 끝 */
#define DRY_MAX   45.0f  /* 건조 최대 시간 (분) */

enum { PH_IDLE, PH_SLEEP, PH_WAKE };

struct inputs g_in = { 21.0f, 45.0f, 21.0f, 50.0f };
static struct node_status st;
static float sim_t = -1.0f;   /* 가상 시각(분). sim 명령에 없으면 업타임 사용 */
static float hold_min = 1.0f; /* 최소 유지 시간 60초 */
static float prev_t = -1.0f, last_change_t, fan_on_t, wall_before_fan, prev_wall_nf, slope;
static float prev_bed = -1.0f, dry_t;
static bool measuring;
static float manual_until = -1.0f;
K_MUTEX_DEFINE(dlock);

static float psat(float t) { return 6.112f * expf(17.62f * t / (243.12f + t)); }
static float srh_at(float wall) { return g_in.room_rh * psat(g_in.room_t) / psat(wall); }
static float abs_hum(void) { return 216.7f * (g_in.room_rh / 100.0f) * psat(g_in.room_t) / (273.15f + g_in.room_t); }
/* 표면 습도가 rh가 되는 벽 온도 (Magnus 역함수) */
static float wall_for_srh(float rh)
{
	float l = logf(g_in.room_rh / rh * psat(g_in.room_t) / 6.112f);
	return 243.12f * l / (17.62f - l);
}
/* 표 3: 벽 온도별 허용 실내 습도 상한(표면 80%)과 하한(절대습도 6 g/m3) */
static float band_hi_at(float wall) { return ISO_TH * psat(wall) / psat(g_in.room_t); }
static float rh_for_ah(float ah) { return ah * (273.15f + g_in.room_t) / 216.7f / psat(g_in.room_t) * 100.0f; }
static float band_lo(void) { return rh_for_ah(AH_MIN); }
static float now_min(void) { return sim_t >= 0.0f ? sim_t : k_uptime_get() / 60000.0f; }

const struct node_status *decision_status(void) { return &st; }

/* Matter 로그가 줄 중간에 끼어들지 않도록 한 줄을 통째로 출력한다 (minimal 로깅은 스레드마다 UART에 바로 씀) */
static void emit(const char *fmt, ...)
{
	va_list ap;

	va_start(ap, fmt);
	k_sched_lock();
	vprintk(fmt, ap);
	k_sched_unlock();
	va_end(ap);
}

static void set_outputs(bool h, bool f, const char *why)
{
	st.humid = h;
	st.fan = f;
	last_change_t = now_min();
	outputs_apply(h, f);
	emit("EVT t=%.1f humid=%d fan=%d srh=%.1f ah=%.2f why=%s\n", (double)now_min(), h, f, (double)st.srh,
	       (double)st.ah, why);
}

static void step(void)
{
	k_mutex_lock(&dlock, K_FOREVER);
	float t = now_min();
	float dt = (prev_t < 0.0f || t < prev_t) ? 0.0f : t - prev_t;

	/* E 학습: 선풍기를 켜고 LEARN_MIN 뒤 벽 표면이 몇 ℃ 올랐는지 잰다.
	 * 0.5℃도 안 오르면 아직 반영 전으로 보고 최대 LEARN_MAX까지 더 기다린다. */
	if (st.fan && measuring && t - fan_on_t >= LEARN_MIN) {
		float g = g_in.wall_t - wall_before_fan;
		if (g >= 0.5f || t - fan_on_t >= LEARN_MAX) {
			st.fan_gain = g > 0.0f ? g : 0.0f;
			measuring = false;
			emit("EVT t=%.1f learn fan_gain=%.2f\n", (double)t, (double)st.fan_gain);
		}
	}

	float wall_nf = st.fan ? g_in.wall_t - st.fan_gain : g_in.wall_t;
	st.srh = srh_at(g_in.wall_t);
	st.srh_nf = srh_at(wall_nf);
	st.ah = abs_hum();
	st.band_lo = band_lo();
	st.band_hi = band_hi_at(g_in.wall_t);
	st.band_hi_nf = band_hi_at(wall_nf);

	/* E 예측: 벽이 식는 추세로 임계(80%) 도달 시각을 계산한다 */
	if (dt > 0.0f && !(st.fan && measuring)) {
		slope = 0.8f * slope + 0.2f * (wall_nf - prev_wall_nf) / dt;
	}
	prev_wall_nf = wall_nf;
	prev_t = t;
	st.crit_wall = wall_for_srh(ISO_TH);
	if (wall_nf <= st.crit_wall) {
		st.eta_min = 0.0f;
	} else if (slope < -0.001f) {
		st.eta_min = (wall_nf - st.crit_wall) / -slope;
	} else {
		st.eta_min = -1.0f;
	}
	if (st.srh >= ISO_TH) {
		st.risk_min += dt;
	}

	/* D 국면 판정: 침구 센서 하나로 취침과 기상을 알아낸다 (사용자 설정 없음) */
	if (dt > 0.0f && prev_bed >= 0.0f) {
		st.bed_rate = 0.5f * st.bed_rate + 0.5f * (g_in.bed_rh - prev_bed) / dt;
	}
	prev_bed = g_in.bed_rh;
	if (st.phase != PH_SLEEP && st.bed_rate >= BED_RATE && g_in.bed_rh >= g_in.room_rh + BED_GAP) {
		st.phase = PH_SLEEP;
		emit("EVT t=%.1f phase=1 bed=%.1f why=bed_rise sleep\n", (double)t, (double)g_in.bed_rh);
	} else if (st.phase == PH_SLEEP && st.bed_rate <= -BED_RATE) {
		st.phase = PH_WAKE;
		emit("EVT t=%.1f phase=2 bed=%.1f why=bed_fall wake\n", (double)t, (double)g_in.bed_rh);
	}
	bool bed_wet = st.phase == PH_WAKE && g_in.bed_rh >= BED_DRY_ON;

	bool h = st.humid, f = st.fan;
	bool held = (t - last_change_t) >= hold_min;
	if (manual_until >= 0.0f && (t >= manual_until || st.srh >= ISO_TH)) {
		manual_until = -1.0f;
	}
	/* 선풍기를 끄고 가습 목표(8 g/m3)까지 올려도 표면이 70% 아래인가 */
	float rh_eval = fmaxf(g_in.room_rh, rh_for_ah(AH_STOP));
	float srh_target_nf = rh_eval * psat(g_in.room_t) / psat(wall_nf);

	if (t < manual_until && st.srh < ISO_TH) {
		/* 사용자가 앱에서 정한 상태를 유지한다 */
	} else if (h && st.srh >= ON_TH) {
		/* A 곰팡이 방어: 표면 75%에서 가습 정지 */
		set_outputs(false, f, "srh>=75 humid_off");
	} else if (!f && st.srh >= ON_TH) {
		/* 임계 접근: 0.5초 뒤 선풍기로 벽 표면을 데워 허용 구간을 되찾는다 */
		fan_on_t = t;
		wall_before_fan = g_in.wall_t;
		measuring = true;
		set_outputs(h, true, "srh>=75 fan_on");
	} else if (!st.drying && bed_wet) {
		/* C 침구 건조: 기상 후 밤새 젖은 침구를 선풍기로 말린다 */
		st.drying = true;
		dry_t = t;
		if (!f) {
			set_outputs(h, true, "bed>=60 dry_on");
		} else {
			emit("EVT t=%.1f bed=%.1f why=bed>=60 dry_keep\n", (double)t, (double)g_in.bed_rh);
		}
	} else if (st.drying && (g_in.bed_rh < BED_DRY_OFF || t - dry_t >= DRY_MAX)) {
		st.drying = false;
		if (f && !measuring && srh_target_nf < OFF_TH) {
			set_outputs(h, false, "bed<50 dry_off");
		} else {
			emit("EVT t=%.1f bed=%.1f why=bed<50 dry_done\n", (double)t, (double)g_in.bed_rh);
		}
	} else if (f && !measuring && held && !st.drying && srh_target_nf < OFF_TH) {
		/* 학습한 선풍기 효과를 빼고도 70% 아래일 때만 끈다 (침구 건조 중에는 유지) */
		set_outputs(h, false, "srh_nofan<70 fan_off");
	} else if (!h && held && !st.drying && st.ah < AH_START && st.srh < OFF_TH) {
		/* B 절대습도 확보: 70% 재개선 안쪽에서만 가습 (침구를 말리는 동안은 미룸) */
		set_outputs(true, f, f ? "ah<6.5 humid_on band_by_fan" : "ah<6.5 humid_on");
	} else if (h && st.ah >= AH_STOP) {
		set_outputs(false, f, "ah>=8 humid_off");
	}

	emit("VAL t=%.1f rh=%.1f wt=%.2f srh=%.1f ah=%.2f humid=%d fan=%d lo=%.1f hi=%.1f hinf=%.1f eta=%.0f "
	     "risk=%.1f gain=%.2f bed=%.1f ph=%d dry=%d\n",
	     (double)t, (double)g_in.room_rh, (double)g_in.wall_t, (double)st.srh, (double)st.ah, st.humid, st.fan,
	     (double)st.band_lo, (double)st.band_hi, (double)st.band_hi_nf, (double)st.eta_min, (double)st.risk_min,
	     (double)st.fan_gain, (double)g_in.bed_rh, st.phase, st.drying);
	k_mutex_unlock(&dlock);
	inputs_changed();
}

static void decision_reset(void)
{
	k_mutex_lock(&dlock, K_FOREVER);
	manual_until = -1.0f;
	/* 가상 시각 0분부터 다시 시작한다 (업타임과 섞이면 유지시간 판정이 틀어진다) */
	sim_t = 0.0f;
	prev_t = -1.0f;
	slope = 0.0f;
	measuring = false;
	st.risk_min = 0.0f;
	st.fan_gain = 0.0f;
	st.phase = PH_IDLE;
	st.drying = false;
	st.bed_rate = 0.0f;
	prev_bed = -1.0f;
	set_outputs(false, false, "reset");
	last_change_t = -hold_min;
	k_mutex_unlock(&dlock);
}

/* 앱(다른 Matter 컨트롤러)이나 DK 버튼으로 바뀐 상태를 판단부에 반영한다 */
void decision_manual(bool humid, bool fan)
{
	k_mutex_lock(&dlock, K_FOREVER);
	float t = now_min();
	if (fan && !st.fan) {
		fan_on_t = t;
		wall_before_fan = g_in.wall_t;
		measuring = true;
	} else if (!fan) {
		measuring = false;
	}
	st.humid = humid;
	st.fan = fan;
	last_change_t = t;
	manual_until = t + MANUAL_MIN;
	emit("EVT t=%.1f humid=%d fan=%d srh=%.1f ah=%.2f why=app_manual\n", (double)t, humid, fan, (double)st.srh,
	     (double)st.ah);
	k_mutex_unlock(&dlock);
}

static void decision_thread(void *a, void *b, void *c)
{
	while (true) {
		step();
		k_msleep(500);
	}
}

K_THREAD_STACK_DEFINE(decision_stack, 3072);
static struct k_thread decision_tdata;

void decision_start(void)
{
	set_outputs(false, false, "boot");
	k_thread_create(&decision_tdata, decision_stack, K_THREAD_STACK_SIZEOF(decision_stack), decision_thread, NULL,
			NULL, NULL, 7, 0, K_NO_WAIT);
	k_thread_name_set(&decision_tdata, "decision");
}

/* sim <room_t> <room_rh> <wall_t> <bed_rh> [t_min] : 센서값 (가상 침실이 보냄) */
static int cmd_sim(const struct shell *sh, size_t argc, char **argv)
{
	g_in.room_t = strtof(argv[1], NULL);
	g_in.room_rh = strtof(argv[2], NULL);
	g_in.wall_t = strtof(argv[3], NULL);
	g_in.bed_rh = strtof(argv[4], NULL);
	sim_t = argc > 5 ? strtof(argv[5], NULL) : -1.0f;
	return 0;
}
SHELL_CMD_ARG_REGISTER(sim, NULL, "sim <room_t> <room_rh> <wall_t> <bed_rh> [t_min]", cmd_sim, 5, 1);

static int cmd_hold(const struct shell *sh, size_t argc, char **argv)
{
	hold_min = atoi(argv[1]) / 60.0f;
	shell_print(sh, "hold=%d s", atoi(argv[1]));
	return 0;
}
SHELL_CMD_ARG_REGISTER(hold, NULL, "hold <sec>", cmd_hold, 2, 0);

static int cmd_dreset(const struct shell *sh, size_t argc, char **argv)
{
	decision_reset();
	return 0;
}
SHELL_CMD_ARG_REGISTER(dreset, NULL, "reset risk time, learning and outputs", cmd_dreset, 1, 0);
