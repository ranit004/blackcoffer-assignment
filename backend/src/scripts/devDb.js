/**
 * devDb.js — a zero-install local MongoDB for development.
 *
 * Starts a real `mongod` (downloaded/managed by mongodb-memory-server) on a FIXED port
 * with a PERSISTENT data directory, so `npm run seed` and `npm run dev` work on any
 * machine without installing MongoDB. Data survives restarts because it is stored under
 * backend/.mongo-data (git-ignored).
 *
 * Usage (separate terminal):  npm run db:local
 * Then point the app at it:    MONGODB_URI=mongodb://127.0.0.1:27017/blackcoffer
 *
 * For PRODUCTION / submission use a real MongoDB Atlas cluster instead — just set
 * MONGODB_URI to the Atlas connection string. This script is a dev convenience only.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

import { MongoMemoryServer } from 'mongodb-memory-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../.mongo-data');
const PORT = Number(process.env.LOCAL_DB_PORT) || 27017;
const DB_NAME = process.env.LOCAL_DB_NAME || 'blackcoffer';

async function main() {
  await mkdir(DB_PATH, { recursive: true });

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: PORT,
      dbPath: DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });

  const uri = mongod.getUri(DB_NAME);
  console.log('[db:local] MongoDB running (persistent) at:');
  console.log(`           ${uri}`);
  console.log(`[db:local] Data dir: ${DB_PATH}`);
  console.log('[db:local] Leave this running; press Ctrl+C to stop.');

  const shutdown = async () => {
    console.log('\n[db:local] Stopping MongoDB...');
    await mongod.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[db:local] Failed to start:', err.message);
  process.exit(1);
});
