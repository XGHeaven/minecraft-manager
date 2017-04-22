# Minecraft Manager

When you have a vps, you want to be more convenient to manage the Minecraft server,
including saves, game versions, permissions, etc..
just need to use web gui, do not need any programming skills.
do not need to remember a lot of parameters and commands.
The Minecraft Manager is your best choice.

# Feature

* [x] support backup & rollback
* [x] support setup many server in one vps (this is not good for gamer, but it's useful)
* [x] easy to start, stop, remove server/backup
* [x] all platform support(linux&mac&window)

# Install

manager use nodejs environment, please install nodejs&npm before.

```
npm install minecraft-manager -g
```

# Usage

```
minecraft-manager --api 8080
```

just so easy~
The default storage path is your `$HOME/.minecraft-manager`.
This will listen on 8080 port to provide http api service for control server.

# Progress

Please to [issue](https://github.com/XGHeaven/minecraft-manager/issues?q=is%3Aopen+is%3Aissue+label%3Aprogress)

# Thanks
