/**
 * Wrap an async route handler so any rejected promise is forwarded to Express's
 * error-handling middleware. Express 4 does not catch async errors automatically; even
 * on Express 5 this makes the intent explicit and keeps behavior identical across
 * versions.
 *
 * @param {import('express').RequestHandler} fn
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export default asyncHandler;
