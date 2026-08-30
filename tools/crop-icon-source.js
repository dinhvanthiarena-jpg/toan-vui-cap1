// Crops the actual square icon graphic out of a full-screen phone
// screenshot (status bar + "X" close button + black letterboxing around a
// photo viewer). Detects the icon's bounding box by scanning for non-black
// pixels, explicitly ignoring the top status-bar/X-button strip and the
// bottom home-indicator strip (both contain bright white UI chrome that
// would otherwise be mistaken for icon content).
// Run with Electron: npx electron tools/crop-icon-source.js <input.png> <output.png>
const { app, nativeImage } = require('electron');
const path = require('path');

async function run() {
  await app.whenReady();
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: electron crop-icon-source.js <input.png> <output.png>');
    app.exit(1);
    return;
  }
  const img = nativeImage.createFromPath(path.resolve(inputPath));
  const { width, height } = img.getSize();
  console.log('source size', width, height);
  const bitmap = img.toBitmap(); // BGRA, 4 bytes/px, row-major
  const stride = width * 4;

  const topIgnore = Math.round(height * 0.16); // status bar + X button
  const bottomIgnore = Math.round(height * 0.97); // home indicator strip
  const threshold = 22; // near-black cutoff

  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = topIgnore; y < bottomIgnore; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * stride + x * 4;
      const b = bitmap[i], g = bitmap[i + 1], r = bitmap[i + 2];
      if (r > threshold || g > threshold || b > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log('detected content box', { minX, minY, maxX, maxY });

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const side = Math.max(boxW, boxH);
  const cx = minX + boxW / 2;
  const cy = minY + boxH / 2;
  let cropX = Math.round(cx - side / 2);
  let cropY = Math.round(cy - side / 2);
  cropX = Math.max(0, Math.min(width - side, cropX));
  cropY = Math.max(0, Math.min(height - side, cropY));
  console.log('square crop', { cropX, cropY, side });

  const cropped = img.crop({ x: cropX, y: cropY, width: side, height: side });
  const fs = require('fs');
  fs.writeFileSync(path.resolve(outputPath), cropped.toPNG());
  console.log('wrote', outputPath);
  app.quit();
}

run().catch((e) => { console.error(e); app.exit(1); });
