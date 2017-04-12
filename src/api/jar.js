import * as boom from 'boom';
import * as joi from 'joi';

const vad = {
  version: joi.string().regex(/^\d+\.\d+(\.\d+)?$/, 'minecraft version'),
};

export default function() {
  return {
    name: 'jar',

    checker: [
      {
        resourceId: vad.version,
      },
      async (ctx, next) => {
        const version = ctx.params.jar;
        const jar = ctx.context.jarManager.get(version);
        if (!jar) {
          throw boom.resourceGone(`jar ${version} not created`);
        }
        ctx.jar = jar;
        await next();
      },
    ],

    index: async function(ctx) {
      const jars = [];

      ctx.context.jarManager.forEach(jar => {
        jars.push(jar.toJSONObject());
      });

      ctx.body = jars;
    },

    create: [
      {
        body: {
          version: vad.version.required(),
        },
      },
      async ctx => {
        const version = ctx.request.body.version;

        if (!ctx.context.jarManager.isVersion(version)) {
          throw boom.badData('invalid version');
        }

        ctx.body = ctx.context.jarManager.create(version).toJSONObject();
      },
    ],

    update: [
      {
        body: {
          status: joi.string().valid('install', 'uninstall', 'reinstall').required(),
        },
      },
      async ctx => {
        const status = ctx.request.body.status;
        const jar = ctx.jar;

        switch (status) {
          case 'install':
            jar.install();
            break;
          case 'reinstall':
            jar.install(true);
            break;
          case 'uninstall':
            if (jar.status === 'installing') {
              jar.install().cancel();
            } else {
              jar.removeJar();
            }
        }

        ctx.body = jar.toJSONObject();
      },
    ],

    get: async ctx => {
      ctx.body = ctx.jar.toJSONObject();
    },

    delete: async ctx => {
      ctx.jar.remove();
      ctx.body = {};
    },
  };
}
