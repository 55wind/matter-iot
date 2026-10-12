# 침실 환경 면역 방어 노드

nRF54LM20 DK + SmartThings Station(Matter over Thread)으로 벽 표면 습도를 계산해 가습기·선풍기를 임계 전에 조절하는 시연 노드.

설명서 원본은 [`docs/`](docs/)에 있습니다. 시연은 **`firmware/light_bulb`(통합 펌웨어) + `sim/sim.html`(가상 침실)** 조합을 씁니다.

## 폴더

| 폴더 | 내용 |
| --- | --- |
| `firmware/light_bulb/` | **시연용 통합 펌웨어.** Nordic light_bulb 예제 + 판단부(`src/decision.c`) + Matter 엔드포인트 5개 |
| `sim/sim.html` | **시연 화면 = 가상 침실.** 바깥 기온·벽·실내 수분을 계산해 센서값처럼 DK에 보내고, DK의 판단을 다시 받아 반영 (닫힌 고리) |
| `firmware/relay_test/` | 설명서 4단계: 릴레이 딸깍 시험 |
| `firmware/decision_node/` | 설명서 5단계: Matter 없는 판단 시험 (구버전 로직) |
| `firmware/matter_addon/` | 설명서 6단계 안내 (통합 펌웨어로 대체됨) |

## 하드웨어 (설명서와 다른 점)

- 칩이 **nRF54LM20B**라 보드 타깃은 `nrf54lm20dk/nrf54lm20b/cpuapp`
- 릴레이는 **LOW에서 켜짐** (`GPIO_ACTIVE_LOW`)
- 릴레이 IN1 → **P1.20** (선풍기), IN2 → **P1.21** (가습기). P1.22는 DK의 LED0이라 쓰지 않음
- DK와 대화하는 포트는 **COM3**
- DK 불빛: LED0 Matter 상태, LED1 선풍기, LED2 가습기, LED3 벽 표면 80% 이상 경고(위험 표시. 가습 정지는 75%에서 판단부가 P1.21로 내보냄)

## Matter 엔드포인트

| EP | 기기 종류 | 내용 |
| --- | --- | --- |
| 1 | Dimmable Light | 선풍기 (릴레이 IN1) |
| 2 | Humidity Sensor | **벽 표면 습도** (노드 계산값) |
| 3 | Humidity Sensor | 실내 습도 (방 습도계 값) |
| 4 | Temperature Sensor | 벽 표면 온도 |
| 5 | On/Off Plug-in Unit | 가습기 (릴레이 IN2) |

## 판단 로직 (`src/decision.c`)

- **A 곰팡이 방어:** 표면 습도 75%에서 가습 정지, 70% 아래에서만 재개
- **B 절대습도 확보:** 6.5 g/㎥ 아래면 가습, 8 g/㎥ 이상이면 정지 (목표 6 이상)
- **선풍기:** 표면 75%에 닿으면 켜고, 켤 때 벽 표면이 몇 ℃ 오르는지 스스로 잼(학습). "선풍기를 끄고 가습 목표까지 올려도 70% 아래"일 때만 끔. 선풍기가 켜져 있는 동안에도 허용 구간 안에서 가습함
- **C 침구 건조:** 기상 후 침구 습도가 60% 이상이면 가습을 멈추고 선풍기로 50% 미만까지 말림 (최대 45분)
- **D 국면 판정:** 침구 습도가 분당 0.3%p 넘게 오르면(실내보다 5%p 이상 습할 때) 취침, 분당 0.3%p 넘게 내리면 기상
- **E 예측:** 벽이 식는 추세로 임계(80%) 도달까지 남은 시간 계산
- **누적 위험 시간:** 표면 80% 이상이었던 시간 합계

시리얼 명령: `sim <실내온도> <실내습도> <벽온도> <침구습도> [가상시각_분]`, `dreset`(초기화), `hold <초>`

노드는 0.5초마다 `VAL ... bed=<침구습도> ph=<국면 0 대기, 1 취침, 2 기상> dry=<침구 건조 중>`을, 판단이 바뀔 때 `EVT ... why=<이유>`를 출력합니다.

## 빌드·플래시

SDK v3.4.1은 `D:\ncs`에 있습니다. 이 폴더 경로에 띄어쓰기가 있어서 **바로가기 `D:\ORCA\matter-iot`(junction)를 통해** 빌드합니다. PC 메모리가 빠듯하면 `-o=-j4`로 동시 컴파일 수를 줄입니다.

```bash
N="$APPDATA/nrfconnect/nrfutil.exe"; export ZEPHYR_BASE='D:\ncs\v3.4.1\zephyr'
"$N" sdk-manager toolchain launch --ncs-version v3.4.1 --chdir 'D:\ORCA\matter-iot\firmware\light_bulb' -- west build -b nrf54lm20dk/nrf54lm20b/cpuapp -d build -o=-j4 .
"$N" sdk-manager toolchain launch --ncs-version v3.4.1 --chdir 'D:\ORCA\matter-iot\firmware\light_bulb' -- west flash -d build --erase
```

엔드포인트를 바꾼 뒤에는 앱에서 기기를 지우고 `--erase`로 플래시한 다음 다시 등록합니다. 개발용 페어링 코드는 `34970112332`입니다.

## 시연

1. Serial Terminal 등 COM3을 쓰는 프로그램을 모두 닫습니다.
2. `sim/sim.html`을 Chrome으로 엽니다. 버튼이 안 먹히면 `sim` 폴더에서 `python -m http.server 8000`을 실행하고 `http://localhost:8000/sim.html`로 엽니다.
3. **포트 연결** → COM3 선택 → 오른쪽 위가 "보드가 판단 중"으로 바뀌는지 확인합니다.
4. **▶ 한파의 밤**을 누르면 22:00~08:00을 약 60초에 보여줍니다. **⟲ 처음으로**를 누르면 초기화됩니다.
5. 오른쪽 위 "Matter 연동" 칸에 SmartThings 허브 보고와 수신 확인이 올라오면 Matter 연결까지 정상입니다.

앱(다른 Matter 컨트롤러)에서 가습기·선풍기를 직접 조작하면 노드가 그 상태를 받아들이고 30분(가상 시각) 동안 존중합니다. 표면 습도 80% 이상이면 방어가 우선합니다.

보드를 연결하지 않으면 "보드 미연결 · 화면 안 계산"으로 표시되고, 같은 로직이 화면 안에서 돕니다(리허설·백업용).
