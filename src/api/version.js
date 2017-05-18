import joi from 'joi';
import yn from 'yn';

export default {
  name: 'version',

  index: [
    {
      query: {
        refresh: joi.boolean(),
      },
    },
    async ctx => {
      if (yn(ctx.query.refresh)) {
        await ctx.context.jarManager.updateJarVersion();
      }
      ctx.body = ctx.context.jarManager.version.versions || [];
    },
  ],
};
