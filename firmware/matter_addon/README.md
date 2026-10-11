# matter_addon · 6단계 (light_bulb에 판단 프로그램 합치기)

Nordic `light_bulb` 예제(3단계에서 만든 `C:\ncs-work\light_bulb`)에 넣을 파일입니다.
예제 전체는 SDK 버전마다 달라서 여기 넣지 않았습니다. 자세한 설명은 `docs/` 설명서 6단계를 보세요.

## 가. 파일 복사

| 복사할 것 | 붙여 넣을 곳 |
| --- | --- |
| `../decision_node/src/decision.h`, `decision.c` | `light_bulb/src/` |
| `src/outputs.cpp` (이 폴더) | `light_bulb/src/` |
| `../decision_node/boards/` 폴더 | `light_bulb/` (같은 이름 폴더가 있으면 `.overlay` 내용만 이어 붙이기) |

## 나. `light_bulb/prj.conf` 맨 아래에 추가

```
CONFIG_GPIO=y
CONFIG_SHELL=y
CONFIG_FPU=y
CONFIG_CBPRINTF_FP_SUPPORT=y
```

## 다. `light_bulb/CMakeLists.txt`

`target_sources(app PRIVATE` 로 시작하는 줄의 괄호 안 마지막에 추가:

```
 src/decision.c src/outputs.cpp
```

## 라. `light_bulb/src/zcl_callbacks.cpp`

맨 위 `#include` 줄들 바로 아래:

```cpp
void fan_relay_set(bool on);
```

`MatterPostAttributeChangeCallback` 함수의 `{` 바로 다음 줄 (원래 코드는 지우지 않음):

```cpp
    if (attributePath.mClusterId == OnOff::Id &&
        attributePath.mAttributeId == OnOff::Attributes::OnOff::Id &&
        attributePath.mEndpointId == 1) {
        fan_relay_set(*value);   /* 앱 전구가 켜지면 딸깍 */
    }
```

## 마. `light_bulb/src/app_task.cpp`

맨 위 `#include` 줄들 바로 아래:

```cpp
void outputs_init();
```

`AppTask::Init` 함수 끝의 `return CHIP_NO_ERROR;` 바로 **위** 줄:

```cpp
    outputs_init();
```

## 바. 빌드

**Pristine Build** → **Flash** (Erase 없이). 앱 등록 정보는 그대로 남습니다.
