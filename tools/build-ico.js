// Packs the already-generated PNGs into a single multi-resolution Windows
// .ico (PNG-compressed entries — supported since Windows Vista, which is
// all electron-builder targets anyway). No external deps needed.
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 48, 256];
const ICONS_DIR = path.join(__dirname, '..', 'web', 'icons');
const OUT_PATH = path.join(__dirname, '..', 'assets', 'icon.ico');

const pngBuffers = SIZES.map((size) => fs.readFileSync(path.join(ICONS_DIR, `icon-${size}.png`)));

const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;
const header = Buffer.alloc(HEADER_SIZE);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(SIZES.length, 4); // image count

let offset = HEADER_SIZE + ENTRY_SIZE * SIZES.length;
const entries = [];
for (let i = 0; i < SIZES.length; i++) {
  const size = SIZES[i];
  const buf = pngBuffers[i];
  const entry = Buffer.alloc(ENTRY_SIZE);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(buf.length, 8); // data size
  entry.writeUInt32LE(offset, 12); // data offset
  entries.push(entry);
  offset += buf.length;
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, Buffer.concat([header, ...entries, ...pngBuffers]));
console.log('wrote', OUT_PATH);
