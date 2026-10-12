// 침실 환경 면역 방어 노드 발표자료 5장 (pptxgenjs). 아이콘: Tabler(MIT), Lucide(ISC) via react-icons
// 글자는 모두 검정 Pretendard. 수식은 PowerPoint 수식 개체(OMML)로 넣음 (injectMath)
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const DIR = __dirname;
const OUT = process.argv[2] || path.join(DIR, "deck.pptx");
const SCENE = process.argv[3] || path.join(DIR, "scene_board.png");
const SCENE_RATIO = Number(process.argv[4] || 9 / 16);
const PHONE = path.join(DIR, "phone_smartthings.png");
const ICON = (n, c = "white") => path.join(DIR, "icons", `${n}-${c}.png`);
const FONT = "Pretendard";

const THEME = {
  name: "Bedroom Node",
  headFontFace: FONT,
  bodyFontFace: FONT,
  colors: {
    dk1: "000000", lt1: "FFFFFF", dk2: "000000", lt2: "F5F5F7",
    accent1: "0066CC", accent2: "1D5C45", accent3: "E30000", accent4: "BF4800",
    accent5: "8E8E93", accent6: "2997FF", hlink: "0066CC", folHlink: "000000",
  },
};
const HEX = { ink: "000000", hair: "E0E0E0", parch: "F5F5F7", blue: "0066CC", red: "E30000", green: "1D5C45", barLight: "8CB8E8" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "침실 환경 면역 방어 노드";
pres.author = "밤새고 네집내집가기";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "label", type: "body", x: 0.6, y: 0.32, w: 8, h: 0.32, fontSize: 13, bold: true, color: C.text1, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.62, w: 12.1, h: 0.72, fontSize: 30, bold: true, color: C.text1, margin: 0, valign: "top", align: "left" }, text: "" } },
    { text: { text: "침실 환경 면역 방어 노드  |  팀 밤새고 네집내집가기  |  지능형 홈(AI@Home) Matter AX Sprint 2026", options: { x: 0.6, y: 7.05, w: 9, h: 0.25, fontSize: 10, color: C.text1, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.05, w: 0.5, h: 0.25, fontSize: 10, color: C.text1, align: "right" },
});

const T = (slide, text, o) => slide.addText(text, Object.assign({ isTextBox: true, margin: 0, color: C.text1, fontSize: 14, valign: "top" }, o));
const card = (slide, x, y, w, h, o = {}) => slide.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ x, y, w, h, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: HEX.hair, width: 0.75 } }, o));
/* 반복 모티프: 파란 원 안의 흰 아이콘 */
const badge = (slide, name, x, y, d = 0.46, fill = C.accent1) => {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: HEX.blue, width: 0 } });
  const p = d * 0.22;
  slide.addImage({ path: ICON(name, "white"), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: name });
};
const head = (cells) => cells.map((t) => ({ text: t, options: { bold: true, fill: { color: HEX.parch }, color: HEX.ink, align: "center" } }));
const tableOpts = (x, y, w, colW, extra = {}) => Object.assign({ x, y, w, colW, fontSize: 13, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.hair }, margin: [0.05, 0.08, 0.05, 0.08], align: "center", valign: "middle", fontFace: FONT }, extra);
/* 아이콘 행: 원형 아이콘 + 굵은 제목 + 설명 */
const iconRow = (slide, name, x, y, w, title, desc, o = {}) => {
  badge(slide, name, x, y, o.d || 0.46, o.fill);
  const lines = Array.isArray(desc) ? desc : [desc];
  T(slide, [{ text: title, options: { bold: true, breakLine: true } }, ...lines.map((l, k) => ({ text: l, options: { fontSize: o.descSize || 13, breakLine: k < lines.length - 1 } }))],
    { x: x + (o.d || 0.46) + 0.2, y: y - 0.04, w: w - (o.d || 0.46) - 0.2, h: o.h || 0.62, fontSize: o.size || 14 });
};

/* 오른쪽 위: 핵심 주제 / 주요 개발 내용 / 시연 내용 중 지금 위치 */
const PARTS = [["핵심 주제", 0.95], ["주요 개발 내용", 1.35], ["시연 내용", 0.95]];
const tracker = (slide, cur) => {
  let x = 12.75 - PARTS.reduce((a, [, w]) => a + w, 0) - 0.1 * (PARTS.length - 1);
  PARTS.forEach(([t, w], i) => {
    if (i === cur) slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 0.28, w, h: 0.32, rectRadius: 0.16, fill: { color: HEX.parch }, line: { color: HEX.blue, width: 1 } });
    T(slide, t, { x, y: 0.28, w, h: 0.32, fontSize: 11.5, bold: i === cur, align: "center", valign: "middle" });
    x += w + 0.1;
  });
};

/* ---------- 1. 핵심 주제 ---------- */
if (!process.env.SKIP_SECTION) pres.addSection({ title: "핵심 주제" });
let s = pres.addSlide({ masterName: "CONTENT", sectionTitle: process.env.SKIP_SECTION ? undefined : "핵심 주제" });
s.addText("핵심 주제  (응모 분야 Living Assist)", { placeholder: "label" });
s.addText("방 습도계가 45%여도 차가운 벽 표면은 80%임", { placeholder: "title" });
tracker(s, 0);
T(s, "벽 표면 습도를 계산해 곰팡이 임계 전에 가습기와 선풍기를 스스로 조절하는 Matter 디바이스를 제안함", { x: 0.6, y: 1.36, w: 12.1, h: 0.35, fontSize: 15 });

