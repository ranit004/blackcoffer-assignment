import pino from 'pino';

/**
 * Application logger (pino). Full details are logged server-side only; client responses
 * never include stack traces or internal details (see errorHandler middleware).
 *
 * Level is quiet during tests to keep test output readable.
 */
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  redact: {
    // Never log secrets even if accidentally attached to a log object.
    paths: ['MONGODB_URI', 'req.headers.authorization', '*.password', '*.token'],
    remove: true,
  },
});

export default logger;
