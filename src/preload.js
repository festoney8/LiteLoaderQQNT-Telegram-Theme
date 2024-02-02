const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("telegram_theme", {
    setSetting: (k, v) => ipcRenderer.send(
        "LiteLoader.telegram_theme.setSetting",
        k, v
    ),
    getSetting: () => ipcRenderer.invoke(
        "LiteLoader.telegram_theme.getSetting"
    ),
    
    logToMain: (...args) => ipcRenderer.send(
        "LiteLoader.telegram_theme.logToMain",
        ...args
    ),
    errorToMain: (...args) => ipcRenderer.send(
        "LiteLoader.telegram_theme.errorToMain",
        ...args
    ),
})