card(s, 0.6, 1.95, 2.9, 1.9);
s.addImage({ path: ICON("gauge", "ink"), x: 2.95, y: 2.1, w: 0.38, h: 0.38, altText: "습도계" });
T(s, "실내 습도 (방 습도계)", { x: 0.85, y: 2.12, w: 2.1, h: 0.3, fontSize: 13 });
T(s, "45%", { x: 0.85, y: 2.42, w: 2.5, h: 0.95, fontSize: 54, bold: true });
T(s, "방 공기 기준 값", { x: 0.85, y: 3.38, w: 2.5, h: 0.3, fontSize: 13 });
card(s, 3.75, 1.95, 2.9, 1.9, { fill: { color: "FFFFFF" }, line: { color: HEX.red, width: 1.5 } });
s.addImage({ path: ICON("snow", "blue"), x: 6.1, y: 2.1, w: 0.38, h: 0.38, altText: "차가운 벽" });
T(s, "12℃ 북측 벽 표면", { x: 4.0, y: 2.12, w: 2.1, h: 0.3, fontSize: 13 });
T(s, "80%", { x: 4.0, y: 2.42, w: 2.5, h: 0.95, fontSize: 54, bold: true });
T(s, "ISO 13788 곰팡이 임계", { x: 4.0, y: 3.38, w: 2.5, h: 0.3, fontSize: 13 });

T(s, "서로 충돌하는 침실의 세 목표", { x: 0.6, y: 4.1, w: 6.05, h: 0.32, fontSize: 15, bold: true });
iconRow(s, "bed", 0.6, 4.55, 6.05, "① 수면: 침실 18~20℃", "사용자가 정하는 제약 조건임 (Prather, SLEEP 2015)");
iconRow(s, "shield", 0.6, 5.25, 6.05, "② 점막 방어: 절대습도 6 g/㎥ 이상", "노드가 제어함 (Shaman & Kohn, PNAS 2009)");
iconRow(s, "virus", 0.6, 5.95, 6.05, "③ 곰팡이와 진드기: 벽 표면 80% 이하", "노드가 제어함 (ISO 13788:2012)");

const cats = ["15℃", "12℃", "9℃", "약 7.2℃", "6℃"];
if (!process.env.SKIP_CHART) s.addChart([
  { type: pres.charts.BAR, data: [{ name: "허용 상한 (벽 표면 80%)", labels: cats, values: [55, 45, 37, 33, 30] }], options: { chartColors: [HEX.barLight], barGapWidthPct: 60, showValue: true, dataLabelPosition: "inBase", dataLabelFontSize: 12, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: '0"%"' } },
  { type: pres.charts.LINE, data: [{ name: "요구 하한 (절대습도 6 g/㎥)", labels: cats, values: [33, 33, 33, 33, 33] }], options: { chartColors: [HEX.red], lineSize: 2, lineDataSymbol: "none", showValue: false } },
], {
  x: 7.0, y: 1.95, w: 5.75, h: 4.0,
  showTitle: true, title: "벽 표면 온도별 허용 실내 습도 (실내 21℃)", titleFontSize: 14, titleColor: HEX.ink, titleFontFace: "+mn-lt",
  catAxisLabelColor: HEX.ink, valAxisLabelColor: HEX.ink, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
  valAxisMinVal: 0, valAxisMaxVal: 70, valAxisMajorUnit: 10, valAxisLabelFormatCode: '0"%"',
  valGridLine: { color: "EDEDED", size: 0.75 }, catGridLine: { style: "none" },
  showLegend: true, legendPos: "b", legendFontSize: 12, legendColor: HEX.ink, legendFontFace: "+mn-lt",
});
T(s, [{ text: "벽이 약 7.2℃ 아래로 내려가면 두 목표를 함께 만족하는 구간이 사라짐.", options: { breakLine: true } }, { text: "노드는 선풍기로 벽 표면을 데워 이 구간을 되찾음." }],
  { x: 7.0, y: 6.05, w: 5.75, h: 0.7, fontSize: 14 });
s.addNotes("방 습도계가 45%로 안전해 보여도 12℃까지 식은 북측 벽 표면에 닿은 공기는 80%임. 곰팡이 임계는 벽 표면 값으로 정해짐. 수면, 점막 방어, 곰팡이 세 목표가 서로 충돌하고, 벽 온도에 따라 허용 습도 구간이 30%에서 55%까지 달라짐. 이 구간을 계산해 지키는 것이 이 노드임.");

/* ---------- 2. 개발 환경과 Matter SDK ---------- */
if (!process.env.SKIP_SECTION) pres.addSection({ title: "주요 개발 내용" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: process.env.SKIP_SECTION ? undefined : "주요 개발 내용" });
s.addText("주요 개발 내용 ① 개발 환경과 Matter SDK", { placeholder: "label" });
s.addText("nRF Connect SDK로 노드 하나를 엔드포인트 6개로 직접 구성함", { placeholder: "title" });
tracker(s, 1);
const two = (a, b) => [{ text: a, options: { breakLine: true } }, { text: b }];
T(s, "개발 환경", { x: 0.6, y: 1.5, w: 5.6, h: 0.3, fontSize: 14, bold: true });
s.addTable([
  head(["구분", "내용"]),
  [{ text: "사용 언어", options: { bold: true } }, { text: two("C (판단 로직), C++ (Matter 앱)", "JavaScript, HTML (시연 화면), Python (시험 도구)") }],
  [{ text: "사용 기기", options: { bold: true } }, { text: two("nRF54LM20 DK, 2채널 릴레이, 노트북", "SmartThings Station, 스마트폰 (SmartThings 앱)") }],
  [{ text: "SDK, 도구", options: { bold: true } }, { text: two("nRF Connect SDK v3.4.1 (Zephyr RTOS, Matter)", "ZAP, west, J-Link, nrfutil") }],
  [{ text: "통신", options: { bold: true } }, { text: two("Matter over Thread, BLE 커미셔닝", "USB 시리얼 (Web Serial, 115200)") }],
], tableOpts(0.6, 1.85, 5.6, [1.2, 4.4], { rowH: [0.35, 0.52, 0.52, 0.52, 0.52], fontSize: 11 }));

