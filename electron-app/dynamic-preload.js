// Preload for the Dynamic Island window. Was referenced by main.js but never
// committed, so the island had no bridge and every control threw.
// Its API differs from the main window's preload.js, so they can't be shared.
// Channels: island-expand / island-shrink / island-action / do-expand /
//           do-shrink / track-updated

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  expandIsland: () => ipcRenderer.send('island-expand'),
  shrinkIsland: () => ipcRenderer.send('island-shrink'),
  onDoExpand: (cb) => ipcRenderer.on('do-expand', (_e, ...args) => cb(...args)),
  onDoShrink: (cb) => ipcRenderer.on('do-shrink', (_e, ...args) => cb(...args)),
  onTrackUpdated: (cb) => ipcRenderer.on('track-updated', (_e, data) => cb(data)),
  sendAction: (action) => ipcRenderer.send('island-action', action),
  setIslandState: (state) => ipcRenderer.send('island-state', state),
  closeApp: () => ipcRenderer.send('window-close'),
  minimizeApp: () => ipcRenderer.send('window-minimize'),
  toggleFullscreen: () => ipcRenderer.send('window-toggle-fullscreen'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onIslandOptions: (cb) => ipcRenderer.on('island-options', (_e, opts) => cb(opts)),
  getIslandOptions: () => ipcRenderer.invoke('island-get-options'),
});
