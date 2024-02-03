const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("telegram_theme", {
    setSetting: (k, v) => ipcRenderer.send(
        "LiteLoader.telegram_theme.setSetting",
        k, v
    ),
    updateSetting: (k, v) => ipcRenderer.on(
        "LiteLoader.telegram_theme.updateSetting",
        k, v
    ),
    updateAllSetting: (theme) => ipcRenderer.on(
        "LiteLoader.telegram_theme.updateAllSetting",
        theme
    ),
    getSetting: () => ipcRenderer.invoke(
        "LiteLoader.telegram_theme.getSetting"
    ),
    chooseImage: () => ipcRenderer.send(
        "LiteLoader.telegram_theme.chooseImage",
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
