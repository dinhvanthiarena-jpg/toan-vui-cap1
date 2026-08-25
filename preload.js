const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternalLink: (key) => ipcRenderer.invoke('open-external-link', key),
  getLicenseStatus: () => ipcRenderer.invoke('license:get-status'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  getInstalledBrowsers: () => ipcRenderer.invoke('get-installed-browsers'),
  openUrlInBrowser: (opts) => ipcRenderer.invoke('open-url-in-browser', opts),
  captureResultScreenshot: (rect) => ipcRenderer.invoke('capture-result-screenshot', rect),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveTeacherName: (name) => ipcRenderer.invoke('settings:save-name', name),
  pickAvatar: () => ipcRenderer.invoke('settings:pick-avatar'),
  saveAvatar: (dataUrl) => ipcRenderer.invoke('settings:save-avatar', dataUrl),
  resetAvatar: () => ipcRenderer.invoke('settings:reset-avatar'),
});
