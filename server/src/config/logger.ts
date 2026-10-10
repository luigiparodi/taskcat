import winston from 'winston';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'error' : 'info');

/**
 * Application logger. Level comes from LOG_LEVEL, defaulting to 'error' under
 * test so suites stay quiet, 'info' elsewhere. format.errors({ stack: true })
 * makes logger.error(msg, err) carry the stack the way console.error did.
 */
export const logger = winston.createLogger({
  level,
  format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level: lvl, message, timestamp, stack, ...meta }) => {
          const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${lvl.toUpperCase()}: ${message}${stack ? ` ${stack}` : ''}${rest}`;
        })
      ),
    }),
  ],
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_LEVEL === undefined,
});
