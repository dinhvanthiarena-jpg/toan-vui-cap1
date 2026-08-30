// Renders the app icon (white embossed square, matching the in-game home
// badge) to PNG at every size the PWA manifest / favicons need. Run with
// Electron itself (not plain node) since it needs a real Chromium renderer:
//   npx electron tools/generate-icons.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const SIZES = [16, 32, 48, 180, 192, 256, 512];
const OUT_DIR = path.join(__dirname, '..', 'web', 'icons');

function iconHtml(size) {
  const pad = Math.round(size * 0.045);
  const gap = Math.round(size * 0.035);
  const r = Math.round(size * 0.22);
  const symR = Math.round(size * 0.16);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;overflow:hidden;}
    .frame{
      box-sizing:border-box;
      width:${size - pad * 2}px;height:${size - pad * 2}px;margin:${pad}px;
      border-radius:${r}px;
      background: radial-gradient(120% 120% at 20% 10%, #2a2a2a 0%, #050505 55%, #000 100%);
      border: ${Math.max(2, Math.round(size*0.012))}px solid rgba(255,255,255,0.22);
      box-shadow: inset 0 0 0 ${Math.max(2, Math.round(size*0.02))}px rgba(255,255,255,0.06),
                  inset 0 ${Math.round(size*0.03)}px ${Math.round(size*0.05)}px rgba(255,255,255,0.15);
      display:grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap:${gap}px;
      padding:${gap}px;
      position:relative;
      overflow:hidden;
    }
    .cell{
      border-radius:${Math.round(size*0.09)}px;
      display:flex;align-items:center;justify-content:center;
      position:relative;
      box-shadow: inset 0 ${Math.round(size*0.015)}px ${Math.round(size*0.02)}px rgba(255,255,255,0.55),
                  inset 0 -${Math.round(size*0.02)}px ${Math.round(size*0.03)}px rgba(0,0,0,0.35),
                  0 ${Math.round(size*0.01)}px ${Math.round(size*0.02)}px rgba(0,0,0,0.5);
    }
    .cell::before{
      content:'';
      position:absolute; inset:0;
      border-radius:inherit;
      background: radial-gradient(ellipse 60% 40% at 30% 15%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%);
    }
    .plus{ background:linear-gradient(155deg,#ff5a4d 0%,#c81c1c 55%,#7a0f0f 100%); }
    .minus{ background:linear-gradient(155deg,#ffe27a 0%,#f5b400 55%,#a86e00 100%); }
    .times{ background:linear-gradient(155deg,#5b8dff 0%,#1c3fc8 55%,#0e2170 100%); }
    .div{ background:linear-gradient(155deg,#7be08a 0%,#159a3e 55%,#0a5b24 100%); }
    .sym{
      color:#f2f2f2;
      font-family:Arial,'Segoe UI',sans-serif;
      font-weight:900;
      font-size:${Math.round(size*0.22)}px;
      text-shadow:0 ${Math.max(1,Math.round(size*0.01))}px ${Math.round(size*0.015)}px rgba(0,0,0,0.6),
                  0 1px 0 rgba(255,255,255,0.4);
      z-index:1;
    }
    .dot{
      position:absolute; width:${Math.round(size*0.045)}px; height:${Math.round(size*0.045)}px;
      border-radius:50%;
      background:radial-gradient(circle at 35% 30%, #fff, #dcdcdc 60%, #aaa 100%);
      box-shadow:0 1px 2px rgba(0,0,0,0.4);
      z-index:1;
    }
    .dot.top{ top:${Math.round(size*0.09)}px; }
    .dot.bot{ bottom:${Math.round(size*0.09)}px; }
    .bubble{
      position:absolute;
      top:50%; left:50%; transform:translate(-50%,-50%);
      width:${symR * 2}px; height:${symR * 2}px;
      border-radius:50%;
      background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 40%, rgba(200,220,255,0.18) 70%, rgba(160,190,255,0.12) 100%);
      border: ${Math.max(1, Math.round(size*0.006))}px solid rgba(255,255,255,0.85);
      box-shadow: 0 ${Math.round(size*0.02)}px ${Math.round(size*0.04)}px rgba(0,0,0,0.5),
                  inset 0 ${Math.round(size*0.01)}px ${Math.round(size*0.02)}px rgba(255,255,255,0.9);
      display:flex; align-items:center; justify-content:center;
      z-index:2;
      backdrop-filter: blur(1px);
    }
    .bubble-text{
      font-family:'Segoe UI',Arial,sans-serif;
      font-weight:800;
      font-size:${Math.round(size*0.135)}px;
      color:#f5f5f5;
      text-shadow:0 1px 3px rgba(0,0,0,0.6), 0 0 ${Math.round(size*0.03)}px rgba(120,180,255,0.8);
      letter-spacing:0.5px;
    }
  </style></head><body>
    <div class="frame">
      <div class="cell plus"><span class="sym">+</span></div>
      <div class="cell minus"><span class="sym">−</span></div>
      <div class="cell times"><span class="sym">×</span></div>
      <div class="cell div"><span class="sym">÷</span><span class="dot top"></span><span class="dot bot"></span></div>
      <div class="bubble"><span class="bubble-text">Thi</span></div>
    </div>
  </body></html>`;
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await app.whenReady();
  // Always render at a fixed base resolution, then downscale per target size —
  // avoids Electron glitches with very small (16-32px) BrowserWindows.
  const BASE = 512;
  const win = new BrowserWindow({
    width: BASE,
    height: BASE,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: false },
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(iconHtml(BASE)));
  await new Promise((r) => setTimeout(r, 300));
  const baseImage = await win.webContents.capturePage({ x: 0, y: 0, width: BASE, height: BASE });
  for (const size of SIZES) {
    const resized = size === BASE ? baseImage : baseImage.resize({ width: size, height: size, quality: 'best' });
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(outPath, resized.toPNG());
    console.log('wrote', outPath);
  }
  win.destroy();
  app.quit();
}

run().catch((e) => {
  console.error(e);
  app.exit(1);
});