T(s, "Matter SDK 활용", { x: 0.6, y: 4.45, w: 5.6, h: 0.3, fontSize: 14, bold: true });
const steps = [
  ["db", "ZAP 데이터 모델", "light_bulb.zap에 EP2~EP5를 추가해 west zap-generate로 생성함"],
  ["upload", "속성 게시", "Accessors로 값을 설정하면 SDK가 허브에 ReportData로 보고함"],
  ["hand", "앱 조작 수신", "MatterPostAttributeChangeCallback으로 받아 릴레이와 판단부에 반영함"],
  ["qr", "커미셔닝", "공장 데이터와 BLE로 SmartThings에 등록하고 Thread에 합류함"],
];
steps.forEach(([ic, h, d], i) => iconRow(s, ic, 0.6, 4.88 + i * 0.5, 5.6, h, d, { d: 0.38, h: 0.46, size: 12, descSize: 11 }));

T(s, "Matter 엔드포인트 (표준 클러스터)", { x: 6.5, y: 1.5, w: 6.25, h: 0.3, fontSize: 14, bold: true });
s.addTable([
  head(["EP", "디바이스 타입", "표준 클러스터", "노드가 하는 일"]),
  ["0", "Root Node", "Basic Info, 커미셔닝, Thread", "커미셔닝, Thread 합류"],
  ["1", "Dimmable Light → 선풍기", "On/Off, Level, Identify", "On/Off → 릴레이 CH1"],
  ["2", "Humidity Sensor", "Relative Humidity Meas.", "벽 표면 습도 (노드 계산)"],
  ["3", "Humidity Sensor", "Relative Humidity Meas.", "실내 습도 (방 습도계)"],
  ["4", "Temperature Sensor", "Temperature Measurement", "벽 표면 온도"],
  ["5", "On/Off Plug-in → 가습기", "On/Off, Groups", "On/Off → 릴레이 CH2"],
], tableOpts(6.5, 1.85, 6.25, [0.38, 1.85, 2.17, 1.85], { rowH: 0.35, fontSize: 10.5, margin: [0.04, 0.05, 0.04, 0.05] }));

s.addImage({ path: PHONE, x: 6.5, y: 4.45, w: 2.35 * 648 / 1404, h: 2.35, altText: "SmartThings 앱에 등록된 노드" });
const stat = (ic, x, y, big, small) => {
  s.addImage({ path: ICON(ic, "blue"), x, y: y + 0.05, w: 0.3, h: 0.3, altText: ic });
  T(s, big, { x: x + 0.38, y, w: 1.9, h: 0.42, fontSize: 20, bold: true });
  T(s, small, { x, y: y + 0.44, w: 2.3, h: 0.3, fontSize: 10.5 });
};
stat("wave", 7.85, 4.5, "12 / 12", "허브 보고 / 수신 확인 (시연 1회)");
stat("chart", 10.35, 4.5, "92 ms", "보고 후 허브 응답 (평균)");
stat("cpu", 7.85, 5.4, "42%", "Flash 사용 (RAM 36%)");
stat("db", 10.35, 5.4, "v3.4.1", "nRF Connect SDK");
T(s, two("왼쪽: SmartThings 앱 등록 화면", "앱은 센서 EP를 표시하지 않아 시연 화면에서 보여줌"), { x: 7.85, y: 6.3, w: 4.9, h: 0.48, fontSize: 10.5 });
s.addNotes("펌웨어는 C와 C++로, 시연 화면은 JavaScript와 HTML로, 시험 도구는 Python으로 작성함. nRF Connect SDK v3.4.1의 Matter 예제 위에 엔드포인트를 직접 추가함. 습도와 온도는 표준 측정 클러스터로, 가습기와 선풍기는 On/Off로 노출함. 판단부가 속성을 설정하면 SDK가 허브로 ReportData를 보내고, 시연 1회 동안 12번 보고해 12번 모두 수신 확인을 받았으며 응답은 평균 92ms였음. 앱에서 직접 조작한 값은 콜백으로 받아 판단부에 반영함. 칩이 nRF54LM20B라 보드 타깃을 b로 빌드함.");

