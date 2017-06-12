import joi from '../lib/joi'
import yn from 'yn'

export default {
  name: 'version',

  schema: {
    id: joi.string().version(),
    type: joi.string().valid('snapshot', 'release'),
    time: joi.date(),
    releaseTime: joi.date(),
    url: joi.string().uri(),
  },

  index: {
    query: {
      refresh: joi.boolean().description('refresh version list to return or from cache'),
    },
    handle: async ctx => {
      if (yn(ctx.query.refresh)) {
        await ctx.context.jarManager.updateJarVersion()
      }
      ctx.body = ctx.context.jarManager.version.versions || []
    },
  },
}
