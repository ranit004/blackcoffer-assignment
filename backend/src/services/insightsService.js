import Insight from '../models/Insight.js';

/**
 * insightsService — the ONLY place that talks to the Insight collection. Route handlers
 * call these functions; they never build queries inline. All heavy aggregation happens
 * in MongoDB (not in application code) and is backed by the indexes created in the seed.
 */

// Repeatable string dimensions -> matched with $in.
const IN_FIELDS = ['topic', 'sector', 'region', 'pestle', 'source', 'country', 'city'];

// Metric range filters -> matched with $gte/$lte.
const RANGE_FIELDS = [
  ['intensity', 'intensity_min', 'intensity_max'],
  ['likelihood', 'likelihood_min', 'likelihood_max'],
  ['relevance', 'relevance_min', 'relevance_max'],
];

/**
 * Build a MongoDB match filter from validated filter params. All conditions are ANDed.
 * @param {Record<string, unknown>} filters - Output of parseFilters (already validated).
 * @returns {Record<string, unknown>} A Mongo query object.
 */
export function buildMatch(filters = {}) {
  const match = {};

  if (filters.end_year !== undefined) {
    match.end_year = filters.end_year;
  }

  for (const field of IN_FIELDS) {
    const values = filters[field];
    if (Array.isArray(values) && values.length > 0) {
      match[field] = { $in: values }; // OR within a field
    }
  }

  for (const [field, minKey, maxKey] of RANGE_FIELDS) {
    const range = {};
    if (filters[minKey] !== undefined) range.$gte = filters[minKey];
    if (filters[maxKey] !== undefined) range.$lte = filters[maxKey];
    if (Object.keys(range).length > 0) match[field] = range;
  }

  return match;
}

/**
 * Paginated list of insight documents matching the filters.
 * Returns an empty list + total:0 (never an error) when nothing matches.
 *
 * @param {object} params
 * @param {Record<string, unknown>} params.filters
 * @param {number} params.page - 1-based page number.
 * @param {number} params.pageSize - documents per page (already clamped to max).
 * @returns {Promise<{data: object[], total: number, page: number, page_size: number, total_pages: number}>}
 */
export async function listInsights({ filters, page, pageSize }) {
  const match = buildMatch(filters);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    Insight.find(match)
      .sort({ published: -1, _id: 1 }) // stable, newest-first ordering
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Insight.countDocuments(match),
  ]);

  return {
    data,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize) || 0,
  };
}

/**
 * Distinct available values for each filterable dimension, so the frontend can build
 * dropdowns from real data instead of hardcoding options. Empty strings/nulls removed.
 * @returns {Promise<Record<string, Array<string|number>>>}
 */
export async function getFilterOptions() {
  const [topic, sector, region, pestle, source, country, city, endYears, ranges] =
    await Promise.all([
      Insight.distinct('topic'),
      Insight.distinct('sector'),
      Insight.distinct('region'),
      Insight.distinct('pestle'),
      Insight.distinct('source'),
      Insight.distinct('country'),
      Insight.distinct('city'),
      Insight.distinct('end_year'),
      // Data-driven min/max for the range-slider metrics.
      Insight.aggregate([
        {
          $group: {
            _id: null,
            intensityMin: { $min: '$intensity' },
            intensityMax: { $max: '$intensity' },
            likelihoodMin: { $min: '$likelihood' },
            likelihoodMax: { $max: '$likelihood' },
            relevanceMin: { $min: '$relevance' },
            relevanceMax: { $max: '$relevance' },
          },
        },
      ]),
    ]);

  const cleanStrings = (arr) => arr.filter((v) => typeof v === 'string' && v.trim() !== '').sort();
  const cleanNumbers = (arr) =>
    arr.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);

  const r = ranges[0] || {};
  const metricRanges = {
    intensity: { min: r.intensityMin ?? 0, max: r.intensityMax ?? 0 },
    likelihood: { min: r.likelihoodMin ?? 0, max: r.likelihoodMax ?? 0 },
    relevance: { min: r.relevanceMin ?? 0, max: r.relevanceMax ?? 0 },
  };

  return {
    topic: cleanStrings(topic),
    sector: cleanStrings(sector),
    region: cleanStrings(region),
    pestle: cleanStrings(pestle),
    source: cleanStrings(source),
    country: cleanStrings(country),
    // Empty by design — the source dataset has no city values.
    city: cleanStrings(city),
    end_year: cleanNumbers(endYears),
    ranges: metricRanges,
  };
}

