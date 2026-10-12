// 기기 그림 SVG(icons/devices/*.svg) -> 512px PNG. Streamline Ultimate Color(CC BY 4.0) + 같은 스타일로 그린 선풍기, 가습기, 스마트폰
const fs = require("fs"), path = require("path"), sharp = require("sharp");
const dir = path.join(__dirname, "icons", "devices");
(async () => {
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
    await sharp(fs.readFileSync(path.join(dir, f)), { density: 1600 }).resize(512, 512).png().toFile(path.join(dir, f.replace(".svg", ".png")));
  }
  console.log("devices ok");
})();
