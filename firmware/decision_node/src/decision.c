#include <zephyr/kernel.h>
#include <zephyr/shell/shell.h>
#include <math.h>
#include <stdlib.h>
#include "decision.h"

struct inputs g_in = { 24.0f, 45.0f, 24.0f, 50.0f };
static bool humid_on = true, fan_on = false;
static int64_t last_change;
static int hold_ms = 10000;               /* 시연 10초, 실제 60초 */

#define ON_TH  75.0f
#define OFF_TH 70.0f

static float psat(float t) { return 6.112f * expf(17.62f * t / (243.12f + t)); }
float surface_rh(void) { return g_in.room_rh * psat(g_in.room_t) / psat(g_in.wall_t); }

static void set_state(bool h, bool f, const char *why)
{
    if (h && f) return;                   /* 동시 가동 금지 */
    humid_on = h; fan_on = f;
    last_change = k_uptime_get();
    outputs_apply(humid_on, fan_on);
    printk("EVT humid=%d fan=%d srh=%.1f why=%s\n", h, f, (double)surface_rh(), why);
}

static void tick(struct k_work *w);
static K_WORK_DELAYABLE_DEFINE(tick_work, tick);

static void tick(struct k_work *w)
{
    float s = surface_rh();
    bool held = (k_uptime_get() - last_change) >= hold_ms;

    if (s >= ON_TH && humid_on) {
        set_state(false, false, "srh>=75 humid_off");
    } else if (s >= ON_TH && !fan_on) {
        set_state(false, true, "srh>=75 fan_on");       /* 0.5초 뒤 */
    } else if (s < OFF_TH && fan_on && held) {
        set_state(false, false, "srh<70 fan_off_first");
    } else if (s < OFF_TH && !fan_on && !humid_on && held) {
        set_state(true, false, "srh<70 stable humid_on");
    }
    printk("VAL srh=%.1f humid=%d fan=%d\n", (double)s, humid_on, fan_on);
    k_work_schedule(&tick_work, K_MSEC(500));
}

void decision_start(void)
{
    set_state(true, false, "boot");
    k_work_schedule(&tick_work, K_NO_WAIT);
}

static int cmd_sim(const struct shell *sh, size_t argc, char **argv)
{
    g_in.room_t  = strtof(argv[1], NULL);
    g_in.room_rh = strtof(argv[2], NULL);
    g_in.wall_t  = strtof(argv[3], NULL);
    g_in.bed_rh  = strtof(argv[4], NULL);
    inputs_changed();
    return 0;
}
SHELL_CMD_ARG_REGISTER(sim, NULL, "sim <room_t> <room_rh> <wall_t> <bed_rh>", cmd_sim, 5, 0);

static int cmd_hold(const struct shell *sh, size_t argc, char **argv)
{
    hold_ms = atoi(argv[1]) * 1000;
    shell_print(sh, "hold=%d s", hold_ms / 1000);
    return 0;
}
SHELL_CMD_ARG_REGISTER(hold, NULL, "hold <sec>", cmd_hold, 2, 0);
