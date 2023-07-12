# LiteLoaderQQNT-Telegram-Theme

[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 插件，基于 [test-theme](https://github.com/mo-jinran/test-theme) 编写，高仿 Telegram 风格的QQNT主题



## 介绍

- 本主题仅为个人使用的娱乐性质主题
- 不要与其他主题同时启用，会造成样式混乱
- 推荐在 **QQ设置 - 默认字号** 下使用主题，以获得最佳体验
- 测试环境：Win10 + QQNT9.9.0-14619 + LiteLoader0.3.1



## 功能

- 支持列表栏缩短到只保留头像
- 支持连续聊天合并，隐藏连续头像，隐藏连续用户名
- 私聊模式隐藏全部头像
- 支持输入框打字机模式（光标稳定在一行内）
- 支持自定义设置（需自行修改设置文件）



## 截图
![1.png](screenshots/1.png)
![2.png](screenshots/2.png)
![3.png](screenshots/3.png)
![4.png](screenshots/4.png)



## 使用方法

1. clone 或下载 zip 文件并解压
2. 将文件夹移动至 `LiteLoaderQQNT数据目录/plugins/` 下面，重启 QQNT 即可



## 已知问题
1. ~~新图片消息预载入时对话气泡大小突变~~，已修复
2. 独立窗口模式编辑框不支持自动调高
3. QQNT老版本（如13720）不支持列表栏缩短



## 如何修改设置
本插件会在 `LiteLoaderQQNT数据目录/plugins_data/telegram_theme` 路径下自动创建 `setting.json` 文件作为默认设定，修改这一文件可以实时反馈效果到QQ

`setting.json` 下有两组设置，分别对应 light 主题和 dark 主题，互不干扰

#### 常用的修改项列出如下

- `"--chatarea-wallpaper": "unset"`

  这是背景图片路径，填写 unset 时默认使用主题自带背景图片。设置自己的图片路径请使用绝对链接，使用正斜杠 `/////`，并在前面添加 `file://` 作为协议，并用`url(\"\")` 包起来
  如：`"chatarea-wallpaper": "url(\"file://D:/path/to/image.jpg\")"`

- `--chatarea-bubble-color-others` 聊天区域对方对话气泡颜色

- `--chatarea-bubble-color-self` 聊天区域自己的对话气泡颜色

- `--chatarea-text-color-self` 自己的文字颜色

- `--chatarea-text-color-others` 对方的文字颜色



修改后请务必保证不损坏 JSON 文件格式，尤其注意双引号和末尾逗号，**推荐用 vscode 等具有格式错误提示的编辑器进行修改**
