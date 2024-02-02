const fs = require('fs')
const path = require('path')
const { BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron')

const pluginPath = LiteLoader.plugins['telegram_theme'].path.plugin.replaceAll('\\', '/')
const dataPath = LiteLoader.plugins['telegram_theme'].path.data.replaceAll('\\', '/')
const settingPath = path.join(dataPath, 'setting.json').replaceAll('\\', '/')

const enableLog = false
const enableError = true
const log = (...args) => {
    if (enableLog) {
        console.log('\x1b[34m[telegram-theme]\x1b[0m', ...args)
    }
}
const error = (...args) => {
    if (enableError) {
        console.log('\x1b[31m[telegram-theme]\x1b[0m', ...args)
    }
}
const debounce = (fn, time = 100) => {
    let timer = null
    return (...args) => {
        timer && clearTimeout(timer)
        timer = setTimeout(() => {
            fn.apply(this, args)
        }, time)
    }
}

// 主窗口对象
let mainWindow

// 获取主题
const getCurrTheme = () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

// 初始化设置
const initSetting = () => {
    try {
        if (!fs.existsSync(settingPath)) {
            // 复制文件
            fs.mkdirSync(dataPath, { recursive: true })
            fs.copyFileSync(`${pluginPath}/src/setting.json`, settingPath)
            // 设定默认壁纸路径
            setSetting('--tg-container-image', `url("local:///${pluginPath}/image/light.jpg")`, 'light')
            setSetting('--tg-container-image', `url("local:///${pluginPath}/image/dark.jpg")`, 'dark')
            log('initSetting set default wallpaper OK')
            log('initSetting OK')
        } else {
            log('initSetting skip, OK')
        }
    } catch (err) {
        error(err.toString())
        error('initSetting error')
    }
}

// 获取设置
const getSetting = async () => {
    try {
        log('getSetting start')
        let rawdata = fs.readFileSync(settingPath)
        let setting = JSON.parse(rawdata)
        return setting[getCurrTheme()]
    } catch (err) {
        error(err.toString())
        error('getSetting error')
        return null
    }
}

// 保存设置, 每次只存一个KV值
const setSetting = (k, v, theme = null) => {
    try {
        if (!k || v === undefined) {
            throw Error('setSetting k-v invalid')
        }
        if (!theme) {
            theme = getCurrTheme()
        }
        let data = fs.readFileSync(settingPath, 'utf8')
        let setting = JSON.parse(data)
        setting[theme][k]['value'] = v.toString()
        const updatedData = JSON.stringify(setting, null, 4)
        fs.writeFileSync(settingPath, updatedData, 'utf8')
        log('setSetting', k, v, 'OK')
    } catch (err) {
        error(err.toString())
        error('setSetting error')
    }
}

// 选取壁纸图片
const chooseImage = () => {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        try {
            let imagePath = result.filePaths[0]
            if (!imagePath) {
                return
            }
            imagePath = imagePath.replaceAll('\\', '/')
            setSetting("--tg-container-image", `url("local:///${imagePath}")`)
            log("chooseImage setsetting, OK")

            // 通知renderer刷新设置
            if (!mainWindow.webContents?.isDestroyed()) {
                mainWindow.webContents.send("LiteLoader.telegram_theme.updateSetting", "--tg-container-image", `url("local:///${imagePath}")`);
                log("chooseImage, OK")
            } else {
                log('chooseImage webContents isDestroyed')
            }
        } catch (err) {
            error(err)
            error('chooseImage error')
        }
    }).catch(err => {
        error(err)
        error("chooseImage, error")
    })
}

ipcMain.on("LiteLoader.telegram_theme.rendererReady", (event) => {
    // 捕捉主窗口对象
    mainWindow = BrowserWindow.fromWebContents(event.sender)
    log('main rendererReady set mainWindow')

    // 监听主题切换
    nativeTheme.on('updated', () => {
        try {
            if (!mainWindow.webContents?.isDestroyed()) {
                mainWindow.webContents.send("LiteLoader.telegram_theme.updateAllSetting", getCurrTheme())
            }
            log('theme change detected')
        } catch (err) {
            error(err)
            error('nativeTheme.on error')
        }
    })
})
ipcMain.handle('LiteLoader.telegram_theme.getSetting', async () => {
    return await getSetting()
})
ipcMain.on('LiteLoader.telegram_theme.setSetting', (event, k, v) => {
    setSetting(k, v)
})
ipcMain.on('LiteLoader.telegram_theme.chooseImage', (event, k, v) => {
    chooseImage()
})
ipcMain.on("LiteLoader.telegram_theme.logToMain", (event, ...args) => {
    log('[renderer]', ...args)
})
ipcMain.on("LiteLoader.telegram_theme.errorToMain", (event, ...args) => {
    error('[renderer]', ...args)
})


module.exports.onBrowserWindowCreated = window => {
    initSetting()
}
