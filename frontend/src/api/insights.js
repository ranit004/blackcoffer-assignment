import { getJson } from './client.js';

/**
 * Filter fields that are multi-value (repeatable query params).
 */
export const MULTI_FIELDS = ['topic', 'sector', 'region', 'pestle', 'source', 'country', 'city'];

/**
 * Range fields -> the two query params they map to.
 */
export const RANGE_FIELDS = {
  intensity: ['intensity_min', 'intensity_max'],
  likelihood: ['likelihood_min', 'likelihood_max'],
  relevance: ['relevance_min', 'relevance_max'],
};

/**
 * Build a query string from a filters object. Arrays become repeated params
 * (?topic=a&topic=b); ranges and end_year become single params. Empty values omitted.
 *
 * @param {object} filters
 * @param {object} [extra] - extra params (e.g. page, page_size).
 * @returns {string} A query string beginning with "?" (or "" if empty).
 */
export function buildQuery(filters = {}, extra = {}) {
  const params = new URLSearchParams();

  for (const field of MULTI_FIELDS) {
    const values = filters[field];
    if (Array.isArray(values)) {
      values.filter(Boolean).forEach((v) => params.append(field, v));
    }
  }

  if (filters.end_year !== undefined && filters.end_year !== null && filters.end_year !== '') {
    params.set('end_year', String(filters.end_year));
  }

  for (const [, [minKey, maxKey]] of Object.entries(RANGE_FIELDS)) {
    if (filters[minKey] !== undefined && filters[minKey] !== null && filters[minKey] !== '') {
      params.set(minKey, String(filters[minKey]));
    }
    if (filters[maxKey] !== undefined && filters[maxKey] !== null && filters[maxKey] !== '') {
      params.set(maxKey, String(filters[maxKey]));
    }
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** GET /api/insights (paginated list). */
export function fetchInsights(filters, { page = 1, pageSize = 50 } = {}) {
  return getJson(`/api/insights${buildQuery(filters, { page, page_size: pageSize })}`);
}

/** GET /api/insights/filters (distinct filter options). */
export function fetchFilterOptions() {
  return getJson('/api/insights/filters');
}

/** GET /api/insights/stats (pre-aggregated chart data, respecting filters). */
export function fetchStats(filters) {
  return getJson(`/api/insights/stats${buildQuery(filters)}`);
}
