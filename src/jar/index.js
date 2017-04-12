import Jar from './jar';
import { transparentMethod } from '../lib/decorator';
import mkdirp from 'mkdirp';
import request from 'request-promise-native';
import { jarLogger as logger } from '../lib/logger';
import is from 'is-there';

class JarManager {
  @transparentMethod('get', 'forEach', 'delete')
  jars = new Map();
  version = null;

  constructor(context) {
    this.context = context;
    this.db = context.db;
    this.store = this.db.jar;

    this.version = this.db.version;
  }

  create(version) {
    let jar = this.jars.get(version);
    if (!jar) {
      jar = new Jar(this.context, version);
      this.jars.set(version, jar);
      this.store.push(jar.store);
    }
    return jar;
  }

  async init() {
    if (!is.directory(this.context.jarPath)) {
      mkdirp.sync(this.context.jarPath);
    }

    for (let store of this.store) {
      this.jars.set(store.version, new Jar(this.context, store));
    }

    if (this.context.setupOption.updateJarVersion || (!this.context.test && !this.version.updateTime)) {
      await this.updateJarVersion();
    } else {
      // convert to date object
      this.version.updateTime = new Date(this.version.updateTime);
    }
  }

  save() {
    this.forEach(jar => jar.save());
    this.context.db.version = this.version; // this only used for first called
    return this;
  }

  async updateJarVersion() {
    logger.info('updating server jar version list');
    this.version = await request({
      url: this.context.downloadServer + '/mc/game/version_manifest.json',
      json: true,
    });
    this.version.updateTime = new Date();
    logger.info('update success');
    return this;
  }

  isVersion(version) {
    return !!this.getVersion(version);
  }

  getVersion(version) {
    for (let i = 0; i < this.version.versions.length; i++) {
      if (this.version.versions[i].id === version) {
        return this.version.versions[i];
      }
    }
    return null;
  }

  isReleaseVersion(version) {
    const ver = this.getVersion(version);
    return !!ver && ver.type === 'release';
  }

  isSnapshotVersion(version) {
    const ver = this.getVersion(version);
    return !!ver && ver.type === 'snapshot';
  }
}

export default JarManager;
