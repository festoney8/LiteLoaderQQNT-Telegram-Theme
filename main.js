const fs = require("fs");
const path = require("path");
const {BrowserWindow, ipcMain, nativeTheme, dialog} = require("electron");


// 全局变量, 在onLoad(plugin)中完成赋值
let settingPath = "";
let cssPath = path.join(__dirname, "css", "style.css");


// function output(...args) {
//     console.log("\x1b[32m%s\x1b[0m", "TelegramTheme:", ...args);
// }

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

function getCurrTheme() {
    if (nativeTheme.shouldUseDarkColors) {
        return "dark";
    }
    return "light";
}

// 初始化设置
function initSetting(settingPath) {
    const defaultSettingPath = path.join(__dirname, "setting.json.example")
    try {
        let overwriteFlag = false;
        const folderPath = path.dirname(settingPath);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, {recursive: true});
        }
        if (!fs.existsSync(settingPath)) {
            overwriteFlag = true;
        } else {
            // 检测版本，判断是否覆盖设置
            const data = fs.readFileSync(settingPath, 'utf8');
            const setting = JSON.parse(data);
            if (!("version" in setting)) {
                overwriteFlag = true;
            }
        }
        // output("overwriteFlag", overwriteFlag);
        if (overwriteFlag) {
            fs.copyFile(defaultSettingPath, settingPath, (err) => {
                if (err) {
                    throw err;
                }
            });
        }
        return {success: true};
    } catch (error) {
        return {error: '[Telegram Theme]创建setting.json配置文件失败!'};
    }
}

// 获取当前主题下壁纸
function updateWallpaper(webContents) {
    const currTheme = getCurrTheme();
    const imageAbsPath = path.join(__dirname, `./image/${currTheme}.jpg`);
    const normalPath = path.normalize(imageAbsPath).replace(/\\/g, '/');
    try {
        webContents.send("LiteLoaderQQNT.telegram_theme.updateWallpaper", normalPath);
    } catch (err) {
        // output('[Telegram Theme 获取背景图片失败]');
        // output(err);
    }
}

// 获取设置
function getSetting() {
    return new Promise((resolve, reject) => {
        fs.readFile(settingPath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const setting = JSON.parse(data);
                    const currTheme = getCurrTheme();
                    resolve(setting[currTheme]);
                } catch (error) {
                    // output(error);
                    reject(error);
                }
            }
        });
    });
}

// 保存设置, 每次只存一个KV值
function setSetting(message) {
    // // output("setSetting message", message);
    const currTheme = getCurrTheme();
    const myKey = Object.keys(message)[0];
    const newValue = message[myKey];
    fs.readFile(settingPath, 'utf8', (err, data) => {
        if (myKey === undefined || newValue === undefined) {
            // output("setSetting key-value值异常", myKey, newValue);
            return;
        }
        if (err) {
            // output(err);
            return;
        }
        let setting;
        try {
            setting = JSON.parse(data);
        } catch (err) {
            // output(err);
            return;
        }
        // 设定当前主题下参数
        setting[currTheme][myKey]["value"] = newValue;
        const updatedData = JSON.stringify(setting, null, 4);
        fs.writeFile(settingPath, updatedData, 'utf8', (err) => {
            if (err) {
                // output(err);
            }
        });
    });
}

function setWallpaper() {
    // 接renderer请求打开dialog, 选择图片后调用setSetting
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp']},
            {name: 'All Files', extensions: ['*']}
        ]
    }).then(result => {
        let filePath = result.filePaths[0];
        filePath = filePath.replace(/\\/g, "/");
        // 调用setSetting
        setSetting({"--chatarea-wallpaper": `url("file://${filePath}")`})
    }).catch(err => {
        // output("setWallpaper, error", err)
    });
}

// 更新设置，使Setting生效
function updateSetting(webContents, settingPath) {
    fs.readFile(settingPath, "utf-8", (err, data) => {
        if (err) {
            // output("updateSetting", err);
        } else {
            const setting = JSON.parse(data);
            webContents.send("LiteLoaderQQNT.telegram_theme.updateSetting", setting[getCurrTheme()]);
        }
    });
}

// 更新样式，使CSS生效
function updateCSS(webContents, cssPath) {
    fs.readFile(cssPath, "utf-8", (err, data) => {
        if (err) {
            // output("updateCSS", err);
        } else {
            webContents.send("LiteLoaderQQNT.telegram_theme.updateCSS", data);
        }
    });
}

// 监听文件修改
function watchFileChange(webContents, filepath, callback) {
    fs.watch(filepath, "utf-8", debounce(() => {
        callback(webContents, filepath);
    }, 1000));
}

function onLoad(plugin) {
    // 全局变量赋值
    settingPath = path.join(plugin.path.data, 'setting.json');
    cssPath = path.join(__dirname, "css", "style.css");

    ipcMain.on("LiteLoaderQQNT.telegram_theme.rendererReady", async (event, message) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        // 更新默认CSS
        updateCSS(window.webContents, cssPath);
        // 设定壁纸
        updateWallpaper(window.webContents);
        // 用户设置
        updateSetting(window.webContents, settingPath);
    });
    ipcMain.handle('LiteLoaderQQNT.telegram_theme.getSetting', async (event, message) => {
        return getSetting();
    });
    ipcMain.on('LiteLoaderQQNT.telegram_theme.setSetting', async (event, message) => {
        return setSetting(message);
    });
    ipcMain.on('LiteLoaderQQNT.telegram_theme.setWallpaper', async (event, message) => {
        setWallpaper();
    });
}

function onBrowserWindowCreated(window, plugin) {
    // 设置文件初始化
    if (settingPath === "") {
        settingPath = path.join(plugin.path.data, 'setting.json');
    }
    const status = initSetting(settingPath);

    window.on("ready-to-show", () => {
        const url = window.webContents.getURL();
        if (url.includes("app://./renderer/index.html")) {
            // 开启文件监听
            watchFileChange(window.webContents, cssPath, debounce(updateCSS))
            watchFileChange(window.webContents, settingPath, debounce(updateSetting))

            // 监听主题切换
            nativeTheme.on('updated', () => {
                try {
                    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
                        updateWallpaper(window.webContents);
                        updateSetting(window.webContents, settingPath);
                    } else {
                        nativeTheme.off('updated', updateSetting);
                    }
                } catch (error) {
                    // output(error)
                }
            });
        }
    });
    window.on('closed', () => {
        nativeTheme.off('updated', updateSetting)
    });
}

module.exports = {
    onLoad, onBrowserWindowCreated
}