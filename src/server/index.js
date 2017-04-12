import Server from './server';
import { transparentMethod } from '../lib/decorator';

class ServerManager {
  @transparentMethod('get', 'forEach')
  servers = new Map();

  constructor(context) {
    this.context = context;
    this.db = context.db;
    this.store = this.db.server;
  }

  async init() {
    for (let store of this.store) {
      this.servers.set(store.name, new Server(this.context, store));
    }
    return this;
  }

  create(name, jar, save, options) {
    let server = this.servers.get(name);
    if (!server) {
      server = new Server(this.context, name, jar.version, save.name, options);
      this.servers.set(name, server);
      this.store.push(server.store);
    }
    return server;
  }

  save() {
    this.forEach(server => server.save());
    return this;
  }
}

export default ServerManager;
