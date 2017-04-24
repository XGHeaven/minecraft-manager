import { stream } from '../lib/event';

export default async ctx => {
  ctx.type = 'text/event-stream';
  ctx.body = stream();
};
