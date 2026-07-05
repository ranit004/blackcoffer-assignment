/**
 * seedData.js — one-off, idempotent loader for the `insights` collection.
 *
 * Run standalone:   node src/scripts/seedData.js
 * Or via npm:       npm run seed
 *
 * It connects to MONGODB_URI, CLEARS the `insights` collection, reloads every record
 * from data/jsondata.json (normalized via the Insight model), (re)builds indexes, and
 * prints a completeness summary. Re-running is safe — it always starts from a clean
 * collection, so the end state is deterministic.
 *
 * ---------------------------------------------------------------------------
 * PEST vs PESTLE vs SWOT — read this before wiring up filters.
 *
 *  - The assignment asks for a "PEST filter". The source data does NOT contain a PEST
 *    field. It contains a `pestle` field whose values are Political, Economic, Social,
 *    Technological, Environmental, Industries, Organization, Lifestyles, Healthcare,
 *    etc. That is PESTLE (Political/Economic/Social/Technological/Legal/Environmental)
 *    — a SUPERSET of PEST — plus a few non-standard buckets present in the raw data.
 *    We therefore implement the assignment's "PEST filter" using this `pestle` field
 *    and label it "PESTLE Category" in the UI.
 *
 *  - The assignment also lists a "SWOT filter". There is NO SWOT field anywhere in the
 *    data (no Strengths/Weaknesses/Opportunities/Threats classification). Fabricating
 *    one would violate the "use the given data only" requirement, so SWOT is surfaced
 *    in the UI as a visibly-present-but-disabled control with an explanatory tooltip
 *    rather than being silently dropped.
 *
 *  - Likewise there is NO `city` field. A nullable `city` column exists for forward
 *    compatibility but is null for all 1000 records (see Insight.js).
 * ---------------------------------------------------------------------------
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { connectDB, disconnectDB } from '../db.js';
import Insight, { normalizeRecord } from '../models/Insight.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/scripts -> repo root data/jsondata.json
const DATA_PATH = path.resolve(__dirname, '../../../data/jsondata.json');

// Fields we report non-null / non-empty counts for, so data completeness is visible.
const NUMERIC_FIELDS = ['end_year', 'start_year', 'intensity', 'likelihood', 'relevance'];
const STRING_FIELDS = [
  'sector',
  'topic',
  'insight',
  'url',
  'region',
  'impact',
  'country',
  'pestle',
  'source',
  'title',
];
const DATE_FIELDS = ['added', 'published'];

/**
 * Load and normalize the raw dataset from disk.
 * @returns {Promise<Array<Record<string, unknown>>>} Normalized documents.
 */
async function loadRecords() {
  const rawText = await readFile(DATA_PATH, 'utf-8');
  const rawRecords = JSON.parse(rawText);
  if (!Array.isArray(rawRecords)) {
    throw new Error('jsondata.json must be a JSON array of records.');
  }
  return rawRecords.map(normalizeRecord);
}

/**
 * Compute a per-field completeness summary over the inserted documents.
 * @param {Array<Record<string, unknown>>} docs
 * @returns {Record<string, number>} Field -> count of populated (non-null/non-empty) values.
 */
function completenessSummary(docs) {
  const summary = {};
  for (const field of NUMERIC_FIELDS) {
    summary[field] = docs.filter((d) => d[field] !== null && d[field] !== undefined).length;
  }
  for (const field of STRING_FIELDS) {
    summary[field] = docs.filter((d) => typeof d[field] === 'string' && d[field] !== '').length;
  }
  for (const field of DATE_FIELDS) {
    summary[field] = docs.filter((d) => d[field] instanceof Date).length;
  }
  summary.city = docs.filter((d) => d.city !== null && d.city !== undefined).length;
  return summary;
}

/**
 * Main entry point: connect, wipe, reload, index, summarize.
 */
async function seed() {
  const started = Date.now();
  console.log('[seed] Loading records from', DATA_PATH);
  const docs = await loadRecords();
  console.log(`[seed] Parsed ${docs.length} records`);

  await connectDB();

  // Idempotent: clear then reload so re-running yields the same clean state.
  console.log('[seed] Clearing existing insights collection...');
  await Insight.deleteMany({});

  console.log('[seed] Inserting records...');
  await Insight.insertMany(docs, { ordered: false });

  // Build (or rebuild) all indexes declared on the schema.
  console.log('[seed] Building indexes...');
  await Insight.syncIndexes();

  const total = await Insight.countDocuments();
  const summary = completenessSummary(docs);

  console.log('\n=========== SEED SUMMARY ===========');
  console.log(`Total records inserted: ${total}`);
  console.log('Populated (non-null / non-empty) values per field:');
  const allFields = [...NUMERIC_FIELDS, ...STRING_FIELDS, ...DATE_FIELDS, 'city'];
  for (const field of allFields) {
    const count = summary[field] ?? 0;
    const pct = total ? ((count / total) * 100).toFixed(1) : '0.0';
    const note = field === 'city' ? '  <- no city data in source (forward-compat only)' : '';
    console.log(`  ${field.padEnd(12)} ${String(count).padStart(4)} / ${total}  (${pct}%)${note}`);
  }
  console.log('====================================');
  console.log(`[seed] Done in ${Date.now() - started}ms`);
}

seed()
  .catch((err) => {
    console.error('[seed] FAILED:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
