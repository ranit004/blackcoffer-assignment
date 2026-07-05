import { ZodError } from 'zod';

import { logger } from '../utils/logger.js';

/**
 * A small typed application error so handlers/services can signal HTTP status codes.
 */
export class ApiError extends Error {
  /**
   * @param {number} status - HTTP status code.
   * @param {string} message - Client-safe message.
   * @param {unknown} [details] - Optional client-safe details.
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * 404 handler for unmatched routes. Placed after all routes.
 * @type {import('express').RequestHandler}
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Not found', status: 404 } });
}

/**
 * Central error-handling middleware. Returns a consistent JSON error shape and NEVER
 * leaks stack traces, file paths, or internal exception details to the client outside
 * development. Full details are logged server-side only.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature.
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Zod validation failures -> 422 with field-level (client-safe) issues.
  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, 'Validation failed');
    return res.status(422).json({
      error: {
        message: 'Invalid request parameters',
        status: 422,
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  const status = err instanceof ApiError ? err.status : 500;

  // Log the full error server-side (stack included) regardless of environment.
  if (status >= 500) {
    logger.error({ err }, 'Unhandled server error');
  } else {
    logger.warn({ err: { message: err.message, status } }, 'Request error');
  }

  // Client-safe body: generic message for 5xx; the ApiError message for 4xx.
  const body = {
    error: {
      status,
      message: status >= 500 ? 'Internal server error' : err.message || 'Request error',
    },
  };

  // Only expose internal detail (stack) in development, never in production.
  if (isDev && status >= 500) {
    body.error.detail = err.message;
    body.error.stack = err.stack;
  }
  if (err instanceof ApiError && err.details !== undefined) {
    body.error.details = err.details;
  }

  res.status(status).json(body);
}
