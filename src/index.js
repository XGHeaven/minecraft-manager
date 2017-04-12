import JarManager from './jar';
import ServerManager from './server';
import SaveManager from './save';
import API from './api';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as is from 'is-there';
import { logger, apiLogger } from './lib/logger';
import _ from 'lodash';
import * as utils from './lib/utils';

const defaultDB = {
  jar: [],
  server: [],
  save: [],
  version: {},
};

class MinecraftManager {
  downloadServer = 'http://bmclapi.bangbang93.com';

  saveFolder = 'save';
  jarFolder = 'jar';
  serverFolder = 'server';
  basePath = path.join(os.homedir(), '.minecraft-manager');
  dbFile = 'db.json';
  apiPort = 8080;
  rpcPort = 8081;
  useAPI = false;
  useRPC = false;
  api = null;
  setupOption = {
    updateJarVersion: false,
  };

  test = process.env.NODE_ENV === 'test';

  constructor(cfg) {
    _.merge(this, cfg || {});

    this.dbPath = path.join(this.basePath, this.dbFile);
    this.jarPath = path.join(this.basePath, this.jarFolder);
    this.savePath = path.join(this.basePath, this.saveFolder);
    this.serverPath = path.join(this.basePath, this.serverFolder);

    if (!is.file(this.dbPath)) {
      logger.info('cannot find db.json, now creating db.json');
      fs.writeFileSync(this.dbPath, JSON.stringify(defaultDB));
    }

    logger.info('read data from db.json');
    this.db = JSON.parse(fs.readFileSync(this.dbPath, { encoding: 'utf-8' }));

    this.jarManager = new JarManager(this);
    this.saveManager = new SaveManager(this);
    this.serverManager = new ServerManager(this);

    if (this.useAPI) {
      this.api = new API(this);
    }

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGHUP', this.shutdown.bind(this));
    process.on('SIGQUIT', this.shutdown.bind(this));
  }

  shutdown() {
    logger.info('shutting down');
    this.save();

    // wait some async action, i don't which it is
    setImmediate(() => {
      logger.info('Bye');
      process.exit();
    });
  }

  save() {
    this.jarManager.save();
    this.serverManager.save();
    this.saveManager.save();

    fs.writeFileSync(this.dbPath, JSON.stringify(this.db), { encoding: 'utf-8' });
    logger.info('db saved');
  }

  async start() {
    await Promise.all([this.jarManager.init(), this.saveManager.init()]);
    await this.serverManager.init(); // this must be last init

    if (this.useAPI) {
      await utils.callAsPromise(this.api, 'listen', this.apiPort);
      apiLogger.info('api server listen on %d', this.apiPort);
    }

    logger.info('done!');
  }
}

export default MinecraftManager;
