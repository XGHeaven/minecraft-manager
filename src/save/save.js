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
  }

  link(server) {
    this.server = server;
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
}

export default Save;
