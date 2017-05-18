import osUsage from '../lib/os-usage';

export default {
  name: 'system',
  index: async ctx => {
    ctx.body = osUsage();
  },
};