/* ---------- 4. 온디바이스 판단 ---------- */
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: process.env.SKIP_SECTION ? undefined : "주요 개발 내용" });
s.addText("주요 개발 내용 ② 온디바이스 판단", { placeholder: "label" });
s.addText("노드가 스스로 계산하고 학습하고 개입함", { placeholder: "title" });
tracker(s, 1);
card(s, 0.6, 1.5, 6.55, 5.3);
badge(s, "calc", 0.85, 1.72, 0.42);
T(s, "계산: 차가운 벽 앞 공기의 습도를 구함", { x: 1.42, y: 1.68, w: 5.5, h: 0.3, fontSize: 16, bold: true });
T(s, "DK가 0.5초마다 직접 계산함, 클라우드 불필요", { x: 1.42, y: 1.99, w: 5.5, h: 0.24, fontSize: 11.5 });
/* 수식 자리: 상자에는 대체 글자를 넣고, finish()가 PowerPoint 수식 개체로 바꿈 (eq*: 수식만, mx_*: 글자와 수식이 섞인 줄) */
T(s, "T실내: 방 온도, T벽: 벽 표면 온도, RH: 상대습도(%), Pₛ: 포화 수증기압(hPa)", { x: 0.85, y: 2.36, w: 6.1, h: 0.34, fontSize: 11.5, valign: "middle", objectName: "mx_lg" });
s.addShape(pres.shapes.LINE, { x: 0.85, y: 2.8, w: 6.05, h: 0, line: { color: HEX.hair, width: 0.75 } });
const calc = [
  ["① 포화 수증기압", ["온도별로 공기가 품을 수 있는", "수증기의 최대치임"], "Pₛ(T) = 6.112 exp(17.62T / (243.12 + T))"],
  ["② 벽 표면 상대습도", ["방 공기가 벽 온도로", "식었을 때의 습도임"], "RH표면 = RH실내 × Pₛ(T실내) / Pₛ(T벽)"],
  ["③ 절대습도 (g/㎥)", ["공기 1㎥에 든 수증기 양,", "점막 방어의 기준임"], "AH = 216.7 × RH × Pₛ(T) / (100 (273.15 + T))"],
  ["④ 허용 상한 (표 3)", ["벽 표면이 80%를 넘지 않는", "실내 습도의 최댓값임"], "RH상한 = 80 × Pₛ(T벽) / Pₛ(T실내)"],
];
calc.forEach(([h, d, f], i) => {
  const y = 2.9 + i * 0.82;
  T(s, [{ text: h, options: { bold: true, breakLine: true } }, { text: d[0], options: { fontSize: 11.5, breakLine: true } }, { text: d[1], options: { fontSize: 11.5 } }], { x: 0.85, y, w: 2.55, h: 0.74, fontSize: 13, valign: "middle" });
  T(s, f, { x: 3.5, y, w: 3.5, h: 0.74, fontSize: 15, valign: "middle", objectName: `eq${i}` });
});
/* 예시: 1장의 45% → 80% */
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 6.17, w: 6.15, h: 0.56, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { color: HEX.hair, width: 0.75 } });
T(s, [{ text: "예) 방 21℃, 45%이고", options: { breakLine: true } }, { text: "벽이 12℃이면" }], { x: 0.95, y: 6.17, w: 2.45, h: 0.56, fontSize: 12, valign: "middle" });
T(s, "RH표면 = 45 × 24.8 / 14.0 ≈ 80%", { x: 3.5, y: 6.17, w: 3.4, h: 0.56, fontSize: 14, valign: "middle", objectName: "eq4" });

T(s, "판단 규칙", { x: 7.45, y: 1.5, w: 5.3, h: 0.32, fontSize: 15, bold: true });
const rules = [
  ["shield", "A 곰팡이 방어", "벽 표면 75%에서 가습 정지, 70% 미만에서만 재개함"],
  ["droplet", "B 점막 방어", "절대습도 6.5 g/㎥ 미만이면 가습, 8 g/㎥에서 정지함"],
  ["fan", "선풍기 개입", "가습을 멈춰도 75% 이상이면 선풍기로 벽 표면을 데움"],
  ["brain", "E 학습", "선풍기 효과(시연 +2.8℃)를 재서 끄는 시점을 판단함"],
  ["chart", "E 예측", "벽 온도 추세로 임계 80%까지 남은 시간을 계산함"],
  ["join", "동시 가동", "선풍기로 넓힌 구간에서 켠 채 가습해 ②, ③을 함께 지킴"],
  ["user", "사용자 우선", "앱 조작은 30분 존중, 벽 표면 80%를 넘으면 방어를 우선함"],
  ["history", "기록", "벽 표면 80% 이상인 시간을 누적 위험 시간으로 기록함"],
];
rules.forEach(([ic, h, d], i) => iconRow(s, ic, 7.45, 1.98 + i * 0.6, 5.3, h, d, { d: 0.4, h: 0.56, size: 13, descSize: 12 }));
s.addNotes("노드는 0.5초마다 벽 표면 습도와 절대습도를 계산함. 예를 들어 방이 21℃, 45%이고 벽이 12℃이면 벽 표면 습도는 약 80%로 곰팡이 임계에 닿음. 75%에서 가습을 멈추고, 그래도 오르면 선풍기를 켬. 선풍기를 켤 때 벽이 몇 도 오르는지 스스로 재서, 선풍기를 꺼도 안전한지를 판단함. 선풍기로 허용 구간을 넓힌 뒤에는 선풍기를 켠 채로 가습을 이어가 점막 방어와 곰팡이 방어를 동시에 지킴.");

