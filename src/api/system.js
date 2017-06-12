import { usage, event } from '../lib/os-usage'
import { EventStream, Event } from '../lib/event'
import joi from '../lib/joi'

const info = {
  version: require('../../package.json').version,
  node: process.versions.node,
}

export default {
  name: 'system',
  checker: {
    resourceId: joi.string().valid('usage', 'info').description('system resource type'),
    handle: async (ctx, next) => {
      const type = ctx.params.system
      await next()
    },
  },
  index: {
    query: {
      format: joi.string().valid('event'),
    },
    handle: async ctx => {
      if (ctx.query.format === 'event') {
        ctx.type = 'text/event-stream'
        const eventStream = new EventStream()
        const sub = event
          .map(e => ((e.data = { usage: e.data, info }), e))
          .subscribe(::eventStream.write, null, ::eventStream.end)
        ctx.body = eventStream
        setTimeout(() => {
          sub.unsubscribe()
          eventStream.end()
        }, 60 * 1000)
        return
      }
      ctx.body = {
        usage: usage(),
        info,
      }
    },
  },
  get: {
    handle: async ctx => {
      switch (ctx.params.system) {
        case 'usage':
          ctx.body = usage()
          break
        case 'info':
          ctx.body = info
          break
      }
    },
  },
}
