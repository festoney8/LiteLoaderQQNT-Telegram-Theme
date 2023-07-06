const {contextBridge, ipcRenderer} = require("electron");


contextBridge.exposeInMainWorld("telegram_theme", {
    updateStyle: (callback) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateStyle",
        callback
    ),
    rendererReady: () => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.rendererReady"
    ),
    getWallpaperPath: () => ipcRenderer.invoke(
        "LiteLoaderQQNT.telegram_theme.getWallpaperPath",
    )
});