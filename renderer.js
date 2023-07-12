function log(...args) {
    const nowTime = new Date().toLocaleTimeString();
    const newArgs = [`[QQNT Telegram Theme] ${nowTime}:`, ...args];
    console.log.apply(console, newArgs);
}

function debounce(fn, time) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

// css导入
async function updateCSS() {
    const element = document.createElement("style");
    document.head.appendChild(element);

    telegram_theme.updateCSS((event, message) => {
        // console.log('renderer updateCSS')
        element.textContent = message;
    });
}

// setting导入
async function updateSetting() {
    const root = document.documentElement;
    // log("renderer updateCSS")
    telegram_theme.updateSetting((event, message) => {
        // log('renderer updateSetting');
        const themeSetting = message;
        for (const key in themeSetting) {
            // 检测壁纸, 如用户未设定, 不覆盖默认
            if (key === "--chatarea-wallpaper") {
                const blacklist = ["", "unset", "default", "url()", "url(.)", "url(/)", "none"];
                if (blacklist.includes(themeSetting[key])) {
                    continue
                }
            }
            root.style.setProperty(key, themeSetting[key]);
        }
    });
}

async function setSetting(key, value) {
    const data = {key: value}
    try {
        telegram_theme.setSetting(data)
        // log('setSetting success', data);
    } catch (err) {
        // log('setSetting error', data);
    }
}

async function getSetting() {
    await telegram_theme.getSetting().then((result) => {
        // log('getSetting Promise resolved:', result);
    }).catch(error => {
        // log('getSetting Promise rejected:', error);
    })
}

// 更新聊天窗口背景图片
async function updateWallpaper() {
    telegram_theme.updateWallpaper((event, imgPath) => {
        // log("updateWallpaper receive", imgPath);
        const root = document.documentElement;
        root.style.setProperty("--chatarea-wallpaper", `url("file://${imgPath}")`);
    });
}

// 信息列表宽度调节 重写ResizeHandler事件调宽宽度
function adjustContactWidth() {
    const layoutAside = document.querySelector('.two-col-layout__aside');
    const layoutMain = document.querySelector('.two-col-layout__main');
    const oldResizeHandler = document.querySelector('.two-col-layout__aside .resize-handler');
    if (oldResizeHandler && layoutAside) {
        // 移除默认事件
        const resizeHandler = oldResizeHandler.cloneNode(true);
        oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);
        // log('resizeHandler 事件移除完成')
        // 调大默认长度, 重写事件
        layoutAside.style.width = "300px";
        layoutAside.style.flexBasis = "300px";
        layoutAside.style.maxWidth = "50vw";
        layoutAside.style.minWidth = "80px";
        layoutAside.style.flexShrink = "unset";
        layoutAside.style.flexGrow = "unset";
        layoutAside.style.removeProperty('--min-width-aside')
        layoutAside.style.removeProperty('--max-width-aside')
        layoutAside.style.removeProperty('--drag-width-aside')
        layoutAside.style.removeProperty('--default-width-aside')

        layoutMain.style.setProperty('--min-width-main', '0')
        layoutMain.style.flexShrink = "unset";

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandler.addEventListener('mousedown', (event) => {
            isResizing = true;
            startX = event.clientX;
            startWidth = parseFloat(getComputedStyle(layoutAside).width);
        });

        document.addEventListener('mousemove', (event) => {
            if (!isResizing) return;

            const width = startWidth + event.clientX - startX;
            layoutAside.style.flexBasis = width + 'px';
            layoutAside.style.width = width + 'px';
        });

        document.addEventListener('mouseup', (event) => {
            if (!isResizing) return;

            isResizing = false;
        });
    }
}

