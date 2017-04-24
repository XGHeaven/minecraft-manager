import Router from 'koa-router';
import rest from '../lib/rest';

const debug = require('debug')('MM:api:route');

export default function() {
  const router = new Router();
  const api = new Router();

  api.use(rest(require('./server')).routes());
  api.use(rest(require('./jar')).routes());
  api.use(rest(require('./save')).routes());
  api.use(rest(require('./version')).routes());
  api.get('/event', require('./sse').default);

  router.use('/api', api.routes());

  return router.routes();
}
