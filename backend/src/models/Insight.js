import mongoose from 'mongoose';

/**
 * Insight model — one document per record in the source jsondata.json.
 *
 * SOURCE FIELDS (17): end_year, intensity, sector, topic, insight, url, region,
 * start_year, impact, added, published, country, relevance, pestle, source, title,
 * likelihood.
 *
 * NORMALIZATION RULES (applied by `normalizeRecord` below before insert):
 *  - Numeric-looking fields (end_year, start_year, intensity, likelihood, relevance)
 *    arrive as either an integer or an empty string "". Empty strings are coerced to
 *    `null` (never stored as "") and valid values are stored as integers.
 *  - `added` and `published` are date strings in the format "Month, DD YYYY HH:MM:SS"
 *    (e.g. "January, 20 2017 03:51:25"). They are parsed into real Date objects, or
 *    `null` when the source string is empty.
 *  - sector, topic, region, country, pestle, source, insight, url, title, impact are
 *    kept as trimmed strings (empty string allowed). `impact` is occasionally numeric
 *    in the source (e.g. 3) but is stored as a string per the schema design.
 *  - `city`: the source data has NO city field. We add a nullable `city` column for
 *    forward compatibility, but it is `null` for every current record. Do not invent
 *    city values — see the seeding script's header note.
 */

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/**
 * Coerce a source value to an integer, or null when blank/invalid.
 * Empty strings and null/undefined become null (never stored as "").
 * @param {unknown} value
 * @returns {number|null}
 */
export function toIntOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/**
 * Trim a value to a string. Numbers (e.g. numeric `impact`) become their string form.
 * @param {unknown} value
 * @returns {string}
 */
export function toTrimmedString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Parse a source date string "Month, DD YYYY HH:MM:SS" into a Date, or null if empty.
 * Returns null (not an Invalid Date) when the string is blank or unparseable, so the
 * DB never stores an invalid timestamp.
 * @param {unknown} value
 * @returns {Date|null}
 */
export function parseSourceDate(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (s === '') return null;

  // e.g. "January, 20 2017 03:51:25"
  const match = s.match(/^([A-Za-z]+),\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) {
    // Fall back to Date parsing for any unexpected but still-valid format.
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const [, monthName, day, year, hour, minute, second] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (month === undefined) return null;

  // Use UTC so the stored instant is stable regardless of server timezone.
  const d = new Date(
    Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute), Number(second)),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Convert a raw source record into a normalized plain object matching the schema.
 * @param {Record<string, unknown>} raw - One object from jsondata.json.
 * @returns {Record<string, unknown>} Normalized document ready for insertion.
 */
export function normalizeRecord(raw = {}) {
  return {
    end_year: toIntOrNull(raw.end_year),
    start_year: toIntOrNull(raw.start_year),
    intensity: toIntOrNull(raw.intensity),
    likelihood: toIntOrNull(raw.likelihood),
    relevance: toIntOrNull(raw.relevance),

    sector: toTrimmedString(raw.sector),
    topic: toTrimmedString(raw.topic),
    insight: toTrimmedString(raw.insight),
    url: toTrimmedString(raw.url),
    region: toTrimmedString(raw.region),
    impact: toTrimmedString(raw.impact),
    country: toTrimmedString(raw.country),
    pestle: toTrimmedString(raw.pestle),
    source: toTrimmedString(raw.source),
    title: toTrimmedString(raw.title),

    added: parseSourceDate(raw.added),
    published: parseSourceDate(raw.published),

    // No city in source data — always null for current records (forward-compat column).
    city: null,
  };
}

const insightSchema = new mongoose.Schema(
  {
    // Integer-or-null numeric metrics.
    intensity: { type: Number, default: null },
    likelihood: { type: Number, default: null },
    relevance: { type: Number, default: null },
    end_year: { type: Number, default: null },
    start_year: { type: Number, default: null },

    // Trimmed string dimensions (empty string allowed).
    sector: { type: String, default: '', trim: true },
    topic: { type: String, default: '', trim: true },
    insight: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
    region: { type: String, default: '', trim: true },
    impact: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    pestle: { type: String, default: '', trim: true },
    source: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },

    // Parsed timestamps (null when source blank).
    added: { type: Date, default: null },
    published: { type: Date, default: null },

    // Forward-compatibility only: the source dataset has no city data, so this is
    // null for every current record. Documented here and in seedData.js.
    city: { type: String, default: null },
  },
  {
    collection: 'insights',
    timestamps: false,
    versionKey: false,
  },
);

// ---------------------------------------------------------------------------
// Indexes tuned for the dashboard's filter + sort query patterns (Prompt 3).
// Single-field indexes back the equality/`$in` filters and the range metrics.
// Compound indexes back the most common "filter by dimension, group/sort by year
// or metric" aggregation stages.
// ---------------------------------------------------------------------------
insightSchema.index({ end_year: 1 });
insightSchema.index({ start_year: 1 });
insightSchema.index({ topic: 1 });
insightSchema.index({ sector: 1 });
insightSchema.index({ region: 1 });
insightSchema.index({ pestle: 1 });
insightSchema.index({ source: 1 });
insightSchema.index({ country: 1 });
insightSchema.index({ city: 1 });
insightSchema.index({ intensity: 1 });
insightSchema.index({ likelihood: 1 });
insightSchema.index({ relevance: 1 });

// Compound indexes for frequent filter+group combinations.
insightSchema.index({ sector: 1, intensity: 1 }); // avg intensity by sector
insightSchema.index({ region: 1, intensity: 1 }); // region breakdowns
insightSchema.index({ topic: 1, relevance: 1 }); // topic bubble (count + avg relevance)
insightSchema.index({ end_year: 1, intensity: 1, likelihood: 1 }); // year trend metrics
insightSchema.index({ country: 1, intensity: 1 }); // country choropleth/bar

const Insight = mongoose.model('Insight', insightSchema);

export default Insight;
