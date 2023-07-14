# LiteLoaderQQNT-Telegram-Theme

[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT)
插件，基于 [test-theme](https://github.com/mo-jinran/test-theme) 编写，高仿 Telegram 风格的QQNT主题

## 介绍

- 本主题仅为个人使用的娱乐性质主题
- **不要与其他主题同时启用，会造成样式混乱**
- 推荐在 **QQ设置 - 默认字号** 下使用主题，以获得最佳体验
- 测试环境：Win10 + QQNT9.9.0-14619 + LiteLoader0.3.1
    - 已知 Linux 下暂无法使用，MacOS 下未测试

## 功能

- 支持列表栏缩短到只保留头像
- 支持连续聊天合并，隐藏连续头像，隐藏连续用户名
- 私聊模式隐藏全部头像
- 支持输入框打字机模式（光标稳定在一行内）
- 支持自定义设置

## 截图

![1.png](screenshots/1.png)
![2.png](screenshots/2.png)
![3.png](screenshots/3.png)
![4.png](screenshots/4.png)

## 使用方法

1. clone 或下载 zip 文件并解压
2. 将文件夹移动至 `LiteLoaderQQNT数据目录/plugins/` 下面，重启 QQNT 即可

## 已知问题

1. ~~新图片消息预载入时对话气泡大小突变~~ 部分修复
2. 独立窗口模式编辑框不支持自动调高
3. QQNT老版本（如13720）不支持列表栏缩短
4. ~~查看聊天记录时因大图载入引起纵向跳变~~ 已修复
5. ~~快速滚动聊天记录时不流畅~~ 基本修复，仅剩余少量卡顿
6. Linux 系统下的 QQNT 因版本过低会出现诸多问题，无法正常使用
7. 自定义设置页在不适配 dark 主题 (放弃适配 ~~又不是不能用~~)

## 其他

本插件会在 `LiteLoaderQQNT数据目录/plugins_data/telegram_theme` 路径下自动创建 `setting.json` 文件作为默认设定，修改这一文件可以实时反馈效果到QQ

`setting.json` 下有两组设置，分别对应 light 主题和 dark 主题，互不干扰

现已支持在设置页面调节主题，无需再编辑文本文件

主题文件夹下的 `setting.json.example` 文件内容是初始设置，可供备用

## 协议及免责

MIT | 禁止用于任何非法用途，插件开发属个人学习与研究，未提供给任何第三方使用。任何不当使用导致的任何侵权问题责任自负。
