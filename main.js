const fs = require("fs");
const path = require("path");
const {BrowserWindow, ipcMain, nativeTheme} = require("electron");

function output(...args) {
    console.log("\x1b[32m%s\x1b[0m", "TelegramTheme:", ...args);
}

// 防抖函数
function debounce(fn, time = 100) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

// // 获取背景图片
// function getWallpaperPath() {
//     const imageAbsPath = path.join(__dirname, './image/wallpaper.png');
//     const normalPath = path.normalize(imageAbsPath).replace(/\\/g, '/');
//     return new Promise((resolve, reject) => {
//         fs.access(normalPath, fs.constants.F_OK, (err) => {
//             if (err) {
//                 reject("[Telegram Theme 获取背景图片失败]");
//             } else {
//                 resolve(normalPath);
//             }
//         });
//     });
// }

function getCurrTheme() {
    if (nativeTheme.shouldUseDarkColors) {
        return "dark";
    }
    return "light";
}

// 初始化设置
function initSetting(settingPath) {
    try {
        const folderPath = path.dirname(settingPath);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, {recursive: true});
        }
        if (!fs.existsSync(settingPath)) {
            const initialJson = {
                light: {}, dark: {},
            };
            fs.writeFileSync(settingPath, JSON.stringify(initialJson, null, 4));
        }
        return {success: true};
    } catch (error) {
        return {error: '[Telegram Theme]创建setting.json配置文件失败!'};
    }
}


// 获取设置
function getSetting(settingPath) {
    return new Promise((resolve, reject) => {
        fs.readFile(settingPath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const setting = JSON.parse(data);
                    resolve(setting);
                } catch (error) {
                    reject(error);
                }
            }
        });
    });
}

// // 保存设置
// function setSetting(webContents, settingPath) {
// }

// 更新设置，使Setting生效
function updateSetting(webContents, settingPath) {
    return new Promise((resolve, reject) => {
        fs.readFile(settingPath, "utf-8", (err, data) => {
            if (err) {
                output("updateSetting", err);
                reject(err);
            } else {
                const setting = JSON.parse(data);
                webContents.send("LiteLoaderQQNT.telegram_theme.updateSetting", setting[getCurrTheme()]);
                output('updateSetting send Json to renderer');
                resolve();
            }
        });
    });
}

// 更新样式，使CSS生效
function updateCSS(webContents, cssPath) {
    return new Promise((resolve, reject) => {
        fs.readFile(cssPath, "utf-8", (err, data) => {
            if (err) {
                output("updateCSS", err);
                reject(err);
            } else {
                webContents.send("LiteLoaderQQNT.telegram_theme.updateCSS", data);
                output('updateCSS send CSS to renderer');
                resolve();
            }
        });
    });
}

// 监听文件修改
function watchFileChange(webContents, filepath, callback) {
    fs.watch(filepath, "utf-8", debounce(() => {
        callback(webContents, filepath);
    }, 1000));
}

function onLoad(plugin) {
    ipcMain.on("LiteLoaderQQNT.telegram_theme.rendererReady", async (event, message) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        const cssPath = path.join(__dirname, "css", "style.css");
        updateCSS(window.webContents, cssPath);
        output('onLoad', 'updateCSS', cssPath)

        const settingPath = path.join(plugin.path.data, 'setting.json');
        updateSetting(window.webContents, settingPath);
        output('onLoad', 'updateSetting', settingPath)
    });

    ipcMain.handle('LiteLoaderQQNT.telegram_theme.getSetting', async (event, message) => {
        return getSetting();
    });
}

function onBrowserWindowCreated(window, plugin) {
    // 设置文件初始化
    const settingPath = path.join(plugin.path.data, 'setting.json');
    const status = initSetting(settingPath);
    output("initSetting", status)

    window.on("ready-to-show", () => {
        const url = window.webContents.getURL();
        if (url.includes("app://./renderer/index.html")) {
            // 开启文件监听
            let cssPath = path.join(__dirname, "css", "style.css");
            watchFileChange(window.webContents, cssPath, debounce(updateCSS))
            output("watchFileChange", cssPath)
            watchFileChange(window.webContents, settingPath, debounce(updateSetting))
            output("watchFileChange", settingPath)

            // 监听主题切换
            output('开始监听主题');
            nativeTheme.on('updated', () => {
                if (window.webContents && !window.webContents.isDestroyed()) {
                    output('监听到主题切换', getCurrTheme())
                    updateSetting(window.webContents, settingPath);
                } else {
                    nativeTheme.off('updated', updateSetting);
                }
            });
        }
    });
    window.on('closed', () => {
        output('关闭主题监听')
        nativeTheme.off('updated', updateSetting)
    });
}

function onThemeChange(window) {
}

module.exports = {
    onLoad, onBrowserWindowCreated, onThemeChange
}