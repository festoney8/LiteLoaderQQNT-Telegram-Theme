const fs = require("fs");
const path = require("path");
const {BrowserWindow, ipcMain} = require("electron");


// 防抖函数
function debounce(fn, time) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

// 获取背景图片
function getWallpaperPath() {
    const imageAbsPath = path.join(__dirname, './image/wallpaper.png');
    const normalPath = path.normalize(imageAbsPath).replace(/\\/g, '/');
    return new Promise((resolve, reject) => {
        fs.access(normalPath, fs.constants.F_OK, (err) => {
            if (err) {
                reject("[Telegram Theme 获取背景图片失败]");
            } else {
                resolve(normalPath);
            }
        });
    });
}


// 更新样式
function updateStyle(webContents) {
    const csspath = path.join(__dirname, "style.css");
    fs.readFile(csspath, "utf-8", (err, data) => {
        if (err) {
            return;
        }
        webContents.send("LiteLoaderQQNT.telegram_theme.updateStyle", data);
    });
}


// 监听CSS修改-开发时候用的
function watchCSSChange(webContents) {
    const filepath = path.join(__dirname, "style.css");
    fs.watch(filepath, "utf-8", debounce(() => {
        updateStyle(webContents);
    }, 100));
}


function onLoad(plugin) {
    ipcMain.on("LiteLoaderQQNT.telegram_theme.rendererReady", (event, message) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        updateStyle(window.webContents);
    });
    ipcMain.handle("LiteLoaderQQNT.telegram_theme.getWallpaperPath", async (event, message) => {
        return getWallpaperPath();
    });
}


function onBrowserWindowCreated(window, plugin) {
    window.on("ready-to-show", () => {
        const url = window.webContents.getURL();
        if (url.includes("app://./renderer/index.html")) {
            watchCSSChange(window.webContents);
        }
    });
}


module.exports = {
    onLoad, onBrowserWindowCreated
}