# 침실 환경 면역 방어 노드

nRF54LM20 DK에서 도는 Matter over Thread 판단 노드와, 센서값을 만들어 보내는 가상 침실 시연 화면(`sim/sim.html`)입니다. 개요는 [`README.md`](README.md)에 있습니다.

새 노트북에서 시연을 준비할 때는 [`docs/노트북_세팅.md`](docs/노트북_세팅.md)를 위에서부터 따라 합니다.

## 규칙

- **콘솔 창을 화면에 띄우지 않는다.** Bash 안에서 `powershell`, `cmd`, `start`, `explorer`를 실행하지 않는다. 오래 걸리는 작업은 `run_in_background`, 계속 도는 Python은 `pythonw.exe`. Python에서 외부 프로그램을 띄울 때는 `creationflags=subprocess.CREATE_NO_WINDOW`. 서브에이전트 프롬프트에도 이 규칙을 넣는다.
- 웹 브라우징은 gstack `/browse`. `mcp__claude-in-chrome__*`는 쓰지 않는다.
- `west flash --erase`, 앱에서 기기 삭제, 스테이션 초기화는 사용자에게 먼저 묻는다. SmartThings 등록이 풀린다.
- 센서값은 가상 침실 모델이 만든다. 문서나 대사에서 센서가 실제로 붙어 있다고 하지 않는다.

## 하드웨어와 빌드

- 보드 타깃 `nrf54lm20dk/nrf54lm20b/cpuapp` (칩이 B). nRF Connect SDK v3.4.1.
- 릴레이는 LOW에서 켜짐. IN1 → P1.20 선풍기, IN2 → P1.21 가습기. P1.22는 LED0이라 쓰지 않는다.
- 시연용 펌웨어는 `firmware/light_bulb/`. 판단 로직은 `src/decision.c`이고, `sim/sim.html` 안에도 보드 없을 때 쓰는 같은 로직이 있다. 한쪽을 고치면 다른 쪽도 맞춘다.
- 빌드 경로에 띄어쓰기나 한글이 있으면 안 된다. 개발 PC는 junction `D:\ORCA\matter-iot`를 거쳐 빌드한다.
