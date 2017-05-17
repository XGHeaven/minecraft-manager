import { spawn } from 'child_process';
import byline from 'byline';
import { monitorLogger as logger } from '../lib/logger';
import Console from './console';

const MAX_LOG_LINE = 100;

class Monitor {
  process = null;

  status = 'stopped';
  lines = []; // new log push into first element
  console = new Console();
  errors = [];
  exitCode = 0;

  constructor(jar, save, options) {
    this.jar = jar;
    this.save = save;
    this.options = options;
    this.console.on('data', data => {
      this.lines.unshift(data);
      this.lines.length = Math.min(this.lines.length, MAX_LOG_LINE);
    });
  }

  async start() {
    if (this.status === 'started') return true;
    if (this.status !== 'stopped') return false;
    if (!this.jar.installed) {
      this.status = 'installing';
      await this.jar.install();
    }
    this.status = 'starting';

    const argv = [`-Xms${this.options.javaXms}`, `-Xmx${this.options.javaXmx}`, '-jar', this.jar.jarFilePath, 'nogui'];
    logger.info('start server with java ' + argv.join(' '));
    this.process = spawn('java', argv, {
      cwd: this.save.latestPath,
    });

    this.process.stderr.on('data', data => {
      this.errors.unshift(data.toString());
      this.errors.length = Math.min(this.errors.length, MAX_LOG_LINE);
    });

    const nLineStream = byline(this.process.stdout);
    nLineStream.on('data', data => this.console.write(data));

    this.process.on('exit', (code, signal) => {
      this.exitCode = code;
      this.process = null;
      this.status = 'stopped';
    });

    await this.wait(/Done/);
    this.status = 'started';

    return true;
  }

  async stop() {
    if (this.status === 'stopped') return true;
    if (this.status !== 'started') return false;

    this.status = 'stopping';
    const waitExit = this.waitExit();
    this.process.kill();
    await waitExit;
    this.status = 'stopped';

    return true;
  }

  async wait(matcher) {
    await new Promise((resolve, reject) => {
      const callback = log => {
        if (matcher.test(log.message)) {
          resolve();
          this.console.removeListener('data', callback);
        }
      };

      this.console.on('data', callback).once('error', reject);
    });
  }

  async waitExit() {
    return new Promise((resolve, reject) => {
      this.process.once('exit', resolve);
      this.process.once('error', reject);
    });
  }

  async send(...args) {
    if (this.process) {
      this.process.stdin.write(args.join(' ') + '\n');
      this.console.send(args.join(' '));
    }
  }
}

export default Monitor;
