import Server from './server';
import Manager from '../lib/manager';

class ServerManager extends Manager {
  constructor(context) {
    super(context);
    this.store = this.db.server;
  }

  async init() {
    for (let store of this.store) {
      this.set(store.name, new Server(this.context, store));
    }
    return this;
  }

  create(name, jar, save, options) {
    let server = this.get(name);
    if (!server) {
      server = new Server(this.context, name, jar.version, save.name, options);
      this.set(name, server);
      this.store.push(server.store);
    }
    return server;
  }

  remove(server) {
    if (typeof server === 'string') {
      server = this.get(server);
    }
    if (!server.remove(true)) return false;
    this.delete(server.name);
    this.store.splice(this.store.indexOf(server));
    return true;
  }

  usedSave(save) {
    for (let [name, server] of this.data) {
      if (server.saveName === save.name) return true;
    }
    return false;
  }

  usedJar(jar, onlyStarted) {
    for (let [name, server] of this.data) {
      if (server.version === jar.version) {
        if (onlyStarted) {
          if (server.status !== 'stopped') return true;
        } else
          return true;
      }
    }
    return false;
  }
}

export default ServerManager;
