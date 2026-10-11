#pragma once
#include <stdbool.h>
#ifdef __cplusplus
extern "C" {
#endif
struct inputs { float room_t, room_rh, wall_t, bed_rh; };
struct node_status {
	float srh, srh_nf, ah;                /* 표면 습도(현재 / 선풍기 없다면), 절대습도 g/m3 */
	float band_lo, band_hi, band_hi_nf;   /* 표 3 허용 실내 습도 구간 (선풍기 효과 포함 / 없을 때) */
	float crit_wall, eta_min, risk_min;   /* 임계 벽 온도, 임계 도달 예측(분), 누적 위험 시간(분) */
	float fan_gain;                       /* 학습한 선풍기 효과 (벽 표면 +℃) */
	bool humid, fan;
};
extern struct inputs g_in;
const struct node_status *decision_status(void);
void decision_start(void);
void outputs_apply(bool humid, bool fan);  /* 릴레이·LED·Matter 반영 (node_outputs.cpp) */
void inputs_changed(void);                 /* 센서·판단값을 Matter 속성으로 (node_outputs.cpp) */
#ifdef __cplusplus
}
#endif
