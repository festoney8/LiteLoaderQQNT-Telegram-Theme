async function onLoad() {
    const element = document.createElement("style");
    document.head.appendChild(element);

    telegram_theme.updateStyle((event, message) => {
        element.textContent = message;
    });

    telegram_theme.rendererReady();

    // 更新聊天窗口背景图片
    await telegram_theme.getWallpaperPath().then((imageAbsPath) => {
        const root = document.documentElement;
        root.style.setProperty("--chatarea-wallpaper", `url("appimg://${encodeURI(imageAbsPath)}")`);
    }).catch((err) => {
        alert(err);
    });

    // 信息列表宽度调节 重写事件调宽宽度
    let counter = 0;
    let isIndep = false; // 检测是否为独立聊天窗
    const checkAioInterval = setInterval(() => {
        const aio = document.querySelector(".aio");
        const aioIndependent = document.querySelector(".aio.aio-independent");
        if (aio) {
            if (aioIndependent) {
                isIndep = true;
            }
            clearInterval(checkAioInterval);
        } else {
            counter++;
            if (counter >= 20) {
                clearInterval(checkAioInterval);
            }
        }
    }, 100);
    if (!isIndep) {
        counter = 0;
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
                if (counter >= 30) {
                    clearInterval(checkContactHandlerInterval);
                }
            }
        }, 100);
    }

    // 输入框高度调节 重写事件
    counter = 0;
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
            if (counter >= 10) {
                clearInterval(checkInputHandlerInterval);
            }
        }
    }, 100);

    // 输入区域高度自适应
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
                console.log(getComputedStyle(chatInputArea).height, editor.scrollHeight, lastScrollHeight, initHeight);
                console.log(parseFloat(getComputedStyle(chatInputArea).height) + editor.scrollHeight - lastScrollHeight);
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
        }
    }
}

export {
    onLoad,
}