import joi from 'joi';
import boom from 'boom';

const debug = require('debug')('MM:api:backup');

export default function() {
  return {
    name: 'backup',

    checker: [
      {
        resourceId: joi.string().regex(/\d+/),
      },
      async (ctx, next) => {
        const backupName = ctx.params.backup;

        if (!~ctx.save.backups.indexOf(backupName)) {
          throw boom.resourceGone('there is no backupId ' + backupName);
        }

        ctx.backupName = backupName;
        await next();
      },
    ],

    index: async ctx => {
      ctx.body = ctx.save.backups;
    },

    create: async ctx => {
      ctx.save.backup();
      ctx.body = {};
    },

    get: async ctx => {
      const backupName = ctx.backupName;
      ctx.body = ctx.save.getBackup(backupName);
    },

    delete: async ctx => {
      ctx.save.removeBackup(ctx.backupName);
      ctx.body = {};
    },
  };
}
