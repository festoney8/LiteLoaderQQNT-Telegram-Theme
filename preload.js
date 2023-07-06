const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("telegram_theme", {
    updateStyle: (callback) => ipcRenderer.on(
        "betterQQNT.telegram_theme.updateStyle",
        callback
    ),
    rendererReady: () => ipcRenderer.send(
        "betterQQNT.telegram_theme.rendererReady"
    )
});