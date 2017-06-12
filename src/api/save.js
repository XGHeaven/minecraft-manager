import joi from '../lib/joi'
import boom from 'boom'

export default {
  name: 'save',

  schema: {
    name: joi.string(),
  },

  checker: {
    resourceId: joi.string().token(),

    handle: async (ctx, next) => {
      const name = ctx.params.save,
        save = ctx.context.saveManager.get(name)

      if (!save) throw boom.notFound('save not created')

      ctx.save = save
      await next()
    },
  },

  index: async ctx => {
    ctx.body = ctx.context.saveManager.toJSONObject()
  },

  create: {
    body: {
      name: joi.string().token().required(),
    },
    handle: async ctx => {
      const save = ctx.context.saveManager.create(ctx.request.body.name)
      ctx.body = save.toJSONObject()
    },
  },

  get: async ctx => {
    ctx.body = ctx.save.toJSONObject()
  },

  update: {
    body: {
      backup: joi.string().token(),
    },
    handle: async ctx => {
      if (ctx.request.body.backup && ctx.save.getBackup(ctx.request.body.backup)) {
        ctx.save.useBackup(ctx.request.body.backup)
      }

      ctx.body = ctx.save.toJSONObject()
    },
  },

  delete: async ctx => {
    if (!ctx.save.remove()) {
      throw boom.preconditionRequired('remove save after remove server')
    }

    ctx.body = void 0
  },

  children: [require('./backup')],
}
