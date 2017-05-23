import { bus, EventStream } from '../lib/event';

export default async ctx => {
  ctx.type = 'text/event-stream';
  const eventStream = new EventStream();
  ctx.body = eventStream;
  const sub = bus.subscribe(::eventStream.write);
  setTimeout(sub.unsubscribe, 60 * 1000);
};
