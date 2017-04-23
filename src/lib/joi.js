import baseJoi from 'joi';

const extensions = [];
const versionReg = /^\d+\.\d+(\.\d+)?$|^\d+w\d+[a-z]$/;

extensions.push({
  base: baseJoi.string(),
  name: 'string',
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
});

export default baseJoi.extend(extensions);
