export function transparentMethod(...methods) {
  return function(target, name) {
    methods.forEach(method => {
      target[method] = function(...args) {
        return this[name][method](...args)
      }
    })
  }
}
