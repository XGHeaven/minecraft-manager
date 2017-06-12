import joi2schema from 'joi-to-json-schema'
import joi from '../src/lib/joi'
import fs from 'fs'

const operatorMap = {
  index: 'get',
  create: 'post',
  get: 'get',
  delete: 'delete',
  update: 'put',
}

const swagger = {
  swagger: '2.0',
  info: {
    title: 'Minecraft Manager RESTful API',
    description: 'The RESTful API for Minecraft Manager',
    version: '1.0',
  },
  host: 'minecraft-manager.xgheaven.com',
  basePath: '/api',
  schemes: ['http'],
  produces: ['application/json'],
  consumes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  securityDefinitions: {
    basicAuth: {
      type: 'basic',
    },
  },
  security: [
    {
      basicAuth: [],
    },
  ],
  definitions: {},
}

swagger.paths = Object.assign(
  parseRouter(require('../src/api/jar')),
  parseRouter(require('../src/api/save')),
  parseRouter(require('../src/api/server')),
  parseRouter(require('../src/api/system')),
  parseRouter(require('../src/api/version')),
)

function parseRouter(router, parent = { path: '', parameter: undefined }) {
  router = router.default || router
  if (typeof router === 'function') {
    router = router()
  }

  const name = router.name
  const result = {
    [`${parent.path}/${name}`]: {},
    [`${parent.path}/${name}/{${name}}`]: {},
  }
  const resSchema = router.schema && joi2schema(joi.object().keys(router.schema))

  !!resSchema && (swagger.definitions[name] = resSchema)

  const baseParameter = {
    name,
    in: 'path',
    type: 'string',
    require: true,
    description:
      (router.checker && router.checker.resourceId && router.checker.resourceId._description) || `${name} id`,
  }

  if (router.checker && router.checker.resourceId) {
    Object.assign(baseParameter, joi2schema(router.checker.resourceId.required()))
  }

  for (let type of ['index', 'create', 'get', 'update', 'delete']) {
    if (!router[type]) continue
    const route = router[type]
    const resource = emptyPath()
    result[getPath(type, name)][operatorMap[type]] = resource
    resource.summary = route.summary || `${type} resource for ${name}`
    resource.description = route.description || ''
    resource.responses['200'] = { description: 'Success' }
    resource.tags = [name]

    if (route.body) {
      const body = wrapSchema(route.body)
      resource.parameters.push({
        in: 'body',
        name: 'body',
        description: body._description || 'body parameters',
        schema: joi2schema(body),
      })
    }

    for (let para of ['query', 'header']) {
      if (!route[para]) continue
      for (let [key, value] of Object.entries(route[para])) {
        resource.parameters.push(
          Object.assign(
            {
              in: para,
              name: key,
              description: value._description || `${para} parameter`,
            },
            joi2schema(value),
          ),
        )
      }
    }

    if (['create', 'update'].includes(type)) {
      !!resSchema &&
        (resource.responses[200].schema = {
          type: 'array',
          schema: `#/definitions/${name}`,
        })
    }

    if (['get', 'update', 'delete'].includes(type)) {
      if (parent.parameter) resource.parameters.push(parent.parameter)
      resource.parameters.push(baseParameter)
    }

    if (['get', 'update', 'create'].includes(type) && resSchema) {
      resource.responses[200].schema = { $ref: `#/definitions/${name}` }
    }

    if (type === 'index' && resSchema) {
      resource.responses[200].schema = {
        type: 'array',
        items: {
          $ref: `#/definitions/${name}`,
        },
      }
    }

    if (type === 'create') {
      resource.responses[201] = {
        description: `${name} created success`,
      }

      resource.responses[200].description = `${name} have been created`
    }

    for (let Err of route.throw || []) {
      const e = new Err()
      const code = e.code
      if (!code) continue
      resource.responses[code] = {
        description: ((resource.responses[code] && ' or ' + resource.responses[code].description) || '') + e.message,
      }
    }
  }

  function getPath(type) {
    switch (type) {
      case 'index':
      case 'create':
        return `${parent.path}/${name}`
      case 'get':
      case 'update':
      case 'delete':
        return `${parent.path}/${name}/{${name}}`
    }
  }

  for (let child of router.children || []) {
    Object.assign(
      result,
      parseRouter(child, {
        path: `${parent.path}/${name}/{${name}}`,
        parameter: baseParameter,
      }),
    )
  }

  return result
}

function emptyPath() {
  return {
    parameters: [],
    responses: {},
  }
}

function wrapSchema(schema) {
  if (schema.isJoi) return schema
  if (schema.slice) return joi.array().items(schema)
  return joi.object().keys(schema)
}

console.log('generate success')
fs.writeFileSync(process.cwd() + '/docs/swagger.json', JSON.stringify(swagger))
