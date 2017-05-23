import _ from 'lodash';
import { logger } from './logger';

export default class Mutex {
  promises = [Promise.resolve()];
  timeout = 60 * 1000;

  constructor(timeout) {
    this.timeout = timeout;
  }

  async lock(timeout) {
    const pre = _.last(this.promises);
    const promise = new Promise((resolve, reject) => {
      Object.assign(pre, { resolve, reject });
    });

    this.promises.push(promise);
    await pre;

    const timer = setTimeout(
      () => {
        logger.warn('Mutex Timeout');
        process.emit('mutex', 'timeout');
      },
      timeout || this.timeout,
    );
    promise.then(() => clearTimeout(timer)).catch(() => clearTimeout(timer));
  }

  async unlock() {
    const h = _.pullAt(this.promises, 0)[0];
    if (h.resolve) h.resolve();
    else this.promises.push(h);
  }

  async unUse() {
    await this.lock();
    await this.unlock();
  }
}
