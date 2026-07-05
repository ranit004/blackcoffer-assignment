import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { insightsListSchema, filterSchema } from '../validation/insightsQuery.js';
import { listInsights, getFilterOptions, getStats } from '../services/insightsService.js';

const router = Router();

/**
 * @openapi
 * /api/insights:
 *   get:
 *     summary: Paginated, filterable list of insight documents.
 *     description: >
 *       Returns insight documents matching all provided filters (AND across fields,
 *       OR within a repeatable field). Repeatable filters (topic, sector, region,
 *       pestle, source, country, city) may be provided multiple times, e.g.
 *       `?topic=oil&topic=gas`. All params are validated; invalid types return 422.
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: page_size, schema: { type: integer, minimum: 1, maximum: 200, default: 50 } }
 *       - { in: query, name: end_year, schema: { type: integer } }
 *       - { in: query, name: topic, schema: { type: array, items: { type: string } } }
 *       - { in: query, name: sector, schema: { type: array, items: { type: string } } }
 *       - { in: query, name: region, schema: { type: array, items: { type: string } } }
 *       - { in: query, name: pestle, schema: { type: array, items: { type: string } }, description: "The assignment's PEST filter (PESTLE category)." }
 *       - { in: query, name: source, schema: { type: array, items: { type: string } } }
 *       - { in: query, name: country, schema: { type: array, items: { type: string } } }
 *       - { in: query, name: city, schema: { type: array, items: { type: string } }, description: "No city data in source; returns empty results." }
 *       - { in: query, name: intensity_min, schema: { type: integer } }
 *       - { in: query, name: intensity_max, schema: { type: integer } }
 *       - { in: query, name: likelihood_min, schema: { type: integer } }
 *       - { in: query, name: likelihood_max, schema: { type: integer } }
 *       - { in: query, name: relevance_min, schema: { type: integer } }
 *       - { in: query, name: relevance_max, schema: { type: integer } }
 *     responses:
 *       200: { description: A page of insights with pagination metadata. }
 *       422: { description: Invalid query parameters. }
 */
router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const parsed = insightsListSchema.parse(req.query);
    const { page, page_size: pageSize, ...filters } = parsed;
    const result = await listInsights({ filters, page, pageSize });
    res.json(result);
  }),
);

/**
 * @openapi
 * /api/insights/filters:
 *   get:
 *     summary: Distinct available filter values.
 *     description: >
 *       Distinct values for topic, sector, region, pestle, source, country, city, and
 *       end_year — so the frontend can populate filter controls dynamically from the
 *       actual data. `city` is always empty (no city data in the source dataset).
 *     responses:
 *       200: { description: Distinct values keyed by field. }
 */
router.get(
  '/insights/filters',
  asyncHandler(async (req, res) => {
    const options = await getFilterOptions();
    res.json(options);
  }),
);

/**
 * @openapi
 * /api/insights/stats:
 *   get:
 *     summary: Pre-aggregated chart data (respects the same filters as /insights).
 *     description: >
 *       MongoDB aggregation results for the dashboard charts: average
 *       intensity/likelihood/relevance by year, counts by region, top-15 topics
 *       (count + avg relevance), top-15 countries (count + avg intensity), and average
 *       intensity/likelihood by sector. Accepts the same filter params as /insights so
 *       charts stay in sync with active filters.
 *     responses:
 *       200: { description: Aggregated datasets for each chart. }
 *       422: { description: Invalid query parameters. }
 */
router.get(
  '/insights/stats',
  asyncHandler(async (req, res) => {
    const filters = filterSchema.parse(req.query);
    const stats = await getStats(filters);
    res.json(stats);
  }),
);

export default router;
