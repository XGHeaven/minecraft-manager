import { Duplex, PassThrough } from 'stream';

export const bus = new Duplex({
  writableObjectMode: true,
});

bus._read = function(n) {};

bus._write = function(data, ec, cb) {
  this.push(data.toString() + '\n\n');
  cb();
};

export class Event {
  constructor(event, data) {
    this.event = event;
    this.data = data;
  }

  toString() {
    return `event: ${this.event}\ndata: ${JSON.stringify(this.data)}`;
  }
}

export function event(event, data = null) {
  bus.write(new Event(event, data));
}

export function stream(lastTime = 60 * 1000) {
  const sub = new PassThrough();

  bus.pipe(sub);

  setTimeout(
    () => {
      bus.unpipe(sub);
      sub.end();
    },
    lastTime,
  );

  return sub;
}
