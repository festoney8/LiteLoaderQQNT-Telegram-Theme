const {contextBridge, ipcRenderer} = require("electron");


contextBridge.exposeInMainWorld("telegram_theme", {
    updateWallpaper: (message) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateWallpaper",
        message
    ),
    updateSetting: (message) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateSetting",
        message
    ),
    updateCSS: (message) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateCSS",
        message
    ),
    rendererReady: () => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.rendererReady"
    ),
    setSetting: (message) => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.setSetting",
        message
    ),
    setWallpaper: () => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.setWallpaper",
    ),
    getSetting: () => ipcRenderer.invoke(
        "LiteLoaderQQNT.telegram_theme.getSetting",
    ),
    resetSetting: () => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.resetSetting",
    ),
});