const {contextBridge, ipcRenderer} = require("electron");


contextBridge.exposeInMainWorld("telegram_theme", {
    updateCSS: (callback) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateCSS",
        callback
    ),
    updateSetting: (callback) => ipcRenderer.on(
        "LiteLoaderQQNT.telegram_theme.updateSetting",
        callback
    ),
    rendererReady: () => ipcRenderer.send(
        "LiteLoaderQQNT.telegram_theme.rendererReady"
    ),
    // getSetting: () => ipcRenderer.invoke(
    //     "LiteLoaderQQNT.telegram_theme.getSetting",
    // ),
});