# 발표자료 생성

`build.js`(pptxgenjs)로 `발표자료_침실노드.pptx`를 만들고, `render.ps1`(PowerPoint COM)로 PDF와 슬라이드 PNG를 뽑습니다.
아이콘은 react-icons의 Tabler(MIT), Lucide(ISC) 아이콘을 `icons.js`로 PNG 렌더링한 것입니다.
4장 연결도의 기기 그림은 [Streamline](https://www.streamlinehq.com) Ultimate Color(CC BY 4.0)의 laptop, microchip-board, socket-box, router-signal, temperature-thermometer-high이고, 선풍기, 가습기, 스마트폰은 같은 스타일로 그려 `icons/devices/*.svg`에 넣었습니다. `node devices.js`로 PNG를 만듭니다. 폰트는 Pretendard(OFL)입니다.

```bash
cd docs/deck_src
npm install pptxgenjs@3.12.0 react-icons@5.4.0 react@18.3.1 react-dom@18.3.1 sharp@0.33.5
node icons.js                                  # icons/*.png
NODE_PATH=$PWD/node_modules PPTX_SKILL=<pptx 스킬 경로> node build.js out.pptx [시연화면.png] [세로/가로 비율]
powershell -File render.ps1 -Pptx <절대경로\out.pptx> -OutDir <짧은 경로\render> -Pdf <절대경로\out.pdf> -Embed <절대경로\글꼴포함.pptx>
```

글자는 모두 검정 Pretendard입니다(테마의 한글 글꼴까지 Pretendard로 바꿈). 3장 수식은 `build.js`의 `finish()`가 PowerPoint 수식 개체(OMML)로 넣습니다. 제출용 PPTX는 `-Embed`로 Pretendard를 넣어 PowerPoint에서 다시 저장한 파일입니다.

시연 화면 캡처는 두 번째 인자로 넘깁니다. 기본값 `scene_board.png`는 실제 보드(COM3)를 연결해 한파의 밤을 돌린 07:40 화면(기상 후 침구 건조 중)이고, 5장의 수치와 타임라인도 같은 실행에서 나온 값입니다.
