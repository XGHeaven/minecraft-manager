import joi from 'joi';
import boom from 'boom';

const debug = require('debug')('MM:api:backup');

export default {
  name: 'backup',

  checker: {
    resourceId: joi.string().token(),
    handle: async (ctx, next) => {
      const backupId = ctx.params.backup;
      const backup = ctx.save.getBackup(backupId);

      if (!backup) {
        throw boom.resourceGone('there is no backupId ' + backupId);
      }

      ctx.backup = backup;
      await next();
    },
  },

  index: async ctx => {
    ctx.body = ctx.save.backups;
  },

  create: async ctx => {
    ctx.body = ctx.save.backup().backup;
  },

  get: async ctx => {
    ctx.body = ctx.backup;
  },

  delete: async ctx => {
    ctx.save.removeBackup(ctx.backup.id);
    ctx.body = {};
  },
};
