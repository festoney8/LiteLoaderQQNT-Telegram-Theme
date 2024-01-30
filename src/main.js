const fs = require('fs')
const path = require('path')
const { BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron')

const pluginPath = LiteLoader.plugins['telegram_theme'].path.plugin.replaceAll('\\', '/')
const dataPath = LiteLoader.plugins['telegram_theme'].path.data.replaceAll('\\', '/')
const settingPath = path.join(dataPath, 'setting.json').replaceAll('\\', '/')

const enableLog = true
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

// 获取主题
const getCurrTheme = () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

// 初始化设置
const initSetting = () => {
    try {
        if (!fs.existsSync(settingPath)) {
            fs.mkdirSync(dataPath, { recursive: true })
            fs.copyFile(`${pluginPath}/src/setting.json`, settingPath, (err) => {
                if (err) {
                    throw err
                }
                log('initSetting OK')
            })
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
const setSetting = (k, v) => {
    log('setSetting message', k, v)
    try {
        if (!k || v === undefined) {
            throw Error('setSetting k-v invalid')
        }
        fs.readFile(settingPath, 'utf8', (err, data) => {
            if (err) {
                throw err
            }
            let setting = JSON.parse(data)
            setting[getCurrTheme()][k]['value'] = v.toString()
            log(setting)
            const updatedData = JSON.stringify(setting, null, 4)
            fs.writeFile(settingPath, updatedData, 'utf8', (err) => {
                if (err) {
                    throw err
                }
            })
        })
        log('setSetting OK')
    } catch (err) {
        error(err.toString())
        error('setSetting error')
    }
}


ipcMain.handle('LiteLoader.telegram_theme.getSetting', async () => {
    return getSetting()
})
ipcMain.on('LiteLoader.telegram_theme.setSetting', (event, k, v) => {
    setSetting(k, v)
})
ipcMain.on("LiteLoader.telegram_theme.logToMain", (event, ...args) => {
    log('[renderer]', ...args)
})
ipcMain.on("LiteLoader.telegram_theme.errorToMain", (event, ...args) => {
    error('[renderer]', ...args)
})


module.exports.onBrowserWindowCreated = window => {
    log('pluginPath', pluginPath)
    log('settingPath', settingPath)
    log('dataPath', dataPath)

    initSetting()
}
