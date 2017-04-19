import Monitor from './monitor';
import { serverLogger as logger } from '../lib/logger';
import _ from 'lodash';
import Entity from '../lib/entity';

class Server extends Entity {
  process = null;

  option = {
    javaXms: '256M',
    javaXmx: '1G',
  };

  properties = {
    gamemode: 0,
    difficulty: 1,
    pvp: true,
    'enable-command-block': false,
    'max-players': 20,
    'server-port': 25565,
    'server-ip': '',
    'view-distance': 10,
    'white-list': false,
    'online-mode': false,
    'level-seed': '',
    motd: 'A Minecraft Server',
  };

  constructor(context, name, version, saveName, option, properties) {
    if (_.isPlainObject(name)) {
      super(name);
    } else {
      super({
        name,
        version,
        option,
        saveName,
        properties,
      });
    }

    this.context = context;
    this.save_ = context.saveManager.get(this.saveName); // conflict with save() function
    this.jar = context.jarManager.get(this.version);
    this.monitor = null;
    this.logger = logger.child({
      server: this.name,
    });
    this.monitor = new Monitor(this.jar, this.save_, this.option);
  }

  async start() {
    this.save_.link(this);
    this.logger.info('starting');
    const res = await this.monitor.start();
    this.logger.info('started');
    return res;
  }

  async stop() {
    this.logger.info('stopped');
    this.save_.link(null);
    return await this.monitor.stop();
  }

  async restart() {
    await this.stop();
    await this.start();
  }

  get status() {
    return this.monitor.status || 'stopped';
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