// 输入框高度调节 重写ResizeHandler事件
function adjustEditorHeight() {
    const chatInputArea = document.querySelector('.chat-input-area');
    const oldResizeHandler = document.querySelector('.chat-input-area .resize-handler');
    if (oldResizeHandler && chatInputArea) {
        // 移除默认事件
        const resizeHandler = oldResizeHandler.cloneNode(true);
        oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);

        // 高度调低, 重写事件
        chatInputArea.style.height = "85px";
        chatInputArea.style.minHeight = "85px";

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizeHandler.addEventListener('mousedown', (event) => {
            isResizing = true;
            startY = event.clientY;
            startHeight = parseFloat(getComputedStyle(chatInputArea).height);
        });

        document.addEventListener('mousemove', (event) => {
            if (!isResizing) return;

            const height = startHeight - event.clientY + startY;
            chatInputArea.style.height = height + 'px';
        });

        document.addEventListener('mouseup', (event) => {
            if (!isResizing) return;

            isResizing = false;
        });
    }
}

// 输入区域高度自适应
function autoEditorHeight() {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const chatInputArea = document.querySelector('.chat-input-area');

    if (chatInputArea) {
        const editor = document.querySelector('.chat-input-area .ck.ck-content')
        const content = editor.querySelector('p')
        if (editor && content) {
            // 监听DOM树
            let lineHeight = parseInt(getComputedStyle(editor).lineHeight);
            let chatInputAreaInitHeight = parseInt(getComputedStyle(chatInputArea).height) - lineHeight;
            let lastContentHeight = content.scrollHeight;
            let lastEditorFocusStatus = editor.classList.contains('ck-focused');
            const observer = new MutationObserver(async function (mutationsList, observer) {
                // 当文字框首次聚焦时, 更新初始高度(记录用户手动调整后高度)
                const chatInputArea = document.querySelector('.chat-input-area');
                let currEditorFocusStatus = editor.classList.contains('ck-focused');
                if (!lastEditorFocusStatus && currEditorFocusStatus) {
                    chatInputAreaInitHeight = parseInt(getComputedStyle(chatInputArea).height) - lineHeight;
                    lastEditorFocusStatus = currEditorFocusStatus;
                }

                // 检测editor高度, 检测时阻断
                // 向editor中贴入图片, 会触发异步计算图片高度/渲染图片等事件, 此时scrollHeight无法获取最新的值
                // 导致初次贴入图片后editor高度不变，过一阵子才发生变化
                let temp = content.scrollHeight;
                let curr = temp;

                async function checkContentHeight() {
                    let innerCounter = 0;
                    while (innerCounter < 10 && curr <= temp) {
                        await delay(10);
                        curr = content.scrollHeight;
                        innerCounter++;
                    }
                }

                // 只在editor出现文件or图片时检测, 文字输入height变化是实时的无需延迟
                const mediaMsg = content.querySelector('msg-img, msg-file');
                if (mediaMsg) {
                    await checkContentHeight();
                }

                // 检查新高度是否超过50vh或小于初始高度, 调节可变高度
                let newHeight = parseInt(getComputedStyle(chatInputArea).height) + curr - lastContentHeight;
                if (newHeight <= chatInputAreaInitHeight) {
                    chatInputArea.style.height = chatInputAreaInitHeight + 'px';
                } else if (newHeight < window.innerHeight / 2) {
                    chatInputArea.style.height = newHeight + 'px';
                } else {
                    chatInputArea.style.height = (window.innerHeight / 2) + 'px';
                }
                lastContentHeight = content.scrollHeight;
            });
            const config = {attributes: true, childList: true, subtree: true};
            observer.observe(editor, config);
        }
    }
}

