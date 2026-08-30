// Resizes the real cropped icon photo to every size the PWA manifest / .ico
// need. Run with Electron: npx electron tools/resize-icon-source.js
const { app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const SIZES = [16, 32, 48, 180, 192, 256, 512];
const SRC = path.join(__dirname, 'icon-source-cropped.png');
const OUT_DIR = path.join(__dirname, '..', 'web', 'icons');

async function run() {
  await app.whenReady();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const src = nativeImage.createFromPath(SRC);
  console.log('source size', src.getSize());
  for (const size of SIZES) {
    const resized = src.resize({ width: size, height: size, quality: 'best' });
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(outPath, resized.toPNG());
    console.log('wrote', outPath);
  }
  app.quit();
}

run().catch((e) => { console.error(e); app.exit(1); });
