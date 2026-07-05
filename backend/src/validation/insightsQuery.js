import { z } from 'zod';

/**
 * Validation schemas for the insights endpoints (Zod).
 *
 * Every filter/query param is validated here before it reaches the DB. Anything that
 * isn't the right type/shape produces a ZodError, which the error handler turns into a
 * 422 (never a 500, never an unvalidated raw string hitting Mongo).
 */

export const MAX_PAGE_SIZE = 200;
export const DEFAULT_PAGE_SIZE = 50;

// Max length for any single string filter value — prevents abuse via oversized inputs.
const MAX_FILTER_LEN = 100;

/**
 * A repeatable string filter: `?topic=a&topic=b` arrives as ['a','b']; `?topic=a` as
 * 'a'. Normalize both to a string[] and enforce a max length per value. Reject
 * non-string shapes (e.g. `?topic[$ne]=` -> object) so injection payloads never pass.
 */
const repeatableString = z
  .union([
    z.string().max(MAX_FILTER_LEN, `Filter value must be at most ${MAX_FILTER_LEN} characters`),
    z.array(
      z.string().max(MAX_FILTER_LEN, `Filter value must be at most ${MAX_FILTER_LEN} characters`),
    ),
  ])
  .transform((v) => (Array.isArray(v) ? v : [v]))
  .optional();

// Integer coerced from a query string; rejects non-numeric values like "abc".
const intParam = z.coerce.number({ message: 'Must be an integer' }).int('Must be an integer');

/**
 * Shared filter schema used by /insights, /insights/stats (and reused by /filters no-op).
 */
export const filterSchema = z.object({
  end_year: intParam.optional(),
  topic: repeatableString,
  sector: repeatableString,
  region: repeatableString,
  pestle: repeatableString, // the assignment's "PEST" filter (PESTLE category)
  source: repeatableString,
  country: repeatableString,
  city: repeatableString, // always empty result currently (no city data) — documented
  intensity_min: intParam.optional(),
  intensity_max: intParam.optional(),
  likelihood_min: intParam.optional(),
  likelihood_max: intParam.optional(),
  relevance_min: intParam.optional(),
  relevance_max: intParam.optional(),
});

/**
 * Pagination schema. page_size is clamped to MAX_PAGE_SIZE (not rejected) so an
 * oversized page_size is honored as the max rather than as-is.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE_SIZE)
    .transform((n) => Math.min(n, MAX_PAGE_SIZE)),
});

/**
 * Full query schema for GET /api/insights = filters + pagination.
 * `.strip()` drops unknown keys rather than failing, keeping the API forgiving to extra
 * params while still validating every known one.
 */
export const insightsListSchema = filterSchema.merge(paginationSchema);

/**
 * Parse only the filter portion out of a raw query object.
 * @param {Record<string, unknown>} query
 * @returns {import('zod').infer<typeof filterSchema>}
 */
export function parseFilters(query) {
  return filterSchema.parse(query);
}