// 仿telegram, 同一个人的消息连起来
function concatBubble() {
    const msgList = document.querySelector('#ml-root .ml-list');

    if (msgList) {
        function compareTwoMessage(lower, upper) {
            try {
                // 检查lower是否包含timeStamp, gray-message
                const timestamp = lower.querySelector(".gray-tip-message,.message__timestamp");
                if (timestamp) {
                    return
                }
                const avatarLower = lower.querySelector("span.avatar-span");
                const avatarUpper = upper.querySelector("span.avatar-span");
                // const usernameNodeLower = lower.querySelector("span.avatar-span");
                const usernameNodeLower = lower.querySelector("div.user-name");
                const usernameLower = avatarLower.getAttribute("aria-label");
                const usernameUpper = avatarUpper.getAttribute("aria-label");
                const containerLower = lower.querySelector("div.msg-content-container")
                if (usernameLower === usernameUpper) {
                    const bubbleLower = lower.querySelector("div.msg-content-container");
                    // 强制覆盖upper message的margin-bottom
                    upper.style.setProperty("margin-bottom", "3px", "important");
                    // upper头像调透明
                    avatarUpper.style.opacity = "0";
                    // lower的username 不显示
                    if (usernameNodeLower && usernameNodeLower.style) {
                        usernameNodeLower.style.marginBottom = "0";
                        usernameNodeLower.style.display = "none";
                    }
                    // 更新lower的border-radius
                    if (containerLower && containerLower.classList) {
                        if (containerLower.classList.contains("container--others")) {
                            bubbleLower.style.borderTopLeftRadius = "8px";
                        } else {
                            bubbleLower.style.borderTopRightRadius = "8px";
                        }
                    }
                }
            } catch (error) {
                // log("compareMessage Error", error)
                // log("lower", lower)
                // log("upper", upper)
            }
        }

        let lastMessageNodeList = Array.from(msgList.querySelectorAll("div.message"));

        const observer = new MutationObserver(async function (mutationsList, observer) {
            // 比对两轮的msgList
            let currMessageNodeList = Array.from(msgList.querySelectorAll("div.message"));
            let lastMessageNodeSet = new Set(lastMessageNodeList);
            for (let i = 0; i < currMessageNodeList.length; i++) {
                let currMsg = currMessageNodeList[i];
                if (!lastMessageNodeSet.has(currMsg)) {
                    // 新载入的消息
                    if (i + 1 < currMessageNodeList.length) {
                        compareTwoMessage(currMessageNodeList[i], currMessageNodeList[i + 1])
                    }
                }
            }
            lastMessageNodeList = currMessageNodeList;
        });
        const config = {childList: true};
        observer.observe(msgList, config);
    }
}


function observeElement(selector, callback, callbackEnable = true, interval = 100, timeout = 5000) {
    let elapsedTime = 0;
    const timer = setInterval(function () {
        const element = document.querySelector(selector);
        if (element) {
            if (callbackEnable) {
                callback();
            }
            clearInterval(timer);
        }

        elapsedTime += interval;
        if (elapsedTime >= timeout) {
            clearInterval(timer);
            // log('超时', selector, "未出现");
        }
    }, interval);
}

async function onLoad() {
    try {
        await updateCSS();
        // log("updateCSS success")
    } catch (error) {
        // log("updateCSS error", error)
    }
    // 先设定背景图, 然后由setting覆盖
    try {
        await updateWallpaper();
        // log("updateWallpaper success")
    } catch (error) {
        // log("updateWallpaper error", error)
    }
    try {
        await updateSetting();
        // log("updateSetting success")
    } catch (error) {
        // log("updateSetting error", error)
    }
    // try {
    //     observeElement(".two-col-layout__aside", adjustContactWidth)
    // //     log("adjustContactWidth success")
    // } catch (error) {
    // //     log("adjustContactWidth error", error)
    // }
    try {
        observeElement(".chat-input-area", adjustEditorHeight)
        // log("adjustEditorHeight success")
    } catch (error) {
        // log("adjustEditorHeight error", error)
    }
    try {
        observeElement(".chat-input-area", autoEditorHeight)
        // log("autoEditorHeight success")
    } catch (error) {
        // log("autoEditorHeight error", error)
    }

    try {
        observeElement('#ml-root .ml-list', concatBubble);
    } catch (err) {
    }

    telegram_theme.rendererReady();

    getSetting();

    setSetting("c", "345");
    setSetting("d", "456");
    setSetting("e", "567");
    setSetting("c", "543");
}

export {
    onLoad,
}