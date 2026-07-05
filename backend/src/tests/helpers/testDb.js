import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import Insight, { normalizeRecord } from '../../models/Insight.js';

/**
 * Test database helpers backed by mongodb-memory-server (ephemeral, in-memory Mongo).
 * Tests never touch a real/production database.
 */

let mongod;

/**
 * Boot an in-memory MongoDB and connect mongoose to it.
 * @returns {Promise<string>} the connection URI.
 */
export async function startTestDb() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return uri;
}

/**
 * Disconnect mongoose and stop the in-memory server.
 */
export async function stopTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

/**
 * Remove all documents from the insights collection (call between tests).
 */
export async function clearInsights() {
  await Insight.deleteMany({});
}

/**
 * Insert a set of raw (source-shaped) records, normalized exactly like the seed script.
 * @param {Array<Record<string, unknown>>} rawRecords
 * @returns {Promise<number>} number inserted.
 */
export async function seedInsights(rawRecords) {
  const docs = rawRecords.map(normalizeRecord);
  await Insight.insertMany(docs, { ordered: false });
  return docs.length;
}
