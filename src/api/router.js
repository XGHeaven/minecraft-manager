import Router from 'koa-router'
import rest from '../lib/rest'
import _ from 'lodash'

const debug = require('debug')('MM:api:route')

export default function(mm) {
  const router = new Router()
  const api = new Router()

  mm.auth &&
    _.isPlainObject(mm.auth) &&
    api.use(async (ctx, next) => {
      const authStr =
        ctx.header['authorization'] || (ctx.query['authorization'] && `Basic ${ctx.query['authorization']}`) || ''
      if (authStr) {
        const auth = authStr.split(' ')
        if (auth[0] === 'Basic') {
          const user = new Buffer(auth[1], 'base64').toString().split(':')
          if (user[0] === mm.auth.name && user[1] === mm.auth.pwd) {
            return await next()
          }
        }
      }
      ctx.status = 401
      ctx.set('WWW-Authenticate', 'Basic realm="Please Authorization"')
    })

  api.get('/', async ctx => (ctx.body = void 0))

  api.use(rest(require('./server')).routes())
  api.use(rest(require('./jar')).routes())
  api.use(rest(require('./save')).routes())
  api.use(rest(require('./version')).routes())
  api.use(rest(require('./system')).routes())
  api.get('/event', require('./sse').default)

  router.use('/api', api.routes())

  return router.routes()
}
