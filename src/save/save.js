import path from 'path';
import mkdirp from 'mkdirp';
import fs from 'fs';
import is from 'is-there';
import * as utils from '../lib/utils';
import rimraf from 'rimraf';
import _ from 'lodash';
import Entity from '../lib/entity';

const debug = require('debug')('MM:Save');

const EULA = `
#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#${new Date().toLocaleString()}
eula=true
`;

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
    'level-seed': '',
    'prevent-proxy-connections': false,
    motd: 'A Minecraft Server',
    'enable-rcon': false,
  };

  constructor(context, name) {
    if (_.isPlainObject(name)) {
      // restore
      super(name);
    } else {
      super({
        name: name,
        backups: [],
      });
    }

    this.context = context;
    this.path = path.join(context.savePath, this.name);
    this.latestPath = path.join(this.path, 'latest');
    this.backupPath = path.join(this.path, 'backup');
    this._backupPromise = null;
    this.autoBackup = {
      maxKeep: 10,
      cron: null,
    };

    !this.inited && this.init();
  }

  get inited() {
    return is.file(path.join(this.latestPath, 'eula.txt'));
  }

  get generated() {
    return is.file(path.join(this.latestPath, 'world', 'level.dat'));
  }

  init() {
    if (this.inited) return true;

    mkdirp.sync(this.latestPath);
    mkdirp.sync(this.backupPath);

    fs.writeFileSync(path.join(this.latestPath, 'eula.txt'), EULA);
    this.setProperties(this.properties);
  }

  link(server) {
    this.server = server;
    const properties = _.assign({}, this.server.properties, this.properties);
    this.setProperties(properties);
  }

  backup() {
    if (this._backupPromise) return this._backupPromise;
    this.message('server will start backup');

    const backupName = new Date().getTime().toString();
    this.backups.push(backupName);
    this._backupPromise = utils
      .compressFolder(this.latestPath, path.join(this.backupPath, `${backupName}.zip`), total => {
        this._backupPromise.progress.total = total;
        debug(`${total} compressed`);
      })
      .then(() => backupName);

    this._backupPromise.progress = {
      total: 0,
    };

    this._backupPromise.then(backupName => {
      this.message('server backup successful! id:' + backupName);
    });

    return this._backupPromise;
  }

  toJSONObject() {
    return {
      name: this.name,
      backups: this.backups,
      autoBackup: this.autoBackup,
    };
  }

  getBackup(backupName) {
    const filePath = this.getBackupFilePath(backupName);
    if (!is.file(filePath))
      return {
        filePath,
        backupName,
        status: null,
      };

    const backupStat = fs.statSync(this.getBackupFilePath(backupName));

    return {
      filePath,
      backupName,
      size: backupStat.size,
      createTime: backupStat.ctime.getTime(),
    };
  }

  getBackupFilePath(backupName) {
    return path.join(this.backupPath, backupName + '.zip');
  }

  removeBackup(backupName) {
    rimraf.sync(this.getBackupFilePath(backupName));
    if (~this.backups.indexOf(backupName)) {
      this.backups.splice(this.backups.indexOf(backupName), 1);
    }
  }

  remove() {
    rimraf.sync(this.path);
  }

  message(...args) {
    this.server && this.server.monitor.send('say', args.join(' '));
  }

  setProperties(properties) {
    let p = '';
    for (let [key, value] of Object.entries(properties)) {
      p += `${key}=${value}\n`;
    }
    return fs.writeFileSync(path.join(this.latestPath, 'server.properties'), p);
  }
}

export default Save;
