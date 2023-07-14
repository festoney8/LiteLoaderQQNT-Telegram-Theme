function log(...args) {
    const nowTime = new Date().toLocaleTimeString();
    const newArgs = [`[QQNT Telegram Theme] ${nowTime}:`, ...args];
    console.log.apply(console, newArgs);
}

function debounce(fn, time = 100) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

// 十六进制颜色转实际颜色+透明度
function parseHexColor(color6Bit) {
    const actualColor = color6Bit.slice(0, 7);
    let opacity = 1;
    if (color6Bit.length === 9) {
        const opacityHex = color6Bit.slice(7);
        const opacityDecimal = parseInt(opacityHex, 16);

        if (!isNaN(opacityDecimal)) {
            opacity = opacityDecimal / 255;
        }
    }
    return {
        color: actualColor,
        opacity: opacity.toString()
    };
}

// 6位颜色+透明度转8位颜色
function convertTo8BitHex(color, opacity) {
    const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
    const hexColor = color.slice(0, 7) + opacityHex;
    return hexColor;
}

// css导入
async function updateCSS() {
    const element = document.createElement("style");
    document.head.appendChild(element);

    telegram_theme.updateCSS((event, message) => {
        element.textContent = message;
    });
}

// setting导入
async function updateSetting() {
    const root = document.documentElement;
    telegram_theme.updateSetting((event, message) => {
        const themeSetting = message;
        for (const k in themeSetting) {
            // 检测壁纸, 如用户未设定, 不覆盖默认
            if (k === "--chatarea-wallpaper") {
                const blacklist = ["", "unset", "default", "url()", "url(.)", "url(/)", "none"];
                if (blacklist.includes(themeSetting[k]["value"])) {
                    continue
                }
            }
            root.style.setProperty(k, themeSetting[k]["value"]);
        }
    });
}

async function setSetting(k, v) {
    const data = {"key": k, "value": v}
    try {
        telegram_theme.setSetting(data)
    } catch (err) {
        log('setSetting error', data);
    }
}

async function getSetting() {
    try {
        const result = await telegram_theme.getSetting();
        return result;
    } catch (error) {
        alert("Telegram-Theme 获取设置失败");
        return null;
    }
}

async function resetSetting() {
    try {
        telegram_theme.resetSetting();
    } catch (err) {
        log('恢复默认设置失败', err);
    }
}

// 更新聊天窗口背景图片
async function updateWallpaper() {
    telegram_theme.updateWallpaper((event, imgPath) => {
        const root = document.documentElement;
        root.style.setProperty("--chatarea-wallpaper", `url("file://${imgPath}")`);
    });
}

