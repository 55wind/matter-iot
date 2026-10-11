# 침실 환경 면역 방어 노드

nRF54LM20 DK + SmartThings Station(Matter over Thread)으로 벽 표면 습도를 계산해 가습기·선풍기를 제어하는 시연 노드.

전체 작업 순서는 [`docs/`](docs/) 의 장비 테스트 설명서를 따릅니다. 설명서에서 복사·붙여넣기 하던 코드를 이 저장소에 파일로 넣어 두었습니다.

## 폴더

| 폴더 | 설명서 단계 | 내용 |
| --- | --- | --- |
| `firmware/relay_test/` | 4단계 | blinky + 릴레이 overlay. 2초마다 딸깍 |
| `firmware/decision_node/` | 5단계 | 판단 프로그램. `sim`, `hold` 셸 명령, LED1/LED2/릴레이 |
| `firmware/matter_addon/` | 6단계 | light_bulb 예제에 넣을 `outputs.cpp`와 붙여 넣을 위치 안내 |
| `sim/sim.html` | 7단계 | Web Serial 시연 화면 (Chrome) |

## 빌드 전에 꼭

**이 폴더(`D:\ORCA\matter iot`)는 경로에 띄어쓰기가 있어서 바로 빌드하면 실패할 수 있습니다.** 한글·띄어쓰기 없는 곳으로 복제해서 빌드하세요.

```bash
git clone "D:/ORCA/matter iot" C:/ncs-work/orca
```

VS Code nRF Connect에서 **Open an existing application** → `C:\ncs-work\orca\firmware\decision_node` 선택 → Board target `nrf54lm20dk/nrf54lm20a/cpuapp`.

명령 창이라면:

```bash
west build -b nrf54lm20dk/nrf54lm20a/cpuapp firmware/decision_node -p
west flash
```

**GPIO 핀:** `relay_test`와 `decision_node`의 `boards/*.overlay` 둘 다 `<&gpio1 4` 를 4단계에서 고른 GPIO A 핀으로 바꿔야 합니다.
