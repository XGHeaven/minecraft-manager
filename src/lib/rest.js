import Router from 'koa-router'
import joi from './joi'
import boom from 'boom'
import assert from 'assert'

const joiOption = {
  allowUnknown: true,
}

export default function rest(resource) {
  resource = resource.default || resource

  typeof resource === 'function' && (resource = resource())

  const router = new Router()
  const name = resource.name
  const _name = `/:${name}`

  router.prefix('/' + name)
  resource.param &&
    Object.keys(resource.param).forEach(param => {
      router.param(param, resource.param[param])
    })
  resource.checker && router.use(_name, ...makeRouter(name, resource.checker))
  resource.create && router.post(`/`, ...makeRouter(name, resource.create))
  resource.update && router.put(_name, ...makeRouter(name, resource.update))
  resource.delete && router.del(_name, ...makeRouter(name, resource.delete))
  resource.index && router.get(`/`, ...makeRouter(name, resource.index))
  resource.get && router.get(_name, ...makeRouter(name, resource.get))

  if (resource.children) {
    for (let childRouteBuilder of resource.children) {
      router.use(_name, rest(childRouteBuilder).routes())
    }
  }

  return router
}

function makeRouter(name, handle) {
  if (!handle) {
    return []
  }

  // just a async function
  if (typeof handle === 'function') {
    return [handle]
  }

  assert.ok(typeof handle.handle === 'function')

  // with validator
  let validator = handle
  handle = handle.handle
  return [
    async (ctx, next) => {
      try {
        validate(ctx.request.body, validator.body)
        validate(ctx.headers, validator.header)
        validate(ctx.query, validator.query)
        validate(
          ctx.param,
          validator.resourceId
            ? {
                [name]: validator.resourceId.required(),
              }
            : null,
        )
      } catch (e) {
        // remove joi error color
        throw boom.wrap(e, 422)
      }
      await next()
    },
    handle,
  ]
}

function validate(value, schema) {
  if (!schema) return
  const { error, ret } = joi.validate(value, schema, joiOption)
  if (error) throw error
}