/* ---------- 4. 시연 구성: 기기 간 연결과 기기별 역할 ---------- */
if (!process.env.SKIP_SECTION) pres.addSection({ title: "시연 내용" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: process.env.SKIP_SECTION ? undefined : "시연 내용" });
s.addText("시연 내용 ① 시연 구성: 기기 간 연결과 역할", { placeholder: "label" });
s.addText("기기마다 역할을 나눠 하나의 고리로 동작함", { placeholder: "title" });
tracker(s, 2);
/* 기기 그림 + 이름 + 역할을 화살표로 연결 (그림: Streamline Ultimate Color, CC BY 4.0. 선풍기, 가습기, 스마트폰은 같은 스타일로 그림) */
const DEV = (n) => path.join(DIR, "icons", "devices", `${n}.png`);
const CX = [1.85, 5.07, 8.29, 11.51], IS = 0.75, R1 = 1.5, R2 = 3.15, GRAY = "6E6E73";
const device = (imgs, cx, y, name, role, o = {}) => {
  imgs.forEach((img, k) => {
    const x = cx - IS / 2 + (imgs.length === 2 ? (k ? 0.42 : -0.42) : 0);
    s.addImage({ path: DEV(img), x, y, w: IS, h: IS, altText: name, transparency: o.ghost ? 50 : 0 });
  });
  T(s, [{ text: name, options: { bold: true, breakLine: true } }, { text: role, options: { fontSize: 10.5 } }],
    { x: cx - 1.3, y: y + IS + 0.03, w: 2.6, h: 0.46, fontSize: 12, align: "center" });
};
const arrow = (x, y, w, h, o = {}) => s.addShape(pres.shapes.LINE, { x, y, w, h, line: { color: o.color || GRAY, width: 1.75, dashType: o.dash ? "dash" : "solid", beginArrowType: o.both ? "triangle" : undefined, endArrowType: o.noEnd ? undefined : "triangle" } });
const hLabel = (x0, w, y, top, bottom) => {
  T(s, top, { x: x0 - 0.2, y: y - 0.3, w: w + 0.4, h: 0.24, fontSize: 10.5, bold: true, align: "center" });
  T(s, bottom, { x: x0 - 0.2, y: y + 0.06, w: w + 0.4, h: 0.22, fontSize: 9.5, align: "center" });
};
device(["laptop"], CX[0], R1, "노트북", "가상 침실 계산, 시연 화면");
device(["board"], CX[1], R1, "nRF54LM20 DK", "판단 노드, Matter 기기");
device(["relay"], CX[2], R1, "2채널 릴레이", "가전 전원 개입");
device(["fan", "humidifier"], CX[3], R1, "선풍기, 가습기", "벽 데움, 가습 (화면 속 가전)");
device(["sensor"], CX[0], R2, "온습도, 벽 온도 센서", "실제 제품 구성", { ghost: true });
device(["hub"], CX[1], R2, "SmartThings Station", "Thread 보더 라우터, 허브");
device(["phone"], CX[2], R2, "SmartThings 앱", "등록, 원격 On/Off");
/* 1행: 노트북 ↔ DK → 릴레이 → 가전 */
const y1 = R1 + IS / 2;
const row1 = [
  [CX[0] + 0.55, CX[1] - 0.55, "USB 시리얼", "센서값 → DK, 판단 결과 → 화면", HEX.blue, true],
  [CX[1] + 0.55, CX[2] - 0.55, "GPIO P1.20, P1.21", "LOW 신호면 켜짐", GRAY, false],
  [CX[2] + 0.55, CX[3] - 0.92, "전원 ON/OFF", "CH1 선풍기, CH2 가습기", GRAY, false],
];
row1.forEach(([a, b, top, bottom, color, both]) => { arrow(a, y1, b - a, 0, { color, both }); hLabel(a, b - a, y1, top, bottom); });
/* DK ↔ Station (Thread), 노트북 ┆ 센서 */
const vy = R1 + IS + 0.52, vh = R2 - vy - 0.06;
arrow(CX[1], vy, 0, vh, { color: HEX.blue, both: true });
T(s, "Thread (Matter 보고, 명령)", { x: CX[1] + 0.12, y: vy + 0.02, w: 2.4, h: 0.26, fontSize: 10.5, bold: true });
arrow(CX[0], vy, 0, vh, { dash: true, noEnd: true });
T(s, "시연에서는 노트북이 대신함", { x: CX[0] + 0.12, y: vy + 0.02, w: 2.4, h: 0.26, fontSize: 10.5, bold: true });
/* 2행: Station ↔ 앱 (Wi-Fi) */
const y2 = R2 + IS / 2;
arrow(CX[1] + 0.55, y2, CX[2] - CX[1] - 1.1, 0, { color: HEX.blue, both: true });
hLabel(CX[1] + 0.55, CX[2] - CX[1] - 1.1, y2, "Wi-Fi", "SmartThings 클라우드");
/* 범례와 그림 출처 */
const LX = 10.3;
[["통신 (USB, Thread, Wi-Fi)", HEX.blue, false], ["전기 신호 (GPIO, 전원)", GRAY, false], ["실제 제품에서 센서가 들어갈 자리", GRAY, true]].forEach(([t, color, dash], i) => {
  const y = R2 + 0.12 + i * 0.3;
  arrow(LX, y + 0.13, 0.4, 0, { color, dash, noEnd: dash });
  T(s, t, { x: LX + 0.5, y, w: 2.0, h: 0.26, fontSize: 10, valign: "middle" });
});
T(s, "기기 그림: Streamline (CC BY 4.0)", { x: LX, y: R2 + 1.0, w: 2.45, h: 0.22, fontSize: 9 });

