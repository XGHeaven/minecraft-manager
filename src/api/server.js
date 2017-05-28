import boom from 'boom';
import joi from '../lib/joi';
import _ from 'lodash';
import { events } from '../lib/event';
import { ServerNotStartError } from '../lib/errors';

export default {
  name: 'server',

  schema: {
    name: joi.string().token(),
    version: joi.string().version(),
    saveName: joi.string().token(),
    options: joi.object().keys({
      javaXms: joi.string(),
      javaXmx: joi.string(),
      properties: joi.object().properties(),
    }),
  },

  checker: {
    resourceId: joi.string().token().required(),
    handle: async function(ctx, next) {
      const name = ctx.params.server;
      const server = ctx.context.serverManager.get(name);
      if (server === null) {
        throw boom.notFound(`server ${name} not create`);
      }
      ctx.server = server;
      await next();
    },
  },

  index: async function(ctx) {
    const servers = [];

    ctx.context.serverManager.forEach(server => {
      servers.push(server.toJSONObject());
    });

    ctx.body = servers;
  },

  create: {
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
    handle: async function(ctx) {
      const { name, version, save: saveName, options } = ctx.request.body;
      const jar = ctx.context.jarManager.get(version);
      const save = ctx.context.saveManager.get(saveName);

      if (!jar || !save) {
        throw boom.badData('not created jar or save');
      }

      const server = ctx.context.serverManager.create(name, jar, save, options);

      ctx.body = server.toJSONObject();
    },
  },

  get: async function(ctx) {
    const server = ctx.server;
    ctx.body = server.toJSONObject();
  },

  update: {
    body: {
      status: joi.string().valid('start', 'stop'),
      options: joi.object().keys({
        javaXmx: joi.string(),
        javaXms: joi.string(),
        properties: joi.object().properties(),
      }),
    },
    handle: async function(ctx) {
      const { status, options } = ctx.request.body;

      if (options) {
        _.merge(ctx.server.option, options);
      }

      switch (status) {
        case 'start':
          ctx.server.startDeattach();
          break;
        case 'stop':
          ctx.server.stop();
          break;
      }

      ctx.body = ctx.server.toJSONObject();
    },
  },

  delete: async ctx => {
    if (!ctx.server.remove()) {
      throw boom.preconditionRequired('remove server when server stopped');
    }

    ctx.body = void 0;
  },

  children: [
    {
      name: 'console',

      schema: {
        log: joi.string().description('the whole log'),
        time: joi.string().regex(/^\d\d:\d\d:\d\d$/).description('log generator time'),
        type: joi.string().description('log type, only from server'),
        from: joi.string().valid('client', 'server').description('where log generator from'),
        message: joi.string().description('log message, only from server'),
        name: joi.string().description('log generator thread, only from server'),
      },

      index: {
        query: {
          format: joi.string().valid('event'),
        },
        handle: async ctx => {
          if (ctx.query.format === 'event') {
            ctx.type = 'text/event-stream';
            ctx.body = events(60 * 1000, ctx.server.monitor.console.eventStream);
          } else
            ctx.body = ctx.server.monitor.lines;
        },
      },
      create: {
        body: {
          command: joi.string().required(),
        },
        throw: [ServerNotStartError],
        handle: async ctx => {
          if (ctx.server.status !== 'started') throw new ServerNotStartError();
          ctx.body = await ctx.server.monitor.send(ctx.request.body.command);
        },
      },
    },

    {
      name: 'error',

      index: async ctx => {
        ctx.body = ctx.server.monitor.errors;
      },
    },

    {
      name: 'player',
      index: {
        summary: 'read player data from nbt, not realtime',
        description: 'read player data from playerdata.dat and ops.json, you cannot modify some value',
        handle: async ctx => {
          ctx.body = await ctx.server.player.find();
        },
      },
    },
  ],
};
