import joi from 'joi';
import boom from 'boom';

export default function() {
  return {
    name: 'save',

    checker: [
      {
        resourceId: joi.string(),
      },
      async (ctx, next) => {
        const name = ctx.params.save, save = ctx.context.saveManager.get(name);

        if (!save) throw boom.resourceGone('save not created');

        ctx.save = save;
        await next();
      },
    ],

    index: async ctx => {
      ctx.body = ctx.context.saveManager.toJSONObject();
    },

    create: [
      {
        body: {
          name: joi.string().required(),
        },
      },
      async ctx => {
        const save = ctx.context.saveManager.create(ctx.request.body.name);
        ctx.body = save.toJSONObject();
      },
    ],

    update: async ctx => {},

    delete: async ctx => {
      //TODO: check server is using this save
      ctx.save.remove();
      ctx.body = {};
    },

    children: [require('./backup')],
  };
}
