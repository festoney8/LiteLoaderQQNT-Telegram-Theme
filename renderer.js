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

// 信息列表宽度调节 重写事件调宽宽度 不在独立聊天窗运行
function adjustContactWidth() {
    let counter = 0;
    const checkContactHandlerInterval = setInterval(() => {
        const recentContact = document.querySelector('.recent-contact');
        const oldResizeHandler = document.querySelector('.recent-contact .resize-handler');
        if (oldResizeHandler && recentContact) {
            // 移除默认事件
            const resizeHandler = oldResizeHandler.cloneNode(true);
            oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);

            // 调大默认长度, 重写事件
            recentContact.style.width = "300px";
            recentContact.style.flexBasis = "80px";

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            resizeHandler.addEventListener('mousedown', (event) => {
                isResizing = true;
                startX = event.clientX;
                startWidth = parseFloat(getComputedStyle(recentContact).width);
            });

            document.addEventListener('mousemove', (event) => {
                if (!isResizing) return;

                const width = startWidth + event.clientX - startX;
                recentContact.style.width = width + 'px';
            });

            document.addEventListener('mouseup', (event) => {
                if (!isResizing) return;

                isResizing = false;
            });

            clearInterval(checkContactHandlerInterval);
        } else {
            counter++;
            if (counter >= 50) {
                clearInterval(checkContactHandlerInterval);
                log("checkContactHandlerInterval Timeout")
            }
        }
    }, 100);
}

// 输入框高度调节 重写事件
function adjustEditorHeight() {
    let counter = 0;
    const checkInputHandlerInterval = setInterval(() => {
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

            clearInterval(checkInputHandlerInterval);
        } else {
            counter++;
            if (counter >= 50) {
                clearInterval(checkInputHandlerInterval);
                log("checkInputHandlerInterval Timeout")
            }
        }
    }, 100);
}

// 输入区域高度自适应
function autoEditorHeight() {
    let counter = 0;
    const checkChatInputAreaInterval = setInterval(() => {
        const chatInputArea = document.querySelector('.chat-input-area');
        if (chatInputArea) {
            const editor = document.querySelector('.ck.ck-content')
            if (editor) {
                // 监听DOM树
                let initHeight = 0;
                let hasGetInitHeight = false;
                let lastScrollHeight = editor.scrollHeight;
                let isFirstTime = true;
                const container = document.querySelector('.container');
                const containerHeight = parseFloat(getComputedStyle(container).height);
                const observer = new MutationObserver((list) => {
                    // 存在bug
                    // 向editor中贴入图片, 会触发异步计算图片高度/渲染图片等事件, 此时scrollHeight无法获取最新的值
                    // 导致初次贴入图片后editor高度不变，过一阵子才发生变化，或接着输入文字后高度才发生变化
                    if (!hasGetInitHeight) {
                        initHeight = editor.scrollHeight;
                        hasGetInitHeight = true;
                    }
                    if (isFirstTime) {
                        lastScrollHeight = initHeight;
                        isFirstTime = false;
                    }
                    // console.log(getComputedStyle(chatInputArea).height, editor.scrollHeight, lastScrollHeight, initHeight);
                    // console.log(parseFloat(getComputedStyle(chatInputArea).height) + editor.scrollHeight - lastScrollHeight);
                    // 检查新高度是否超过50vh或小于初始高度, 调节可变高度
                    const newHeight = parseFloat(getComputedStyle(chatInputArea).height) + editor.scrollHeight - lastScrollHeight;
                    if (newHeight <= initHeight) {
                        chatInputArea.style.height = initHeight + 'px';
                    } else if (newHeight < containerHeight / 2) {
                        chatInputArea.style.height = newHeight + 'px';
                    } else {
                        chatInputArea.style.height = (containerHeight / 2) + 'px';
                    }
                    lastScrollHeight = editor.scrollHeight;
                });
                const config = {attributes: true, childList: true, subtree: true};
                observer.observe(editor, config);

                clearInterval(checkChatInputAreaInterval);
            }
        } else {
            counter++;
            if (counter >= 50) {
                clearInterval(checkChatInputAreaInterval);
                log("checkChatInputAreaInterval Timeout")
            }
        }
    }, 100);
}

// 消息列表监听(滚动页面or新消息)
function watchMsgList() {
    let counter = 0;
    const debouncedAdjustMsgListStyle = debounce(adjustMsgListStyle, 200);
    const checkMsgListInterval = setInterval(() => {
        const msgListRoot = document.getElementById('ml-root');
        if (msgListRoot) {
            const msgList = msgListRoot.querySelector('div.ml-list.list');
            if (msgList) {
                // 监听消息列表变化
                const observer = new MutationObserver((list) => {
                    debouncedAdjustMsgListStyle(msgList);
                });
                const config = {childList: true};
                observer.observe(msgList, config);
                clearInterval(checkMsgListInterval);
            }
        } else {
            counter++;
            if (counter >= 50) {
                clearInterval(checkMsgListInterval);
                log("checkMsgListInterval Timeout")
            }
        }
    }, 100);
}

// 消息列表CSS样式telegram化
function adjustMsgListStyle() {
    console.log(new Date(), new Date().getMilliseconds())
}

async function onLoad() {
    log(window.location.hash);

    try {
        await addStyle();
        log("addStyle success")
    } catch (error) {
        log("addStyle error", error)
    }
    if (window.location.hash === "#/main/message" || window.location.hash.startsWith("#/chat/")) {
        if (window.location.hash === "#/main/message") {
            try {
                adjustContactWidth();
                log("adjustContactWidth success")
            } catch (error) {
                log("adjustContactWidth error", error)
            }
        }

        try {
            await updateWallpaper();
            log("updateWallpaper success")
        } catch (error) {
            log("updateWallpaper error", error)
        }
        try {
            watchMsgList();
        } catch (error) {
            log("watchMsgList error", error)
        }
        try {
            adjustEditorHeight();
            log("adjustEditorHeight success")
        } catch (error) {
            log("adjustEditorHeight error", error)
        }
        try {
            autoEditorHeight();
            log("autoEditorHeight success")
        } catch (error) {
            log("autoEditorHeight error", error)
        }
    }

    telegram_theme.rendererReady();
}

export {
    onLoad,
}