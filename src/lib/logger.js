import bunyan from 'bunyan';
import bunyanFormat from 'bunyan-format';

const streams = [];

if (process.env.NODE_ENV !== 'test') {
  streams.push({
    level: 'info',
    stream: bunyanFormat({
      outputMode: 'short',
    }),
  });
}

export const logger = bunyan.createLogger({
  name: 'MM',
  streams,
});

export const jarLogger = logger.child({ module: 'jar' });
export const serverLogger = logger.child({ module: 'server' });
export const saveLogger = logger.child({ module: 'save' });
export const apiLogger = logger.child({ module: 'api' });
export const monitorLogger = logger.child({ module: 'server/monitor' });
