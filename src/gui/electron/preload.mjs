import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('timelineApi', {
  getSnapshot: (options) => ipcRenderer.invoke('timeline:get-snapshot', options),
});
