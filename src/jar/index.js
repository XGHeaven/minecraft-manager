import Jar from './jar'
import mkdirp from 'mkdirp'
import request from 'request-promise-native'
import { jarLogger as logger } from '../lib/logger'
import is from 'is-there'
import Manager from '../lib/manager'

class JarManager extends Manager {
  constructor(context) {
    super(context)
    this.store = this.db.jar

    this.version = this.db.version
  }

  create(version) {
    let jar = this.get(version)
    if (!jar) {
      jar = new Jar(this.context, version)
      this.set(version, jar)
      this.store.push(jar.store)
    }
    return jar
  }

  remove(jar) {
    if (typeof jar === 'string') {
      jar = this.get(jar)
    }
    if (!jar.remove(true)) return false
    this.delete(jar.version)
    this.store.splice(this.store.indexOf(jar.store, 1))
    return true
  }

  async init() {
    if (!is.directory(this.context.jarPath)) {
      mkdirp.sync(this.context.jarPath)
    }

    for (let store of this.store) {
      this.set(store.version, new Jar(this.context, store))
    }

    if (this.context.setupOption.updateJarVersion || (!this.context.test && !this.version.updateTime)) {
      await this.updateJarVersion()
    } else {
      // convert to date object
      this.version.updateTime = new Date(this.version.updateTime)
    }
  }

  save() {
    super.save()
    this.context.db.version = this.version // this only used for first called
    return this
  }

  async updateJarVersion() {
    logger.info('updating server jar version list')
    this.version = await request({
      url: this.context.downloadServer + '/mc/game/version_manifest.json',
      json: true,
    })
    this.version.versions = this.version.versions.filter(
      version => version.type === 'release' || version.type === 'snapshot',
    )
    this.version.updateTime = new Date()
    logger.info('update success')
    return this
  }

  isVersion(version) {
    return !!this.getVersion(version)
  }

  getVersion(version) {
    for (let i = 0; i < this.version.versions.length; i++) {
      if (this.version.versions[i].id === version) {
        return this.version.versions[i]
      }
    }
    return null
  }

  isReleaseVersion(version) {
    const ver = this.getVersion(version)
    return !!ver && ver.type === 'release'
  }

  isSnapshotVersion(version) {
    const ver = this.getVersion(version)
    return !!ver && ver.type === 'snapshot'
  }
}

export default JarManager
