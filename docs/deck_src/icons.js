// Free icons (Tabler: MIT, Lucide: ISC via react-icons) -> PNG for slides, SVG data URIs for figures
const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const tb = require("react-icons/tb");
const lu = require("react-icons/lu");

const ICONS = {
  fan: lu.LuFan, mist: tb.TbMist, wall: tb.TbWall, droplet: tb.TbDroplet, temp: tb.TbTemperature, cpu: tb.TbCpu,
  shield: tb.TbShieldCheck, brain: tb.TbBrain, chart: tb.TbChartLine, user: tb.TbUser, history: tb.TbHistory,
  bed: tb.TbBed, virus: tb.TbVirus, gauge: tb.TbGauge, snow: tb.TbSnowflake, laptop: tb.TbDeviceLaptop,
  router: tb.TbRouter, phone: tb.TbDeviceMobile, db: tb.TbDatabase, upload: tb.TbUpload, hand: tb.TbHandClick,
  qr: tb.TbQrcode, plug: tb.TbPlug, alert: tb.TbAlertTriangle, join: tb.TbArrowsJoin, calc: tb.TbCalculator,
  cloudoff: tb.TbCloudOff, wave: tb.TbWaveSine,
};
const COLORS = { blue: "#0066CC", white: "#FFFFFF", ink: "#1D1D1F", red: "#E30000", green: "#1D5C45" };
const OUT = path.join(__dirname, "icons");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const svgs = {};
  for (const [name, Icon] of Object.entries(ICONS)) {
    for (const [cname, color] of Object.entries(COLORS)) {
      const svg = renderToStaticMarkup(React.createElement(Icon, { size: 256, color }));
      const full = svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      await sharp(Buffer.from(full)).resize(256, 256).png().toFile(path.join(OUT, `${name}-${cname}.png`));
      svgs[`${name}-${cname}`] = "data:image/svg+xml;base64," + Buffer.from(full).toString("base64");
    }
  }
  fs.writeFileSync(path.join(OUT, "svg-uris.json"), JSON.stringify(svgs));
  console.log("icons:", Object.keys(ICONS).length, "x", Object.keys(COLORS).length);
})();
