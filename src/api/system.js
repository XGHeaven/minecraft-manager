import { usage, event } from '../lib/os-usage';
import { EventStream } from '../lib/event';
import joi from '../lib/joi';

export default {
  name: 'system',
  checker: [
    {
      resourceId: joi.string().valid('usage', 'stream', 'info'),
    },
    async (ctx, next) => {
      const type = ctx.params.system;
      await next();
    },
  ],
  index: async ctx => {
    ctx.body = {
      usage: usage(),
      info: currentInfo(),
    };
  },
  get: async ctx => {
    switch (ctx.params.system) {
      case 'usage':
        ctx.body = usage();
        break;
      case 'info':
        ctx.body = currentInfo();
        break;
      case 'stream':
        ctx.type = 'text/event-stream';
        const eventStream = new EventStream();
        // const sub = RxNode.writeToStream(event, eventStream)
        const sub = event.subscribe(::eventStream.write, null, ::eventStream.end);
        ctx.body = eventStream;
        setTimeout(
          () => {
            sub.unsubscribe();
            eventStream.end();
          },
          60 * 1000,
        );
    }
  },
};

function currentInfo() {
  return {
    version: require('../../package.json').version,
    node: process.versions.node,
  };
}
