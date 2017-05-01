import { Duplex } from 'stream';
import { Event } from '../lib/event';
import Debug from 'debug';

const debug = Debug('MM:ServerManager:Console');
const logReg = /^\[(\d{2}:\d{2}:\d{2})] \[(.+)\/(\w+)]: (.+)$/;

class Console extends Duplex {
  eventStream = new Duplex({ objectMode: true });

  constructor() {
    super({ objectMode: true });

    this.eventStream._read = () => {};
    this.eventStream._write = function(log, ec, cb) {
      this.push(new Event('message', log).toString() + '\n\n');
      cb();
    };
    this.pipe(this.eventStream);
  }

  _read() {}

  _write(chunk, ec, cb) {
    this.push(new Log(chunk.toString()));
    cb();
  }

  send(message) {
    this.push(new Log(message, 'client'));
  }
}

class Log {
  constructor(log, from = 'server') {
    this.from = from;

    switch (from) {
      case 'client':
        this.log = log;
        const time = new Date();
        this.time = `${('0' + time.getHours()).slice(-2)}:${('0' + time.getMinutes()).slice(-2)}:${('0' + time.getSeconds()).slice(-2)}`;
        break;
      default:
        let match = log.match(logReg);
        if (match === null) {
          match = [];
          debug(log);
        }
        this.time = match[1];
        this.name = match[2];
        this.type = match[3];
        this.message = match[4];
        this.log = log;
    }
  }

  toString() {
    return this.log;
  }
}

export default Console;
