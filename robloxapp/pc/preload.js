const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('pc', {
  min: () => ipcRenderer.send('win:min'),
  max: () => ipcRenderer.send('win:max'),
  close: () => ipcRenderer.send('win:close')
});
