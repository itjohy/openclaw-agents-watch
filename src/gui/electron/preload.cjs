const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('timelineApi', {
  getSnapshot: (options = {}) => ipcRenderer.invoke('timeline:get-snapshot', options),
});
