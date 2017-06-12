import { Duplex, PassThrough, Transform } from 'stream'
import Rx from 'rxjs'

const debug = require('debug')('MM:lib:event')

export class Event {
  constructor(event, data) {
    this.event = event
    this.data = data
  }

  toString() {
    return `event: ${this.event}\ndata: ${JSON.stringify(this.data)}`
  }
}

export class EventStream extends Transform {
  constructor(options = {}) {
    Object.assign(options, { objectMode: true })
    super(options)
  }

  _transform(chunk /*Event*/, encode, callback) {
    this.push(chunk.toString() + '\n\n')
    callback()
  }
}

export const bus = new Rx.Subject()

export function event(event, data = null) {
  bus.next(new Event(event, data))
}

export function events(lastTime = 60 * 1000, from = bus) {
  const sub = new PassThrough()

  from.pipe(sub)

  setTimeout(() => {
    from.unpipe(sub)
    sub.end()
    debug('unpipe after', lastTime)
  }, lastTime)

  return sub
}
