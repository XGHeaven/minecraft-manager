import * as request from 'request';
import * as fs from 'fs';
import * as is from 'is-there';
import { jarLogger as logger } from '../lib/logger';
import rimraf from 'rimraf';
import Entity from '../lib/entity';
import _ from 'lodash';
import { event } from '../lib/event';
import Mutex from '../lib/mutex';

const debug = require('debug')('MM:JarManager:Jar');

class Jar extends Entity {
  l = new Mutex(300 * 1000);

  constructor(context, version) {
    if (_.isPlainObject(version)) {
      super(version);
    } else {
      super({
        version,
      });
    }

    this.context = context;
    this._installPromise = null;
    this.jarFilePath = this.context.jarPath + `/server-vanilla-${this.version}.jar`;
    this.logger = logger.child({
      jar: this.version,
    });
  }

  get installed() {
    return is.file(this.jarFilePath) && !this._installPromise;
  }

  async install(forceInstall = false) {
    await this.l.lock();
    if (!forceInstall && this.installed) return false;

    this.logger.info('start download');

    let download = (this._installPromise = new Promise((resolve, reject) => {
      const req = request
        .get(this.context.downloadServer + `/version/${this.version}/server`)
        .on('response', res => {
          download.progress.total = res.headers['content-length'];
          download.progress.updateTime = new Date();
          debug(this.version, download.progress.total, 'byte to download');

          download.cancel = () => {
            req.abort();
            this.logger.info('download cancel');
            rimraf.sync(this.jarFilePath);
          };
        })
        .on('data', chunk => {
          let now = new Date(), usedTime = now.getTime() - download.progress.updateTime.getTime();
          download.progress.transferred += chunk.length;
          download.progress.updateTime = now;
          download.progress.percentage = download.progress.transferred / download.progress.total;
          download.progress.time += usedTime;
          if (usedTime > 1000) download.progress.speed = chunk.length / usedTime;
          else download.progress.speed = ((1000 - usedTime) * download.progress.speed + chunk.length) / 1000;
          debug(
            this.version,
            usedTime,
            chunk.length,
            download.progress.speed.toFixed(2),
            download.progress.percentage.toFixed(2),
          );
        })
        .on('end', () => {
          debug('end');
          this._installPromise = null;
          event('jar-download', {
            result: true,
            version: this.version,
          });
          resolve();
        })
        .on('error', err => {
          debug('error', err);
          this._installPromise = null;
          event('jar-download', {
            result: false,
            version: this.version,
          });
          reject(err);
        });

      req.pipe(fs.createWriteStream(this.jarFilePath)).on('close', function() {
        // called on download cancel
        // don't use arrow function, `this` -> writable stream
        debug('close');
      });
    }));

    download.progress = {
      total: 0,
      transferred: 0,
      percentage: 0,
      speed: 0,
      time: 0,
      updateTime: null,
    };

    await download;
    await this.l.unlock();
    return true;
  }

  get status() {
    if (this._installPromise) return 'installing';
    if (this.installed) return 'installed';
    return 'uninstall';
  }

  toJSONObject() {
    return {
      version: this.version,
      status: this.status,
      download: this._installPromise && this._installPromise.progress,
    };
  }

  remove(onlySelf) {
    if (this.isUsed()) return false;
    if (!onlySelf) {
      return this.context.jarManager.remove(this);
    } else {
      if (this._installPromise) this._installPromise.cancel();
      rimraf.sync(this.jarFilePath);
      return true;
    }
  }

  removeJar() {
    rimraf.sync(this.jarFilePath);
  }

  isUsed() {
    return this.context.serverManager.usedJar(this);
  }

  isUsing() {
    return this.context.serverManager.usedJar(this, true);
  }
}

export default Jar;