/* 기기별 역할 */
s.addTable([
  head(["기기", "맡은 역할", "연결"]),
  ["노트북", "가상 침실 계산, 시연 화면", "USB 시리얼"],
  ["nRF54LM20 DK", "표면 습도 계산, 판단, 릴레이 구동", "USB, GPIO, Thread"],
  ["2채널 릴레이", "선풍기, 가습기 전원 개입", "GPIO P1.20, P1.21"],
  ["선풍기, 가습기", "벽 데움, 가습 (화면 속 가전)", "릴레이 CH1, CH2"],
  ["SmartThings Station", "Thread 보더 라우터, Matter 허브", "Thread, Wi-Fi"],
  ["SmartThings 앱", "노드 등록, 원격 On/Off", "BLE(등록), Wi-Fi"],
], tableOpts(0.6, 4.5, 7.0, [1.85, 3.0, 2.15], { rowH: 0.33, fontSize: 11 }));

/* 배선도 (도형) */
const WX = 7.85, WY = 4.5;
T(s, "회로: DK ↔ 2채널 릴레이", { x: WX, y: WY, w: 4.9, h: 0.3, fontSize: 13, bold: true });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: WX, y: WY + 0.34, w: 2.3, h: 1.98, rectRadius: 0.1, fill: { color: "FFFFFF" }, line: { color: HEX.green, width: 1.5 } });
T(s, "nRF54LM20 DK", { x: WX + 0.13, y: WY + 0.45, w: 1.7, h: 0.28, fontSize: 12, bold: true });
s.addImage({ path: ICON("cpu", "green"), x: WX + 1.95, y: WY + 0.47, w: 0.24, h: 0.24, altText: "DK" });
const RX = 10.95;
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: RX, y: WY + 0.34, w: 1.8, h: 1.98, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: HEX.hair, width: 0.75 } });
T(s, [{ text: "2채널 릴레이", options: { bold: true, breakLine: true } }, { text: "LOW에서 켜짐", options: { fontSize: 10, bold: false } }], { x: RX + 0.1, y: WY + 0.43, w: 1.4, h: 0.45, fontSize: 12 });
s.addImage({ path: ICON("plug", "ink"), x: RX + 1.47, y: WY + 0.47, w: 0.24, h: 0.24, altText: "릴레이" });
const pins = [
  ["LED0 Matter 상태", "5V0", "DC+", "E30000", "5V 전원", ""],
  ["LED1 선풍기", "GND", "DC−", "1D1D1F", "접지", ""],
  ["LED2 가습기", "P1.20", "IN1", HEX.blue, "선풍기 신호", "CH1 선풍기"],
  ["LED3 표면 80%↑", "P1.21", "IN2", "F08A00", "가습기 신호", "CH2 가습기"],
];
pins.forEach(([led, dk, rl, col, wire, ch], i) => {
  const y = WY + 0.9 + i * 0.35;
  s.addShape(pres.shapes.OVAL, { x: WX + 0.13, y: y + 0.1, w: 0.11, h: 0.11, fill: { color: "30D158" }, line: { color: "30D158", width: 0 } });
  T(s, led, { x: WX + 0.29, y, w: 1.25, h: 0.3, fontSize: 9.5, valign: "middle" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: WX + 1.55, y, w: 0.68, h: 0.3, rectRadius: 0.05, fill: { color: "FFFFFF" }, line: { color: "C7C7CC", width: 0.75 } });
  T(s, dk, { x: WX + 1.55, y, w: 0.68, h: 0.3, fontSize: 10, bold: true, align: "center", valign: "middle" });
  s.addShape(pres.shapes.LINE, { x: WX + 2.23, y: y + 0.15, w: RX + 0.1 - WX - 2.23, h: 0, line: { color: col, width: 3 } });
  T(s, wire, { x: WX + 2.2, y: y - 0.11, w: RX + 0.16 - WX - 2.2, h: 0.2, fontSize: 9, align: "center" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: RX + 0.1, y, w: 0.55, h: 0.3, rectRadius: 0.05, fill: { color: "FFFFFF" }, line: { color: "C7C7CC", width: 0.75 } });
  T(s, rl, { x: RX + 0.1, y, w: 0.55, h: 0.3, fontSize: 10, bold: true, align: "center", valign: "middle" });
  if (ch) {
    s.addImage({ path: ICON(i === 2 ? "fan" : "mist", i === 2 ? "blue" : "ink"), x: RX + 0.7, y: y + 0.04, w: 0.22, h: 0.22, altText: ch });
    T(s, ch, { x: RX + 0.95, y, w: 0.85, h: 0.3, fontSize: 9.5, bold: true, valign: "middle" });
  }
});
s.addNotes("시연에 쓰는 기기와 연결임. 노트북은 가상 침실을 계산해 센서 대신 0.5초마다 USB로 DK에 값을 보내고, DK는 벽 표면 습도를 계산해 판단한 뒤 GPIO로 릴레이를 움직여 선풍기와 가습기 전원을 켜고 끔. 같은 결과는 Thread로 SmartThings Station에 Matter 보고되고, 앱에서 상태를 보고 조작할 수 있음. 실제 제품에서는 노트북 자리에 온습도 센서와 벽 온도 센서가 들어감. 릴레이는 LOW에서 켜지는 모듈이라 overlay에서 핀을 active-low로 정의했고, P1.22는 DK의 LED0 핀과 겹쳐 P1.21로 옮김.");

/* ---------- 5. 시연 화면과 구동 순서 ---------- */
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: process.env.SKIP_SECTION ? undefined : "시연 내용" });
s.addText("시연 내용 ② 시연 화면과 구동 순서", { placeholder: "label" });
tracker(s, 2);
s.addText("한파의 밤 10시간을 60초로 재현해 누적 위험 시간 0분을 달성함", { placeholder: "title" });
const sw = 7.9, sh = Math.min(sw * SCENE_RATIO, 4.3);
s.addImage({ path: SCENE, x: 0.6, y: 1.5, w: sh / SCENE_RATIO, h: sh, altText: "시연 화면: 가상 침실과 판단 노드" });
T(s, "실제 보드를 연결한 03:00 화면. 실내와 벽 표면 습도, 노드의 판단, 가습기와 선풍기, 허브 보고를 한 화면에 보여줌",
  { x: 0.6, y: 1.5 + sh + 0.08, w: 7.9, h: 0.3, fontSize: 11 });

