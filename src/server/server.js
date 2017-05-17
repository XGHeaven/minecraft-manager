import Monitor from './monitor';
import { serverLogger as logger } from '../lib/logger';
import _ from 'lodash';
import Entity from '../lib/entity';
import { event } from '../lib/event';
import Mutex from '../lib/mutex';
import assert from 'assert';
import Save from '../save/save';
import Jar from '../jar/jar';

class Server extends Entity {
  process = null;

  static defaultOption = {
    javaXms: '256M',
    javaXmx: '1G',
    properties: {
      gamemode: 0,
      difficulty: 1,
      pvp: true,
      'enable-command-block': false,
      'max-players': 20,
      'server-port': 25565,
      'view-distance': 10,
      'white-list': false,
      'online-mode': false,
      'level-seed': 0,
      motd: 'A Minecraft Server',
    },
  };

  l = new Mutex(60 * 1000);

  status = 'stopped';

  constructor(context, name, version, saveName, option = {}) {
    if (_.isPlainObject(name)) {
      super(name);
    } else {
      super({
        name,
        version,
        saveName,
        option,
      });
    }

    _.defaultsDeep(this.option, Server.defaultOption);

    this.context = context;
    this.save_ = context.saveManager.get(this.saveName); // conflict with save() function
    this.jar = context.jarManager.get(this.version);

    assert.ok(this.save_ instanceof Save, 'save is undefined');
    assert.ok(this.jar instanceof Jar, 'jar is undefined');

    this.logger = logger.child({
      server: this.name,
    });
    this.monitor = new Monitor(this.jar, this.save_, this.option);
  }

  async start() {
    this.status = 'installing';
    await this.l.lock();
    if (!this.jar.installed) {
      await this.jar.install();
    }
    this.status = 'starting';
    this.logger.info('starting');
    this.monitor.options = this.option;
    this.save_.link(this);
    const res = await this.monitor.start();
    event('server-start', {
      result: res,
      server: this.name,
    });
    this.logger.info('started');
    this.status = 'started';
    await this.l.unlock();
    return res;
  }

  async stop() {
    this.logger.info('stopping');
    this.status = 'stopping';
    await this.l.lock();
    this.save_.link(null);
    const res = await this.monitor.stop();
    event('server-stop', {
      result: res,
      server: this.name,
    });
    this.logger.info('stopped');
    this.status = 'stopped';
    await this.l.unlock();
    return res;
  }

  async restart() {
    await this.stop();
    await this.start();
  }

  remove(onlySelf) {
    if (this.status !== 'stopped') return false;
    if (onlySelf) {
      return true;
    } else {
      return this.context.serverManager.remove(this);
    }
  }

  toJSONObject() {
    return {
      name: this.name,
      version: this.version,
      saveName: this.save_.name,
      status: this.status,
      options: this.option,
      properties: this.properties,
    };
  }
}

export default Server;
