import baseJoi from 'joi';

const extensions = [];
const versionReg = /^\d+\.\d+(\.\d+)?$|^\d+w\d+[a-z]$/;

const propertiesSchema = baseJoi.object().keys({
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
});

extensions.push(
  {
    base: baseJoi.string(),
    name: 'string',
    language: {
      version: 'format error',
    },
    rules: [
      {
        name: 'version',
        validate(params, value, state, options) {
          if (!versionReg.test(value)) {
            return this.createError('string.version', { v: value }, state, options);
          }

          return value;
        },
      },
    ],
  },
  {
    base: baseJoi.object(),
    name: 'object',
    language: {
      properties: 'with wrong value',
    },
    rules: [
      {
        name: 'properties',
        validate(params, value, state, options) {
          const ret = propertiesSchema.validate(value);
          console.log(ret);
          if (ret.error) return this.createError('object.properties', null, state, options);
          return ret.value;
        },
      },
    ],
  },
);

export default baseJoi.extend(extensions);
