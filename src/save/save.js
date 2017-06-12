import path from 'path'
import mkdirp from 'mkdirp'
import fs from 'fs'
import is from 'is-there'
import * as utils from '../lib/utils'
import rimraf from 'rimraf'
import _ from 'lodash'
import Entity from '../lib/entity'
import { event } from '../lib/event'
import Mutex from '../lib/mutex'
import readdir from 'readdir'
import nbt from 'prismarine-nbt'

const debug = require('debug')('MM:Save')

const EULA = `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#${new Date().toString()}
eula=true
`

class Save extends Entity {
  properties = {
    'max-tick-time': 60000,
    'generator-settings': '',
    'force-gamemode': false,
    'allow-nether': true,
    gamemode: 0,
    'enable-query': false,
    'player-idle-timeout': 0,
    difficulty: 1,
    'spawn-monsters': true,
    'op-permission-level': 4,
    'announce-player-achievements': true,
    pvp: true,
    'snooper-enabled': true,
    'level-type': 'DEFAULT',
    hardcore: false,
    'enable-command-block': false,
    'max-players': 20,
    'network-compression-threshold': 256,
    'resource-pack-sha1': '',
    'max-world-size': 29999984,
    'server-port': 25565,
    'server-ip': '',
    'spawn-npcs': true,
    'allow-flight': false,
    'level-name': 'world',
    'view-distance': 10,
    'resource-pack': '',
    'spawn-animals': true,
    'white-list': false,
    'generate-structures': true,
    'online-mode': false,
    'max-build-height': 256,
    'level-seed': 0,
    'prevent-proxy-connections': false,
    motd: 'A Minecraft Server',
    'enable-rcon': false,
  }

  status = 'normal'

  // 10 minute
  l = new Mutex(600 * 1000)

  constructor(context, name) {
    if (_.isPlainObject(name)) {
      // restore
      super(name)
    } else {
      super({
        name: name,
        backups: [],
      })
    }

    this.context = context
    this.path = path.join(context.savePath, this.name)
    this.latestPath = path.join(this.path, 'latest')
    this.backupPath = path.join(this.path, 'backup')
    this.opFilePath = path.join(this.latestPath, 'ops.json')
    this.playerFolder = path.join(this.latestPath, 'world', 'playerdata')
    this.userCachePath = path.join(this.latestPath, 'usercache.json')
    this._backupPromise = null
    this.autoBackup = {
      maxKeep: 10,
      cron: null,
    }

    !this.inited && this.init()
  }

  get inited() {
    return is.file(path.join(this.latestPath, 'eula.txt'))
  }

  get generated() {
    return is.file(path.join(this.latestPath, 'world', 'level.dat'))
  }

  init() {
    if (this.inited) return true

    mkdirp.sync(this.latestPath)
    mkdirp.sync(this.backupPath)

    fs.writeFileSync(path.join(this.latestPath, 'eula.txt'), EULA)
    this.setProperties(this.properties)
  }

  link(server) {
    this.server = server
    if (server === null) return
    const properties = _.assign({}, this.properties, this.server.option.properties)
    this.setProperties(properties)
  }

  // pseudo async function
  async backup(backupId) {
    await this.l.lock()
    this.message('server will start backup')
    this.status = 'backup'

    backupId = backupId || new Date().getTime().toString()
    const startTime = new Date().getTime()
    let backup = this.getBackup(backupId)

    if (!backup) {
      backup = {
        id: backupId,
        size: 0,
        createTime: null,
        usageTime: 0,
      }
      this.backups.push(backup)
    }

    this._backupPromise = utils
      .compressFolder(this.latestPath, this.getBackupFilePath(backupId), total => {
        backup.size = total
        debug(`${total} compressed`)
      })
      .then(() => backup)

    this._backupPromise.then(backup => {
      this.message('server backup successful! id:' + backupId)
      this.status = 'normal'
      backup.createTime = new Date().getTime()
      backup.usageTime = backup.createTime - startTime
      this._backupPromise = null
      event('save-backup', {
        result: true,
        save: this.name,
        backup,
      })
    })

    this._backupPromise.backup = backup

    let result = await this._backupPromise
    await this.l.unlock()
    return result
  }

  toJSONObject() {
    return {
      name: this.name,
      backups: this.backups,
      autoBackup: this.autoBackup,
      status: this.status,
    }
  }

  getBackup(backupId) {
    const backup = _.find(this.backups, backup => backup.id === backupId)
    return backup || null
  }

  getBackupFilePath(backupId) {
    return path.join(this.backupPath, backupId + '.zip')
  }

  removeBackup(backupId) {
    const backup = this.getBackup(backupId)
    if (backup) {
      rimraf.sync(this.getBackupFilePath(backupId))
      _.pull(this.backups, backup)
    }
  }

  async useBackup(backupId) {
    //TODO: check server status
    const backup = this.getBackup(backupId)

    if (!backup) return false

    // stop server
    let beforeStatus = 'stopped',
      server = this.server
    if (server) {
      await server.l.unUse()
      beforeStatus = server.status
      await server.stop()
    }

    await this.l.lock()
    event('save-start-rollback', {
      save: this.name,
      backup,
    })
    await this.l.unlock()
    await this.backup('latest')
    await this.l.lock()

    this.status = 'rollback'

    rimraf.sync(this.latestPath)
    mkdirp.sync(this.latestPath)

    this._backupPromise = utils.decompressFolder(this.getBackupFilePath(backupId), this.latestPath)
    await this._backupPromise
    this._backupPromise = null
    event('save-rollback', {
      result: true,
      save: this.name,
      backup,
    })

    this.status = 'normal'
    await this.l.unlock()

    if (server && beforeStatus === 'started') await server.start()
    return true
  }

  remove(onlySelf) {
    if (this.isUsed()) return false
    if (onlySelf) {
      rimraf.sync(this.path)
    } else {
      this.context.saveManager.remove(this)
    }
    return true
  }

  message(...args) {
    this.server && this.server.monitor.send('say', args.join(' '))
  }

  setProperties(properties) {
    let p = ''
    for (let [key, value] of Object.entries(properties)) {
      p += `${key}=${value}\n`
    }
    return fs.writeFileSync(path.join(this.latestPath, 'server.properties'), p)
  }

  isUsed() {
    return this.context.serverManager.usedSave(this)
  }

  isUsing() {
    return !!this.server
  }

  async getOps() {
    try {
      return JSON.parse(await utils.callAsPromise(fs, 'readFile', this.opFilePath, 'utf-8'))
    } catch (e) {
      return null
    }
  }

  async getPlayer(uuid) {
    if (uuid) {
      const playerPath = path.join(this.playerFolder, `${uuid}.dat`)
      if (is.file(playerPath)) {
        return {
          uuid: uuid,
          nbt: await utils.callAsPromise(
            nbt,
            'parse',
            await utils.callAsPromise(fs, 'readFile', path.join(this.playerFolder, playerPath)),
          ),
        }
      }
      return null
    }

    const playerFilePathList = await utils.callAsPromise(readdir, 'read', this.playerFolder)
    const playerList = []
    for (let playerFilePath of playerFilePathList) {
      playerList.push({
        uuid: path.parse(playerFilePath).name,
        nbt: await utils.callAsPromise(
          nbt,
          'parse',
          await utils.callAsPromise(fs, 'readFile', path.join(this.playerFolder, playerFilePath)),
        ),
      })
    }
    return playerList
  }

  async getUserCache() {
    return (await JSON.parse(await utils.callAsPromise(fs, 'readFile', this.userCachePath, 'utf-8'))) || []
  }
}

export default Save
