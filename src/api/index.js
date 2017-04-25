import Koa from 'koa';
import BodyParser from 'koa-bodyparser';
import RouterBuilder from './router';
import * as boom from 'boom';
import { apiLogger as logger } from '../lib/logger';
import cors from 'kcors';

export default function(mm) {
  const app = new Koa();

  app.context.context = mm;

  app.use(async (ctx, next) => {
    const start = process.hrtime();
    await next();
    const end = process.hrtime();
    const ms = ((end[0] - start[0]) * 1000 + (end[1] - start[1]) / 1000 / 1000).toFixed(3);
    ctx.set('X-Response-Time', `${ms}ms`);
    logger.info(`${ctx.method} ${ctx.url} ${ctx.status} ${ms}ms`);
  });

  app.use(cors());

  app.use(BodyParser());

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (!err.isBoom) err = boom.wrap(err);
      ctx.status = err.output.statusCode;
      ctx.body = err.output.payload;
      logger.error(err);
    }
  });

  app.use(RouterBuilder(mm));

  return app;
}
