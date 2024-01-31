const pluginPath = LiteLoader.plugins["telegram_theme"].path.plugin

const log = (...args) => {
    console.log('[telegram-theme]', ...args)
    telegram_theme.logToMain(...args)
}
const error = (...args) => {
    console.error('[telegram-theme]', ...args)
    telegram_theme.errorToMain(...args)
}
const waitForEle = (selector, callback, interval = 1000) => {
    const timer = setInterval(() => {
        if (document.querySelector(selector)) {
            log(`waitForEle ${selector} EXIST`)
            if (typeof callback === 'function') {
                callback()
            }
            clearInterval(timer)
        }
    }, interval)
}

// 调节会话列表宽度
const adjustContactWidth = () => {
    log('run adjustContactWidth')

    try {
        const layoutAside = document.querySelector('.two-col-layout__aside')
        const layoutMain = document.querySelector('.two-col-layout__main')
        const oldResizeHandler = document.querySelector('.two-col-layout__aside .resize-handler')

        const overrideWidth = () => {
            // 移除默认事件
            const resizeHandler = oldResizeHandler.cloneNode(true)
            oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler)

            // 调大默认长度, 重写事件
            layoutAside.style.setProperty('--min-width-aside', '80px')
            layoutAside.style.setProperty('--max-width-aside', '50vw')
            layoutAside.style.setProperty('--drag-width-aside', '300px')
            layoutAside.style.setProperty('--default-width-aside', '300px')
            layoutAside.style.width = '300px'
            layoutAside.style.flexBasis = '300px'

            let isResizing = false
            let startX = 0
            let startWidth = 0

            resizeHandler.addEventListener('mousedown', (event) => {
                isResizing = true
                startX = event.clientX
                startWidth = parseFloat(getComputedStyle(layoutAside).width)
            })

            document.addEventListener('mousemove', (event) => {
                if (!isResizing) {
                    return
                }
                const width = startWidth + event.clientX - startX
                layoutAside.style.flexBasis = width + 'px'
                layoutAside.style.width = width + 'px'
                layoutAside.style.setProperty('--drag-width-aside', `${width}px`)
            })

            document.addEventListener('mouseup', () => {
                if (!isResizing) {
                    return
                }
                isResizing = false
            })
        }

        if (oldResizeHandler && layoutAside && layoutMain) {
            // 等待QQ赋予aside属性
            let count = 0
            const timer = setInterval(() => {
                const computedStyle = window.getComputedStyle(layoutAside)
                if (computedStyle.getPropertyValue('--min-width-aside') || computedStyle.getPropertyValue('--max-width-aside') || computedStyle.getPropertyValue('--drag-width-aside') || computedStyle.getPropertyValue('--default-width-aside')) {
                    // QQ已完成自定义宽度赋值，覆盖掉
                    overrideWidth()
                    clearInterval(timer)
                }
                count++
                if (count > 20) {
                    clearInterval(timer)
                }
            }, 500)
        }
    } catch (err) {
        error(err.toString())
        error('adjustContactWidth error')
    }
}

