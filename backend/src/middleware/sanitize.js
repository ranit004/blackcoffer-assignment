/**
 * NoSQL-injection sanitization middleware.
 *
 * Express parses query strings like `?topic[$ne]=` into nested objects
 * (`{ topic: { $ne: '' } }`). If such an object reached a MongoDB query unfiltered, the
 * `$ne` would be interpreted as a Mongo operator — a well-known NoSQL injection vector.
 *
 * This middleware recursively strips any key that starts with `$` or contains `.` from
 * the request query, body, and params BEFORE handlers run. We mutate the objects in
 * place (rather than reassigning `req.query`, which is read-only in Express 5).
 *
 * This is defense-in-depth: the Zod query validation also rejects non-string filter
 * shapes, so an operator-injection payload is both sanitized here AND rejected there.
 */

/**
 * Recursively delete dangerous keys ($-prefixed or dot-containing) from an object/array.
 * @param {unknown} value
 * @returns {boolean} true if any key was stripped.
 */
function stripDangerousKeys(value) {
  let stripped = false;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (stripDangerousKeys(item)) stripped = true;
    }
    return stripped;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
        stripped = true;
        continue;
      }
      if (stripDangerousKeys(value[key])) stripped = true;
    }
  }
  return stripped;
}

/**
 * Express middleware applying the sanitizer to query, body, and params.
 * @type {import('express').RequestHandler}
 */
export function sanitizeRequest(req, _res, next) {
  // req.query is a getter in Express 5; mutate the returned object in place.
  if (req.query) stripDangerousKeys(req.query);
  if (req.body) stripDangerousKeys(req.body);
  if (req.params) stripDangerousKeys(req.params);
  next();
}

export default sanitizeRequest;