/* 구동 순서: ①~⑤를 0.5초마다 반복, ⑥ 결과 */
const seq = [
  ["laptop", "① 가상 침실", ["한파의 밤 10시간을 60초로 진행함", "가전 상태를 반영해 온습도와 벽 온도를 만듦"]],
  ["upload", "② 센서값 전송", ["0.5초마다 USB로 DK에 보냄", "실제 제품에서는 센서가 이 값을 측정함"]],
  ["cpu", "③ DK 판단", ["벽 표면 습도와 절대습도를 계산해", "가습기와 선풍기 ON/OFF를 결정함"]],
  ["plug", "④ 릴레이 구동", ["CH1 선풍기, CH2 가습기 전원을 켜고 끔", "딸깍 소리와 함께 가전이 실제로 바뀜"]],
  ["wave", "⑤ Matter 보고", ["같은 결과를 SmartThings 허브에 보고함", "12회 모두 수신 확인, 평균 92ms"]],
  ["shield", "⑥ 결과: 누적 위험 시간", ["우리 노드 0분, 최고 벽 표면 78%", "일반 가습기였다면 8시간 38분, 결로 6시간 14분"]],
];
s.addShape(pres.shapes.LINE, { x: 9.06, y: 1.71, w: 0, h: 3.6, line: { color: HEX.hair, width: 1.5 } });
/* ⑤ → ① 되돌아가는 점선 (닫힌 고리) */
s.addShape(pres.shapes.LINE, { x: 8.64, y: 4.59, w: 0.21, h: 0, line: { color: "8E8E93", width: 1.5, dashType: "dash" } });
s.addShape(pres.shapes.LINE, { x: 8.64, y: 1.71, w: 0, h: 2.88, line: { color: "8E8E93", width: 1.5, dashType: "dash" } });
s.addShape(pres.shapes.LINE, { x: 8.64, y: 1.71, w: 0.21, h: 0, line: { color: "8E8E93", width: 1.5, dashType: "dash", endArrowType: "triangle" } });
seq.forEach(([ic, h, d], i) => iconRow(s, ic, 8.85, 1.5 + i * 0.72, 3.9, h, d, { d: 0.42, h: 0.66, size: 13, descSize: 11.5 }));

const tl = [["22:00", "건조 → 가습 시작"], ["01:00", "표면 75% → 가습 정지"], ["01:10", "선풍기 ON, 효과 학습"], ["02:55~", "선풍기 켠 채 가습"], ["07:30", "벽 회복 → 선풍기 OFF"]];
s.addShape(pres.shapes.LINE, { x: 0.7, y: 6.36, w: 11.95, h: 0, line: { color: HEX.hair, width: 1.5 } });
tl.forEach(([t, d], i) => {
  const x = 0.6 + i * 2.45;
  s.addShape(pres.shapes.OVAL, { x, y: 6.27, w: 0.18, h: 0.18, fill: { color: C.accent1 }, line: { color: HEX.blue, width: 0 } });
  T(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: {} }], { x, y: 6.5, w: 2.3, h: 0.5, fontSize: 12 });
});
s.addNotes("시연은 오른쪽 순서로 동작함. 노트북의 가상 침실이 한파의 밤을 진행하며 0.5초마다 센서값을 DK로 보내고, DK가 벽 표면 습도를 계산해 릴레이로 가습기와 선풍기를 켜고 끄며, 같은 결과를 SmartThings 허브에 보고함. 바뀐 가전 상태는 다시 가상 침실에 반영됨. 실내 습도는 40%대에 머무는데 벽 표면 습도만 올라가고, 75%에서 노드가 가습을 멈춘 뒤 선풍기로 벽을 데움. 같은 밤 일반 가습기였다면 8시간 넘게 곰팡이 임계를 넘고, 그중 6시간 넘게 벽이 이슬점(12.9℃)보다 차가워 결로가 생겼을 것을 우리 노드는 0분으로 막음.");

