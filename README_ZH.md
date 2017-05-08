# Minecraft Manager 我的世界管理器

[English](README.md)

有的时候，当你拥有一台 vps 的时候，你希望可以更加方便的管理我的世界服务器，其中包括存档、游戏版本、权限等等
仅仅只需要动动手指，使用 Web 管理界面，不需要任何的编程技巧，也不需要去记住大量的命令和参数
这个时候我的世界管理器就是你最好的选择

# Feature 特点

* [x] 支持存档备份、回滚
* [x] 支持在一台服务器上启动多个服务器，需要设置不同的端口号（虽然这样做并不好，但是这有地时候却很方便）
* [x] 可以很轻松的启动、停止服务器
* [ ] 可以很轻松的修改服务器参数
* [ ] 支持存档的上传、下载、重置
* [x] 全平台支持 MacOS Linux Window(待验证)
* [x] C/S 架构，界面不好看？自己改。没有界面？用 API
* [x] 原版生存服，使用国内镜像源(bmclapi.bangbang93.com)

# Install 安装

首先你需要安装 Node.js 环境，请前往 [Node.js](https://nodejs.org/en/download/current/)，版本建议 Node 6 以上
安装 Node.js 和 npm 之后，在终端中运行以下命令

```
npm install minecraft-manager -g
```

如果一切正常，那么恭喜，你安装成功。针对国内用户，如果安装速度过慢，请使用国内镜像源 [cnpm.js](https://cnpmjs.org/)
安装成功之后，在终端中会出现 `minecraft-manager` 命令，可以测试

```bash
minecraft-manager --version
```

如果安装正确的话会显示当前程序版本

# Usage 使用

一般情况下，你的终端下面运行下面命令开启 deamon。

```bash
minecraft-manager --api 8080
```

默认的保存位置在 `$HOME/.minecraft-manager` 下，如果你需要自定义，那么可以添加 `--dir` 参数
程序会监听 `8080` 端口提供 API 服务，你可以在 Web 管理界面或者通过 API 管理服务器

## Authorization 验证

支持 HTTP 基本验证，通过添加 `--auth` 参数，参数值为 [name]:[pwd]。
目前只支持单用户验证。
如果在生产环境中，建议添加验证。

# Progress

Please to [issue](https://github.com/XGHeaven/minecraft-manager/issues?q=is%3Aopen+is%3Aissue+label%3Aprogress)

# Thanks
