import boom from 'boom';
import joi from '../lib/joi';
import _ from 'lodash';

export default function() {
  return {
    name: 'server',
    checker: [
      {
        resourceId: joi.string().token().required(),
      },
      async function(ctx, next) {
        const name = ctx.params.server;
        const server = ctx.context.serverManager.get(name);
        if (server === null) {
          throw boom.notFound(`server ${name} not create`);
        }
        ctx.server = server;
        await next();
      },
    ],

    index: async function(ctx) {
      const servers = [];

      ctx.context.serverManager.forEach(server => {
        servers.push(server.toJSONObject());
      });

      ctx.body = servers;
    },

    create: [
      {
        body: {
          name: joi.string().token().required(),
          version: joi.string().version().required(),
          save: joi.string().token().required(),
          options: joi.object({
            javaXms: joi.string(),
            javaXmx: joi.string(),
          }),
        },
      },
      async function(ctx) {
        const name = ctx.request.body.name, version = ctx.request.body.version, saveName = ctx.request.body.save;
        const jar = ctx.context.jarManager.get(version);
        const save = ctx.context.saveManager.get(saveName);

        if (!jar || !save) {
          throw boom.badData('not created jar or save');
        }

        const server = ctx.context.serverManager.create(name, jar, save);

        ctx.body = server.toJSONObject();
      },
    ],

    get: async function(ctx) {
      const server = ctx.server;
      ctx.body = server.toJSONObject();
    },

    update: [
      {
        status: joi.string().valid('start', 'stop').required(),
        options: joi.object({
          javaXmx: joi.string(),
          javaXms: joi.string(),
        }),
      },
      async function(ctx) {
        const status = ctx.request.body.status;

        switch (status) {
          case 'start':
            ctx.server.start();
            break;
          case 'stop':
            ctx.server.stop();
            break;
        }

        _.merge(ctx.server.options, ctx.request.body.options);

        ctx.body = ctx.server.toJSONObject();
      },
    ],

    delete: async ctx => {
      if (!ctx.server.remove()) {
        throw boom.preconditionRequired('remove server when server stopped');
      }

      ctx.body = void 0;
    },

    children: [
      () => ({
        name: 'log',

        index: async ctx => {
          ctx.body = ctx.server.monitor.lines;
        },
      }),
      () => ({
        name: 'error',

        index: async ctx => {
          ctx.body = ctx.server.monitor.errors;
        },
      }),
    ],
  };
}
