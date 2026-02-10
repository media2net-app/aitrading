const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agentApi', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (data) => ipcRenderer.invoke('save-config', data),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onStatusUpdate: (callback) => {
    const fn = (_, data) => callback(data)
    ipcRenderer.on('status-update', fn)
    return () => ipcRenderer.removeListener('status-update', fn)
  },
})
