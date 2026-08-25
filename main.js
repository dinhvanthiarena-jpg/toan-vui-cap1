const { app, BrowserWindow, Menu, ipcMain, shell, clipboard } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const licenseCore = require('./license-core');

let mainWindow = null;

function sendUpdateStatus(status, extra) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { status, ...extra });
  }
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => sendUpdateStatus('available', { version: info.version }));
autoUpdater.on('download-progress', (p) => sendUpdateStatus('downloading', { percent: Math.round(p.percent) }));
autoUpdater.on('update-downloaded', (info) => sendUpdateStatus('downloaded', { version: info.version }));
autoUpdater.on('error', (err) => sendUpdateStatus('error', { message: String((err && err.message) || err) }));

const EXTERNAL_LINKS = {
  facebook: 'https://www.facebook.com/dinhthi.daotao/',
  website: 'https://3dvietpro.com',
};

const LOCALAPPDATA = process.env.LOCALAPPDATA || '';
const CANDIDATE_BROWSERS = [
  { key: 'chrome', name: 'Google Chrome', paths: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
  ] },
  { key: 'edge', name: 'Microsoft Edge', paths: [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ] },
  { key: 'firefox', name: 'Mozilla Firefox', paths: [
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
  ] },
  { key: 'brave', name: 'Brave', paths: [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    path.join(LOCALAPPDATA, 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
  ] },
  { key: 'opera', name: 'Opera', paths: [
    path.join(LOCALAPPDATA, 'Programs\\Opera\\opera.exe'),
    path.join(LOCALAPPDATA, 'Programs\\Opera GX\\opera.exe'),
  ] },
];

function detectInstalledBrowsers() {
  const found = [];
  for (const b of CANDIDATE_BROWSERS) {
    const hit = b.paths.find((p) => {
      try { return !!p && fs.existsSync(p); } catch (e) { return false; }
    });
    if (hit) found.push({ key: b.key, name: b.name, execPath: hit });
  }
  return found;
}

function resolveShareUrl(urlKind, extra) {
  if (urlKind === 'external-link') return EXTERNAL_LINKS[extra] || null;
  if (urlKind === 'facebook-home') return 'https://www.facebook.com/';
  return null;
}

const TRIAL_DAYS = 7;
let licenseFilePath = null;

function getLicenseFilePath() {
  if (!licenseFilePath) licenseFilePath = path.join(app.getPath('userData'), 'license-state.json');
  return licenseFilePath;
}

function readLicenseState() {
  try {
    return JSON.parse(fs.readFileSync(getLicenseFilePath(), 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeLicenseState(state) {
  try {
    fs.writeFileSync(getLicenseFilePath(), JSON.stringify(state), 'utf8');
  } catch (e) {
    // best-effort; if this fails the trial simply resets each launch
  }
}

function getOrInitLicenseState() {
  let state = readLicenseState();
  if (!state || typeof state.firstRunAt !== 'number') {
    state = { firstRunAt: Date.now(), activatedKey: null };
    writeLicenseState(state);
  }
  return state;
}

function computeLicenseStatus() {
  const state = getOrInitLicenseState();
  const isActivated = !!state.activatedKey && licenseCore.validateKey(state.activatedKey);
  const daysUsed = (Date.now() - state.firstRunAt) / (1000 * 60 * 60 * 24);
  const trialDaysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - daysUsed));
  return {
    isActivated,
    trialDaysLeft,
    isExpired: !isActivated && trialDaysLeft <= 0,
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow = win;
}

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-external-link', (event, key) => {
  const url = EXTERNAL_LINKS[key];
  if (url) shell.openExternal(url);
});

ipcMain.handle('get-installed-browsers', () => detectInstalledBrowsers());

ipcMain.handle('open-url-in-browser', (event, { browserKey, urlKind, extra } = {}) => {
  const url = resolveShareUrl(urlKind, extra);
  if (!url) return { success: false };

  if (!browserKey || browserKey === 'default') {
    shell.openExternal(url);
    return { success: true };
  }
  const match = detectInstalledBrowsers().find((b) => b.key === browserKey);
  if (!match) {
    shell.openExternal(url);
    return { success: true, fallback: true };
  }
  execFile(match.execPath, [url], () => {});
  return { success: true };
});

ipcMain.handle('capture-result-screenshot', async (event, rect) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false };
  try {
    const image = rect && rect.width && rect.height
      ? await win.webContents.capturePage({
          x: Math.max(0, Math.round(rect.x)),
          y: Math.max(0, Math.round(rect.y)),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
      : await win.webContents.capturePage();
    clipboard.writeImage(image);
    const dir = path.join(app.getPath('pictures'), 'Toan Vui Cap 1');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `Ket-Qua-${Date.now()}.png`);
    fs.writeFileSync(filePath, image.toPNG());
    return { success: true, filePath };
  } catch (e) {
    return { success: false };
  }
});

ipcMain.handle('license:get-status', () => computeLicenseStatus());

ipcMain.handle('license:activate', (event, key) => {
  if (!licenseCore.validateKey(key)) {
    return { success: false, message: 'Mã key không đúng. Kiểm tra lại hoặc liên hệ thầy Đinh Thi Ai.' };
  }
  const state = getOrInitLicenseState();
  state.activatedKey = licenseCore.normalizeKey(key);
  writeLicenseState(state);
  return { success: true };
});

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdates().catch(() => {});

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
