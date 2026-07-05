/**
 * e2eServer.js — a self-contained backend for Playwright end-to-end tests.
 *
 * Boots an ephemeral in-memory MongoDB, seeds it from data/jsondata.json, and starts the
 * real Express app on :8000 (rate limiting disabled so the test isn't throttled). Used by
 * the Playwright webServer config so `npm run test:e2e` needs no external MongoDB.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createApp } from '../app.js';
import Insight, { normalizeRecord } from '../models/Insight.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../../../data/jsondata.json');
const PORT = Number(process.env.PORT) || 8000;

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('blackcoffer_e2e'));

  const raw = JSON.parse(await readFile(DATA_PATH, 'utf-8'));
  await Insight.deleteMany({});
  await Insight.insertMany(raw.map(normalizeRecord), { ordered: false });
  await Insight.syncIndexes();
  console.log(`[e2e] Seeded ${raw.length} records`);

  // enableRateLimit false so the E2E flow (many quick requests) isn't rate-limited.
  const app = createApp({ enableRateLimit: false });
  app.listen(PORT, () => {
    console.log(`[e2e] API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[e2e] Failed to start:', err);
  process.exit(1);
});
