const fs = require('fs')
const path = require('path')
const { ipcMain, nativeTheme, dialog } = require('electron')

const pluginPath = LiteLoader.plugins['telegram_theme'].path.plugin.replaceAll('\\', '/')
const dataPath = LiteLoader.plugins['telegram_theme'].path.data.replaceAll('\\', '/')
const settingPath = path.join(dataPath, 'setting.json').replaceAll('\\', '/')

const enableLog = false
const enableError = false
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

// 初始化设置，检测版本更新, 补全更新项
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
            // 比对新旧配置
            let oldSettingRaw = fs.readFileSync(settingPath)
            let newSettingRaw = fs.readFileSync(`${pluginPath}/src/setting.json`)

            let localSetting = JSON.parse(oldSettingRaw)
            let newSetting = JSON.parse(newSettingRaw)
            if (localSetting['version'] === newSetting['version']) {
                log('same version, skip update setting')
                return
            }

            // 更新配置
            for (const key in newSetting['light']) {
                if (!localSetting['light'].hasOwnProperty(key)) {
                    localSetting['light'][key] = newSetting['light'][key]
                } else {
                    // 更新默认值和文字介绍
                    localSetting['light'][key]['defaultValue'] = newSetting['light'][key]['defaultValue']
                    localSetting['light'][key]['title'] = newSetting['light'][key]['title']
                    localSetting['light'][key]['description'] = newSetting['light'][key]['description']
                }
            }
            for (const key in newSetting['dark']) {
                if (!localSetting['dark'].hasOwnProperty(key)) {
                    localSetting['dark'][key] = newSetting['dark'][key]
                } else {
                    // 更新默认值和文字介绍
                    localSetting['dark'][key]['defaultValue'] = newSetting['dark'][key]['defaultValue']
                    localSetting['dark'][key]['title'] = newSetting['dark'][key]['title']
                    localSetting['dark'][key]['description'] = newSetting['dark'][key]['description']
                }
            }

            // 更新版本, 保存
            localSetting['version'] = newSetting['version']
            const data = JSON.stringify(localSetting, null, 4)
            fs.writeFileSync(settingPath, data, 'utf8')
            log('initSetting update local setting to latest version')
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
            if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send("LiteLoader.telegram_theme.updateSetting", "--tg-container-image", `url("local:///${imagePath}")`);
                log("chooseImage, OK")
            } else {
                error('chooseImage mainWindow isDestroyed')
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

    // 监听页面加载完成，捕获mainWindow
    window.webContents.on("did-stop-loading", () => {
        log(window.webContents.getURL())
        if (window.webContents.getURL().includes("#/main/message")) {
            mainWindow = window
            log('mainWindow catched')
        }
    })

    // 监听主题切换
    nativeTheme.on('updated', () => {
        try {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("LiteLoader.telegram_theme.updateAllSetting", getCurrTheme())
                log('theme change detected')
            } else {
                error('theme change, mainWindow not exist')
            }
        } catch (err) {
            error(err)
            error('nativeTheme.on error')
        }
    })
}
