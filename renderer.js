async function onLoad() {
    const element = document.createElement("style");
    document.head.appendChild(element);

    telegram_theme.updateStyle((event, message) => {
        element.textContent = message;
    });

    telegram_theme.rendererReady();

    // 信息列表宽度调节 重写事件调宽宽度
    let counter = 0;
    const checkDivInterval = setInterval(() => {
        const oldResizeHandler = document.querySelector('.resize-handler');
        const recentContact = document.querySelector('.recent-contact');
        if (oldResizeHandler && recentContact) {
            // 移除默认事件
            const resizeHandler = oldResizeHandler.cloneNode(true);
            oldResizeHandler.parentNode.replaceChild(resizeHandler, oldResizeHandler);

            // 调大默认长度, 重写事件
            recentContact.style.width = "300px";
            recentContact.style.flexBasis = "85px";

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

            clearInterval(checkDivInterval);
        } else {
            counter++;
            if (counter >= 20) {
                clearInterval(checkDivInterval);
            }
        }
    }, 100);
}

export {
    onLoad,
}