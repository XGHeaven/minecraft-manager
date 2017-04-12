import Router from 'koa-router';
import joi from 'joi';
import boom from 'boom';

export default function rest(RouteBuilder) {
  RouteBuilder = RouteBuilder.default || RouteBuilder;

  const router = new Router();
  const resource = new RouteBuilder();
  const name = resource.name;
  const _name = `/:${name}`;

  router.prefix('/' + name);
  resource.param &&
    Object.keys(resource.param).forEach(param => {
      router.param(param, resource.param[param]);
    });
  resource.checker && router.use(_name, ...makeRouter(name, resource.checker));
  resource.create && router.post(`/`, ...makeRouter(name, resource.create));
  resource.update && router.put(_name, ...makeRouter(name, resource.update));
  resource.delete && router.del(_name, ...makeRouter(name, resource.delete));
  resource.index && router.get(`/`, ...makeRouter(name, resource.index));
  resource.get && router.get(_name, ...makeRouter(name, resource.get));

  if (resource.children) {
    for (let childRouteBuilder of resource.children) {
      router.use(_name, rest(childRouteBuilder).routes());
    }
  }

  return router;
}

function makeRouter(name, handle) {
  if (!handle) {
    return [];
  }

  // just a async function
  if (typeof handle === 'function') {
    return [handle];
  }

  // with validator
  if (typeof handle[0] === 'object') {
    let validator = handle.shift();
    return [
      async (ctx, next) => {
        try {
          validator.body && joi.attempt(ctx.request.body, validator.body);
          validator.header && joi.attempt(ctx.headers, validator.header);
          validator.query && joi.attempt(ctx.query, validator.query);
          validator.resourceId &&
            joi.attempt(ctx.param, {
              [name]: validator.resourceId.required(),
            });
        } catch (e) {
          // remove joi error color
          e.message = e.annotate(true);
          throw boom.wrap(e, 422);
        }
        await next();
      },
      ...handle,
    ];
  }

  return handle;
}
