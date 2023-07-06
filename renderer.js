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
    const checkContactHandlerInterval = setInterval(() => {
        const recentContact = document.querySelector('.recent-contact');
        const oldResizeHandler = document.querySelector('.recent-contact .resize-handler');
        if (oldResizeHandler && recentContact) {
            // 移除默认事件
            const resizeHandler = oldResizeHandler.cloneNode(true);
            oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);

            // 调大默认长度, 重写事件
            recentContact.style.width = "300px";
            recentContact.style.flexBasis = "84px";

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
            if (counter >= 20) {
                clearInterval(checkContactHandlerInterval);
            }
        }
    }, 100);

    // 输入框高度调节 重写事件
    //   default css
    //     height: 150px;
    //     flex-basis: 150px;
    //     --inputAreaHeight: 150px;
    //     --expressionPosition: 150px;
    //     --expressionBarPosition: 156px;

    // counter = 0;
    // const checkInputHandlerInterval = setInterval(() => {
    //     const chatInputArea = document.querySelector('.chat-input-area');
    //     const oldResizeHandler = document.querySelector('.chat-input-area .resize-handler');
    //     if (oldResizeHandler && chatInputArea) {
    //         // 移除默认事件
    //         const resizeHandler = oldResizeHandler.cloneNode(true);
    //         oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);
    //
    //         // 调大默认长度, 重写事件
    //         chatInputArea.style.height = "100px";
    //         chatInputArea.style.flexBasis = "65px";
    //
    //         let isResizing = false;
    //         let startY = 0;
    //         let startHeight = 0;
    //
    //         resizeHandler.addEventListener('mousedown', (event) => {
    //             isResizing = true;
    //             startY = event.clientY;
    //             startHeight = parseFloat(getComputedStyle(chatInputArea).height);
    //         });
    //
    //         document.addEventListener('mousemove', (event) => {
    //             if (!isResizing) return;
    //
    //             const height = startHeight + event.clientY - startY;
    //             chatInputArea.style.height = height + 'px';
    //         });
    //
    //         document.addEventListener('mouseup', (event) => {
    //             if (!isResizing) return;
    //
    //             isResizing = false;
    //         });
    //
    //         clearInterval(checkInputHandlerInterval);
    //     } else {
    //         counter++;
    //         if (counter >= 10) {
    //             clearInterval(checkInputHandlerInterval);
    //         }
    //     }
    // }, 100);

}

export {
    onLoad,
}