async function setWallpaper() {
    telegram_theme.setWallpaper();
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
            let containReplyMsg = false;
            let replyMsgHeight = 0;
            const observer = new MutationObserver(async function () {
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

                // 只在editor出现文件or图片or回复消息时检测, 文字输入height变化是实时的无需延迟
                const mediaMsg = editor.querySelector('msg-img, msg-file, msg-reply');
                if (mediaMsg) {
                    await checkContentHeight();
                }
                // 借用上面的delay等待replyMsg渲染100ms
                const replyMsg = editor.querySelector('msg-reply');
                if (containReplyMsg) {
                    if (!replyMsg) {
                        // reply被删除, 恢复高度
                        containReplyMsg = false;
                        curr -= replyMsgHeight;
                    } else {
                        // reply没变化, 本次高度不计入
                    }
                } else {
                    if (replyMsg) {
                        // 出现新reply, 计算高度
                        replyMsgHeight = parseInt(getComputedStyle(replyMsg).height);
                        containReplyMsg = true;
                        curr += replyMsgHeight;
                    }
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
        function compareTwoMsg(lower, upper) {
            return new Promise((resolve, reject) => {
                try {
                    // 检查lower是否包含timeStamp, gray-message
                    if (lower.querySelector(".gray-tip-message,.message__timestamp")) {
                        resolve();
                        return;
                    }
                    // 检查upper和lower是否包含撤回, 检测message-container
                    if (!lower.querySelector(".message-container") || !upper.querySelector(".message-container")) {
                        resolve();
                        return;
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

                    resolve();
                } catch (error) {
                    log("compareMessage Error", error)
                    // log("lower", lower.innerHTML)
                    // log("upper", upper.innerHTML)
                    // 不reject, 避免影响其他任务
                    resolve();
                }
            });
        }

        let lastMessageNodeList = Array.from(msgList.querySelectorAll("div.message"));

        const observer = new MutationObserver(async function () {
            // 比对两轮的msgList
            let currMessageNodeList = Array.from(msgList.querySelectorAll("div.message"));
            let lastMessageNodeSet = new Set(lastMessageNodeList);

            let tasks = [];
            for (let i = 0; i < currMessageNodeList.length - 1; i++) {
                let currMsg = currMessageNodeList[i];
                if (!lastMessageNodeSet.has(currMsg)) {
                    tasks.push(compareTwoMsg(currMessageNodeList[i], currMessageNodeList[i + 1]));
                }
            }
            // 提速
            Promise.all(tasks).then(() => {
                // log("Promise all complete")
            }).catch(() => {
                log("Promise not complete all")
            });

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
            log('超时', selector, "未出现");
        }
    }, interval);
}

async function onLoad() {
    try {
        await updateCSS();
    } catch (error) {
        log("updateCSS error", error)
    }
    // 先设定背景图, 然后由setting覆盖
    try {
        await updateWallpaper();
    } catch (error) {
        log("updateWallpaper error", error)
    }
    try {
        await updateSetting();
    } catch (error) {
        log("updateSetting error", error)
    }
    try {
        observeElement(".two-col-layout__aside", adjustContactWidth)
    } catch (error) {
        log("adjustContactWidth error", error)
    }
    try {
        observeElement(".chat-input-area", adjustEditorHeight)
    } catch (error) {
        log("adjustEditorHeight error", error)
    }
    try {
        observeElement(".chat-input-area", autoEditorHeight)
    } catch (error) {
        log("autoEditorHeight error", error)
    }
    try {
        observeElement('#ml-root .ml-list', concatBubble);
    } catch (error) {
        log("concatBubble error", error);
    }

    telegram_theme.rendererReady();
}


async function onConfigView(view) {
    let pluginPath;
    if (typeof LiteLoader !== "undefined") {
        pluginPath = LiteLoader.plugins.telegram_theme.path.plugin;
    } else {
        pluginPath = betterQQNT.plugins.telegram_theme.path.plugin;
    }
    pluginPath = pluginPath.replace(/\\/g, "/");

    // 引入外部css
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = `file://${pluginPath}/setting_src/bulma.min.css`;
    document.head.appendChild(css);

    const parser = new DOMParser();

    // 章节创建, 外部wrapper
    async function createSection() {
        const componentPath = `file://${pluginPath}/setting_src/section.html`;
        let componentHTML = await (await fetch(componentPath)).text();
        const doc = parser.parseFromString(componentHTML, "text/html");
        return doc.querySelector("section");
    }

    // 组件创建器, 根据组件类型创建每行设置
    async function createComponent(component, id, title, description, value) {
        const componentPath = `file://${pluginPath}/setting_src/${component}.html`;
        let c = await (await fetch(componentPath)).text();
        c = c.replace(/id-placeholder/g, id);
        c = c.replace(/title-placeholder/g, title);
        c = c.replace(/description-placeholder/g, description);

        if (component === "input-box") {
            c = c.replace(/text-holder/g, value);
        } else if (component === "color-picker") {
            const data = parseHexColor(value);
            c = c.replace(/color-placeholder/g, data.color);
            c = c.replace(/opacity-placeholder/g, data.opacity);
        }
        const doc = parser.parseFromString(c, "text/html");
        return doc.querySelector(".box");
    }

    let section = await createSection();
    await view.appendChild(section);
    let sectionEle = view.querySelector("section");

    // 特例, 单独添加reset
    const componentPath = `file://${pluginPath}/setting_src/reset.html`;
    let c = await (await fetch(componentPath)).text();
    const doc = parser.parseFromString(c, "text/html");
    const ele = doc.querySelector(".box");
    sectionEle.appendChild(ele);
    const resetButton = view.querySelector("#reset button");
    resetButton.addEventListener("click", function () {
        const result = confirm('[Telegram-Theme] 是否恢复全部设置至默认？');
        if (result) {
            resetSetting();
            alert('[Telegram-Theme] 已重置全部设置, 请重新进入QQ设置页');
        } else {
            alert('操作已取消');
        }
    })

    // 特例, 单独添加image-selector
    const imageSelector = await createComponent("image-selector", "--chatarea-wallpaper", "聊天栏壁纸", "light与dark主题壁纸互不干扰")
    await sectionEle.appendChild(imageSelector)
    const e = view.querySelector("#--chatarea-wallpaper button");
    e.addEventListener("click", function () {
        setWallpaper();
    });


    // 读设置, 批量创建节点
    let setting;
    try {
        setting = await getSetting();
    } catch (error) {
        throw new Error('Telegram-Theme 获取设置失败');
    }

    let sectionImportant = [];
    let sectionSidebar = [];
    let sectionRecentContact = [];
    let sectionChatarea = [];
    let sectionOther = [];

    let colorPickerIds = [];
    let inputBoxIds = [];

    let value, description, type, component;
    for (let k in setting) {
        if (!setting.hasOwnProperty(k)) {
            continue;
        }
        value = setting[k]["value"];
        description = setting[k]["description"];
        type = setting[k]["type"];
        component = "color-picker";
        if ("component" in setting[k]) {
            component = setting[k]["component"];
        }
        if (component === "color-picker") {
            colorPickerIds.push(k);
        } else if (component === "input-box") {
            inputBoxIds.push(k);
        }
        const ele = await createComponent(
            component,
            k,
            // description显示在title比较好
            description,
            // id显示在description
            k,
            value
        )
        switch (type) {
            case "important":
                sectionImportant.push(ele);
                break;
            case "sidebar":
                sectionSidebar.push(ele);
                break;
            case "recent-contact":
                sectionRecentContact.push(ele);
                break;
            case "chatarea":
                sectionChatarea.push(ele);
                break;
            case "other":
                sectionOther.push(ele);
                break;
        }
    }

    // 批量添加, 第2组: type=important
    sectionImportant.forEach(e => {
        sectionEle.appendChild(e);
    })

    // 第3组: type=sidebar
    sectionSidebar.forEach(e => {
        sectionEle.appendChild(e);
    })

    // 第4组: type=chatarea
    sectionChatarea.forEach(e => {
        sectionEle.appendChild(e);
    })

    // 第5组: type=recent-contact
    sectionRecentContact.forEach(e => {
        sectionEle.appendChild(e);
    })

    // 第6组: type=other
    sectionOther.forEach(e => {
        sectionEle.appendChild(e);
    })


    // 批量添加监听
    // color-picker
    for (let i = 0; i < colorPickerIds.length; i++) {
        const id = colorPickerIds[i];
        const inputOpacity = view.querySelector(`#${id} .slider`);
        const inputColor = view.querySelector(`#${id} .input`);
        inputColor.addEventListener('input', mixColor);
        inputOpacity.addEventListener('input', mixColor);

        function mixColor() {
            const color8bit = convertTo8BitHex(inputColor.value, inputOpacity.value).toString();
            debounce(setSetting(id, color8bit), 200);
        }
    }
    // input-box
    for (let i = 0; i < inputBoxIds.length; i++) {
        const id = inputBoxIds[i];
        const inputEle = view.querySelector(`#${id} input`);
        inputEle.addEventListener('input', function (event) {
            const userInput = event.target.value;
            const regex = /^\d+(\.\d+)?(px|vw|vh|rem|em|%)?$/;
            if (regex.test(userInput)) {
                debounce(setSetting(id, userInput), 200);
            }
        });
    }
}

export {
    onLoad, onConfigView
}