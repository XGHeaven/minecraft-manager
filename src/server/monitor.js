import { spawn } from 'child_process';
import byline from 'byline';
import { monitorLogger as logger } from '../lib/logger';

class Monitor {
  process = null;
  status = 'stopped';

  constructor(jar, save, options) {
    this.jar = jar;
    this.save = save;
    this.options = options;
  }

  async start() {
    if (this.status === 'started') return true;
    if (this.status !== 'stopped') return false;
    this.status = 'starting';

    const argv = [`-Xms${this.options.javaXms}`, `-Xmx${this.options.javaXmx}`, '-jar', this.jar.jarFilePath, 'nogui'];
    logger.info('start server with java ' + argv.join(' '));
    this.process = spawn('java', argv, {
      cwd: this.save.latestPath,
    });

    this.process.on('exit', (code, signal) => {
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
    return new Promise((resolve, reject) => {
      const callback = (line, lineCount, byteCount) => {
        if (matcher.test(line)) {
          resolve();
          lineStream.removeListener('data', callback);
        }
      };

      const lineStream = byline(this.process.stdout).on('data', callback).once('error', reject);
    });
  }

  async waitExit() {
    return new Promise((resolve, reject) => {
      this.process.once('exit', resolve);
      this.process.once('error', reject);
    });
  }

  async command(...args) {
    if (this.process) {
      this.process.stdin.write(args.join(' ') + '\n');
    }
  }
}

export default Monitor;