/* ---------- 수식 (OMML): PowerPoint 수식 개체. 변수는 기울임 Cambria Math, 한글 첨자는 Pretendard ---------- */
const INK = `<a:solidFill><a:srgbClr val="000000"/></a:solidFill>`;
const CM = `<a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/>`;
const rpr = (i) => `<a:rPr lang="en-US" sz="@SZ@" b="0" i="${i}">${INK}${CM}</a:rPr>`;
const RPR_K = `<a:rPr lang="ko-KR" altLang="en-US" sz="@SZ@" b="0" i="0">${INK}<a:latin typeface="${FONT}"/><a:ea typeface="${FONT}"/></a:rPr>`;
const ctrl = `<m:ctrlPr>${rpr(1)}</m:ctrlPr>`;
const mi = (t) => `<m:r>${rpr(1)}<m:t>${t}</m:t></m:r>`; // 변수: 기울임
const mp = (t) => `<m:r><m:rPr><m:sty m:val="p"/></m:rPr>${rpr(0)}<m:t>${t}</m:t></m:r>`; // 숫자, 기호, 약어: 바로 선 글자
const mk = (t) => `<m:r><m:rPr><m:nor/></m:rPr>${RPR_K}<m:t>${t}</m:t></m:r>`; // 한글 첨자
const sub = (e, x) => `<m:sSub><m:sSubPr>${ctrl}</m:sSubPr><m:e>${e}</m:e><m:sub>${x}</m:sub></m:sSub>`;
const frac = (n, d) => `<m:f><m:fPr>${ctrl}</m:fPr><m:num>${n}</m:num><m:den>${d}</m:den></m:f>`;
const paren = (e) => `<m:d><m:dPr>${ctrl}</m:dPr><m:e>${e}</m:e></m:d>`;
const func = (name, e) => `<m:func><m:funcPr>${ctrl}</m:funcPr><m:fName>${mp(name)}</m:fName><m:e>${e}</m:e></m:func>`;
const Ps = (x) => sub(mi("P"), mp("s")) + mp("(") + x + mp(")");
const Tk = (k) => sub(mi("T"), mk(k));
const RHk = (k) => sub(mp("RH"), mk(k));
/* 수식만 있는 상자 */
const DISPLAY = {
  eq0: Ps(mi("T")) + mp("=") + mp("6.112") + func("exp", paren(frac(mp("17.62") + mi("T"), mp("243.12") + mp("+") + mi("T")))),
  eq1: RHk("표면") + mp("=") + RHk("실내") + mp("×") + frac(Ps(Tk("실내")), Ps(Tk("벽"))),
  eq2: mp("AH") + mp("=") + frac(mp("216.7") + mp("×") + mp("RH") + mp("×") + Ps(mi("T")), mp("100") + paren(mp("273.15") + mp("+") + mi("T"))),
  eq3: RHk("상한") + mp("=") + mp("80") + mp("×") + frac(Ps(Tk("벽")), Ps(Tk("실내"))),
  eq4: RHk("표면") + mp("=") + mp("45") + mp("×") + frac(mp("24.8"), mp("14.0")) + mp("≈") + mp("80") + mp("%"),
};
/* 글자 사이에 수식이 들어가는 줄: ["t", 글자] | ["m", 수식] */
const INLINE = {
  mx_lg: [["m", Tk("실내")], ["t", ": 방 온도,  "], ["m", Tk("벽")], ["t", ": 벽 표면 온도,  "], ["m", mp("RH")], ["t", ": 상대습도(%),  "], ["m", sub(mi("P"), mp("s"))], ["t", ": 포화 수증기압(hPa)"]],
};
const NS_M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const NS_A14 = "http://schemas.microsoft.com/office/drawing/2010/main";
const NS_MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
/* 상자 하나를 [수식 개체 | 대체: 일반 글자] 로 바꿈 */
const mathShape = (sp, key) => {
  const sz = (sp.match(/<a:rPr[^>]* sz="(\d+)"/) || [])[1] || "1400";
  const pPr = (sp.match(/<a:pPr[^>]*\/>|<a:pPr[^>]*>[\s\S]*?<\/a:pPr>/) || [""])[0];
  const body = DISPLAY[key]
    ? `<a14:m><m:oMathPara xmlns:m="${NS_M}"><m:oMathParaPr><m:jc m:val="left"/></m:oMathParaPr><m:oMath>${DISPLAY[key]}</m:oMath></m:oMathPara></a14:m>`
    : INLINE[key].map(([k, v]) => (k === "m"
      ? `<a14:m><m:oMath xmlns:m="${NS_M}">${v}</m:oMath></a14:m>`
      : `<a:r><a:rPr lang="ko-KR" altLang="en-US" sz="${sz}" dirty="0">${INK}</a:rPr><a:t>${v}</a:t></a:r>`)).join("");
  const choice = sp.replace(/<a:p>[\s\S]*<\/a:p>/, `<a:p>${pPr}${body.replace(/@SZ@/g, sz)}<a:endParaRPr lang="ko-KR" sz="${sz}"/></a:p>`);
  return `<mc:AlternateContent xmlns:mc="${NS_MC}"><mc:Choice xmlns:a14="${NS_A14}" Requires="a14">${choice}</mc:Choice><mc:Fallback>${sp}</mc:Fallback></mc:AlternateContent>`;
};
async function finish(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  /* 한글도 Pretendard: 테마의 동아시아 글꼴과 한글 스크립트 글꼴 */
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    const xml = (await zip.file(name).async("string"))
      .replace(/<a:ea typeface="[^"]*"\/>/g, `<a:ea typeface="${FONT}"/>`)
      .replace(/<a:font script="Hang" typeface="[^"]*"\/>/g, `<a:font script="Hang" typeface="${FONT}"/>`);
    zip.file(name, xml);
  }
  const want = Object.keys(DISPLAY).length + Object.keys(INLINE).length;
  let n = 0;
  for (const name of Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))) {
    const xml = await zip.file(name).async("string");
    const out = xml.replace(/<p:sp>(?:(?!<p:sp>)[\s\S])*?<\/p:sp>/g, (sp) => {
      const m = sp.match(/<p:cNvPr id="\d+" name="(eq\d|mx_\w+)"/);
      if (!m) return sp;
      n++;
      return mathShape(sp, m[1]);
    });
    if (out !== xml) zip.file(name, out);
  }
  if (n !== want) throw new Error(`수식 ${n}/${want}개만 삽입됨`);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (!process.env.SKIP_THEME) await applyTheme(OUT, THEME);
  await finish(OUT);
  console.log("wrote", OUT);
})();
