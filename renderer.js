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
async function addStyle() {
    const element = document.createElement("style");
    document.head.appendChild(element);

    telegram_theme.updateStyle((event, message) => {
        element.textContent = message;
    });
}

// 更新聊天窗口背景图片
async function updateWallpaper() {
    await telegram_theme.getWallpaperPath().then((imageAbsPath) => {
        const root = document.documentElement;
        root.style.setProperty("--chatarea-wallpaper", `url("appimg://${encodeURI(imageAbsPath)}")`);
    }).catch((err) => {
        log(err)
        alert(err);
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
        log('resizeHandler 事件移除完成')
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
                    console.log("focus chatInputAreaInitHeight", chatInputAreaInitHeight)
                    lastEditorFocusStatus = currEditorFocusStatus;
                }

                console.log("chatInputAreaInitHeight", chatInputAreaInitHeight)
                console.log(content.scrollHeight, content.clientHeight, content.getBoundingClientRect().height)
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
            log('超时', selector, "未出现");
        }
    }, interval);
}

async function onLoad() {
    log(window.location.pathname, window.location.href)

    try {
        await addStyle();
        log("addStyle success")
    } catch (error) {
        log("addStyle error", error)
    }
    try {
        await updateWallpaper();
        log("updateWallpaper success")
    } catch (error) {
        log("updateWallpaper error", error)
    }
    try {
        observeElement(".two-col-layout__aside", adjustContactWidth)
        log("adjustContactWidth success")
    } catch (error) {
        log("adjustContactWidth error", error)
    }
    try {
        observeElement(".chat-input-area", adjustEditorHeight)
        log("adjustEditorHeight success")
    } catch (error) {
        log("adjustEditorHeight error", error)
    }
    try {
        observeElement(".chat-input-area", autoEditorHeight)
        log("autoEditorHeight success")
    } catch (error) {
        log("autoEditorHeight error", error)
    }

    telegram_theme.rendererReady();
}

export {
    onLoad,
}