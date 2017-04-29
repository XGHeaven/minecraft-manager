import osUsage from '../lib/os-usage';

export default function() {
  return {
    name: 'system',
    index: async ctx => {
      ctx.body = osUsage();
    },
  };
}