const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);

/**
 * Pre-aggregated data for the dashboard charts, computed entirely in MongoDB via a
 * single $facet pipeline (one collection pass). Respects the same filters as /insights.
 *
 * Returns:
 *  - byYear:    avg intensity/likelihood/relevance + count grouped by end_year
 *  - byRegion:  insight count grouped by region (desc)
 *  - byTopic:   count + avg relevance grouped by topic (top 15)
 *  - byCountry: count + avg intensity grouped by country (top 15)
 *  - bySector:  avg intensity/likelihood + count grouped by sector
 *
 * @param {Record<string, unknown>} filters
 * @returns {Promise<object>}
 */
export async function getStats(filters = {}) {
  const match = buildMatch(filters);

  const pipeline = [
    { $match: match },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              avgIntensity: { $avg: '$intensity' },
              avgLikelihood: { $avg: '$likelihood' },
              avgRelevance: { $avg: '$relevance' },
            },
          },
        ],
        byYear: [
          { $match: { end_year: { $ne: null } } },
          {
            $group: {
              _id: '$end_year',
              avgIntensity: { $avg: '$intensity' },
              avgLikelihood: { $avg: '$likelihood' },
              avgRelevance: { $avg: '$relevance' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        byRegion: [
          { $match: { region: { $ne: '' } } },
          { $group: { _id: '$region', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byTopic: [
          { $match: { topic: { $ne: '' } } },
          {
            $group: {
              _id: '$topic',
              count: { $sum: 1 },
              avgRelevance: { $avg: '$relevance' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ],
        byCountry: [
          { $match: { country: { $ne: '' } } },
          {
            $group: {
              _id: '$country',
              count: { $sum: 1 },
              avgIntensity: { $avg: '$intensity' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ],
        bySector: [
          { $match: { sector: { $ne: '' } } },
          {
            $group: {
              _id: '$sector',
              avgIntensity: { $avg: '$intensity' },
              avgLikelihood: { $avg: '$likelihood' },
              count: { $sum: 1 },
            },
          },
          { $sort: { avgIntensity: -1 } },
        ],
      },
    },
  ];

  const [result = {}] = await Insight.aggregate(pipeline);

  const overallRaw = (result.overall && result.overall[0]) || {};
  const overall = {
    count: overallRaw.count || 0,
    avgIntensity: round1(overallRaw.avgIntensity),
    avgLikelihood: round1(overallRaw.avgLikelihood),
    avgRelevance: round1(overallRaw.avgRelevance),
  };

  return {
    overall,
    byYear: (result.byYear || []).map((r) => ({
      year: r._id,
      avgIntensity: round1(r.avgIntensity),
      avgLikelihood: round1(r.avgLikelihood),
      avgRelevance: round1(r.avgRelevance),
      count: r.count,
    })),
    byRegion: (result.byRegion || []).map((r) => ({ region: r._id, count: r.count })),
    byTopic: (result.byTopic || []).map((r) => ({
      topic: r._id,
      count: r.count,
      avgRelevance: round1(r.avgRelevance),
    })),
    byCountry: (result.byCountry || []).map((r) => ({
      country: r._id,
      count: r.count,
      avgIntensity: round1(r.avgIntensity),
    })),
    bySector: (result.bySector || []).map((r) => ({
      sector: r._id,
      avgIntensity: round1(r.avgIntensity),
      avgLikelihood: round1(r.avgLikelihood),
      count: r.count,
    })),
  };
}
