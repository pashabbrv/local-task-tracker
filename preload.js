const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("taskApi", {
  load: () => ipcRenderer.invoke("tasks:load"),
  save: (data) => ipcRenderer.invoke("tasks:save", data)
});

