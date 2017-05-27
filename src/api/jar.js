import * as boom from 'boom';
import joi from '../lib/joi';

export default {
  name: 'jar',

  schema: {
    version: joi.string().version(),
    status: joi.string().valid('installing', 'installed', 'uninstall'),
  },

  checker: {
    resourceId: joi.string().version(),
    handle: async (ctx, next) => {
      const version = ctx.params.jar;
      const jar = ctx.context.jarManager.get(version);
      if (!jar) {
        throw boom.notFound(`jar ${version} not created`);
      }
      ctx.jar = jar;
      await next();
    },
  },

  index: async function(ctx) {
    ctx.body = ctx.context.jarManager.toJSONObject();
  },

  create: {
    body: {
      version: joi.string().version().required(),
    },
    handle: async ctx => {
      const version = ctx.request.body.version;

      if (!ctx.context.jarManager.isVersion(version)) {
        throw boom.badData('invalid version');
      }

      ctx.status = ctx.context.jarManager.get(version) ? 200 : 201;
      ctx.body = ctx.context.jarManager.create(version).toJSONObject();
    },
  },

  update: {
    body: {
      status: joi.string().valid('install', 'uninstall', 'reinstall').required(),
    },
    handle: async ctx => {
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
  },

  get: async ctx => {
    ctx.body = ctx.jar.toJSONObject();
  },

  delete: async ctx => {
    if (!ctx.jar.remove()) {
      throw boom.preconditionRequired('remove jar after remove server');
    }
    ctx.body = void 0;
  },
};
