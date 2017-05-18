import boom from 'boom';
import joi from '../lib/joi';
import _ from 'lodash';
import { events } from '../lib/event';

export default {
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
        options: joi.object().keys({
          javaXms: joi.string(),
          javaXmx: joi.string(),
          properties: joi.object().properties(),
        }),
      },
    },
    async function(ctx) {
      const { name, version, save: saveName, options } = ctx.request.body;
      const jar = ctx.context.jarManager.get(version);
      const save = ctx.context.saveManager.get(saveName);

      if (!jar || !save) {
        throw boom.badData('not created jar or save');
      }

      const server = ctx.context.serverManager.create(name, jar, save, options);

      ctx.body = server.toJSONObject();
    },
  ],

  get: async function(ctx) {
    const server = ctx.server;
    ctx.body = server.toJSONObject();
  },

  update: [
    {
      body: {
        status: joi.string().valid('start', 'stop'),
        options: joi.object().keys({
          javaXmx: joi.string(),
          javaXms: joi.string(),
          properties: joi.object().properties(),
        }),
      },
    },
    async function(ctx) {
      const { status, options } = ctx.request.body;

      switch (status) {
        case 'start':
          ctx.server.start();
          break;
        case 'stop':
          ctx.server.stop();
          break;
      }

      if (options) {
        _.merge(ctx.server.option, options);
      }

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
    {
      name: 'console',

      index: async ctx => {
        ctx.body = ctx.server.monitor.lines;
      },
      create: [
        {
          body: {
            command: joi.string().required(),
          },
        },
        async ctx => {
          await ctx.server.monitor.send(ctx.request.body.command);
          ctx.body = void 0;
        },
      ],
      get: async ctx => {
        ctx.type = 'text/event-stream';
        ctx.body = events(60 * 1000, ctx.server.monitor.console.eventStream);
      },
    },

    {
      name: 'error',

      index: async ctx => {
        ctx.body = ctx.server.monitor.errors;
      },
    },
  ],
};
