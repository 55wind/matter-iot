#pragma once
#include <stdbool.h>
#ifdef __cplusplus
extern "C" {
#endif
struct inputs { float room_t, room_rh, wall_t, bed_rh; };
extern struct inputs g_in;
float surface_rh(void);
void decision_start(void);
void outputs_apply(bool humid, bool fan);  /* 5단계: GPIO, 6단계: Matter */
void inputs_changed(void);                 /* 5단계: 빈 함수, 6단계: 센서 속성 갱신 */
#ifdef __cplusplus
}
#endif
