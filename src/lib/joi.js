import baseJoi from 'joi'

const extensions = []
const versionReg = /^\d+\.\d+(\.\d+)?(-pre\d*)?$|^\d+w\d+[a-z]$/

const propertiesSchema = {
  gamemode: baseJoi.number().valid(0, 1, 2, 3),
  difficulty: baseJoi.number().valid(0, 1, 2, 3),
  pvp: baseJoi.boolean(),
  'enable-command-block': baseJoi.boolean(),
  'max-players': baseJoi.number().min(1),
  'server-port': baseJoi.number().min(1).max(65536),
  'view-distance': baseJoi.number().min(3).max(32),
  'white-list': baseJoi.boolean(),
  'online-mode': baseJoi.boolean(),
  'level-seed': baseJoi.number(),
  motd: baseJoi.string(),
}

extensions.push({
  base: baseJoi.string(),
  name: 'string',
  language: {
    version: 'format error',
  },
  rules: [
    {
      name: 'version',
      setup(param) {
        this._description = 'jar file version'
        this._examples.push('1.11.2', '17w05a', '1.12-pre5')
      },
      validate(params, value, state, options) {
        if (!versionReg.test(value)) {
          return this.createError('string.version', { v: value }, state, options)
        }

        return value
      },
    },
  ],
})

const newJoi = baseJoi.extend(extensions)
export default newJoi

newJoi.object().constructor.prototype['properties'] = function() {
  if (this._flags.mcProperties) return this.clone()
  const obj = this.keys(propertiesSchema)
  obj._flags.mcProperties = true
  return obj
}