// 仿telegram, 同一个人的消息连起来
const concatBubble = (floatAvatar = true) => {
    const msgList = document.querySelector('#ml-root .ml-list')

    // 记录消息数据（用户名、高度、是否断开等）
    let usernameArr
    let heightArr
    let breakingArr

    if (!msgList) {
        return
    }
    // 在比对过程中记录username和offsetHeight
    const compareTwoMsg = (lower, lowerIndex, upper, upperIndex) => {
        return new Promise((resolve) => {
            try {
                // 检查lower是否包含timeStamp, gray-message
                let isLowerTimestamp = false
                if (lower.querySelector('.gray-tip-message,.message__timestamp')) {
                    resolve()
                    breakingArr[lowerIndex] = true
                    isLowerTimestamp = true
                }
                // 检查upper和lower是否包含撤回, 检测message-container
                if (!lower.querySelector('.message-container')) {
                    resolve()
                    breakingArr[lowerIndex] = true
                    return
                }
                if (!upper.querySelector('.message-container')) {
                    resolve()
                    breakingArr[upperIndex] = true
                    return
                }

                const avatarLower = lower.querySelector('span.avatar-span')
                const avatarUpper = upper.querySelector('span.avatar-span')
                const usernameNodeLower = lower.querySelector('div.user-name')
                const usernameLower = avatarLower.getAttribute('aria-label')
                const usernameUpper = avatarUpper.getAttribute('aria-label')
                const contentLower = lower.querySelector('div.msg-content-container')
                if (!isLowerTimestamp && usernameLower === usernameUpper) {
                    const bubbleLower = lower.querySelector('div.msg-content-container')
                    // 强制覆盖upper message的margin-bottom
                    upper.style.setProperty('margin-bottom', '3px', 'important')
                    // 隐藏upper头像
                    avatarUpper.style.display = 'none'
                    // lower的username 不显示
                    if (usernameNodeLower) {
                        usernameNodeLower.style.marginBottom = '0'
                        usernameNodeLower.style.display = 'none'
                    }
                    // 更新lower的border-radius
                    if (contentLower && contentLower.classList) {
                        if (contentLower.classList.contains('container--others')) {
                            bubbleLower.style.borderTopLeftRadius = '8px'
                        } else {
                            bubbleLower.style.borderTopRightRadius = '8px'
                        }
                    }
                }

                if (floatAvatar) {
                    // 记录用户名和高度数据
                    usernameArr[lowerIndex] = usernameLower ? usernameLower : null
                    usernameArr[upperIndex] = usernameUpper ? usernameUpper : null
                    if (!heightArr[lowerIndex]) {
                        const lowerContainer = lower.querySelector('.message-container')
                        heightArr[lowerIndex] = lowerContainer ? lowerContainer.offsetHeight : 0
                    }
                    if (!heightArr[upperIndex]) {
                        const upperContainer = upper.querySelector('.message-container')
                        heightArr[upperIndex] = upperContainer ? upperContainer.offsetHeight : 0
                    }
                }
                resolve()
            } catch (error) {
                resolve()
            }
        })
    }

    const observer = new MutationObserver(async () => {
        try {
            // 合并消息
            // let concatStart = performance.now()
            let currMsgNodeList = Array.from(msgList.querySelectorAll("div.message"))
            let tasks = []

            usernameArr = new Array(currMsgNodeList.length)
            heightArr = new Array(currMsgNodeList.length).fill(0)
            breakingArr = new Array(currMsgNodeList.length).fill(false)

            for (let i = 0; i < currMsgNodeList.length - 1; i++) {
                tasks.push(compareTwoMsg(currMsgNodeList[i], i, currMsgNodeList[i + 1], i + 1))
            }
            await Promise.allSettled(tasks).then(() => {
                // log(`concatBubble time ${performance.now() - concatStart} ms`)

                if (floatAvatar) {
                    try {
                        // 跨消息头像浮动
                        const avatarStart = performance.now()
                        // log(usernameArr.toString())
                        // log(heightArr.toString())
                        // log(breakingArr.toString())
                        let start = 0
                        let end = 0
                        for (let i = 1; i < currMsgNodeList.length; i++) {
                            if (usernameArr[i - 1] && usernameArr[i - 1] === usernameArr[i] && !breakingArr[i - 1]) {
                                end = i
                            } else {
                                // 计算start~end区块总高度
                                let totalHeight = 0
                                for (let j = start; j <= end; j++) {
                                    totalHeight += heightArr[j]
                                }
                                // log(usernameArr.slice(start, end + 1).toString())
                                // log(heightArr.slice(start, end + 1).toString())
                                // log(breakingArr.slice(start, end + 1).toString())
                                // log(start, end, totalHeight)
                                // 扩增start的avatar-span高度
                                const avatar = currMsgNodeList[start].querySelector('span.avatar-span')
                                if (totalHeight > 0 && avatar) {
                                    if (!currMsgNodeList[start].querySelector('.message-container--self')) {
                                        avatar.style.height = totalHeight + (end - start) * 3 + 'px'
                                    }
                                }
                                start = i
                                end = i
                            }
                        }
                        // log(`floatAvatar time ${performance.now() - avatarStart} ms`)
                    } catch (errs) {
                    }
                }
            }).catch()
        } catch (err) {
            error(err.toString())
            error('concatBubble error')
        }
    })
    const config = { childList: true }
    observer.observe(msgList, config)
}

// 获取设置(全部设置)
const getSetting = async () => {
    try {
        return await telegram_theme.getSetting()
    } catch (err) {
        error(err.toString())
        error(`getSetting error`)
        return null
    }
}

// 更新设置(仅一条)
const setSetting = async (k, v) => {
    try {
        await telegram_theme.setSetting(k.toString(), v.toString())
    } catch (err) {
        error(err.toString())
        error(`setSetting error`)
    }
}

// 更新html body中全部自定义CSS变量
const updateAllCSS = async () => {
    const setting = await getSetting()

}
// 更新html body中单一的自定义CSS变量
const updateSingleCSS = async () => {
    const setting = await getSetting()
    for (const k in setting) {
        const v = setting[k]
        const value = v['value']
        const description = v['description']
        const component = v['component']
        const group = v['group']
        log(k, value, description, component, group)
    }
}
const main = async () => {
    log('main start')
    // 插入主题CSS
    if (!document.head?.querySelector('.telegram-css')) {
        const link = document.createElement("link")
        link.type = 'text/css'
        link.rel = 'stylesheet'
        link.classList.add('telegram-css')
        link.href = `local:///${pluginPath.replaceAll('\\', '/')}/src/style/telegram.css`
        document.head.appendChild(link)
        log('insert telegram css, OK')
    }

    // 调节宽度
    waitForEle('.two-col-layout__aside .resize-handler', adjustContactWidth)
    // 拼接气泡
    waitForEle('#ml-root .ml-list', concatBubble)

    // await updateSingleCSS()

    // await setSetting('6666', '8888')
}

try {
    main()
    log('main, OK')
} catch (err) {
    error(err.toString())
    error('main, ERROR')
}

// 打开设置界面时触发
export const onSettingWindowCreated = view => {
    // view 为 Element 对象，修改将同步到插件设置界面
}
