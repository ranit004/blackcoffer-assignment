import mongoose from 'mongoose';
import dns from 'node:dns';

/**
 * True if an error looks like a DNS SRV-lookup failure (the `mongodb+srv://` scheme needs
 * a DNS SRV lookup, which some networks/routers refuse — e.g. `querySrv ECONNREFUSED`).
 * @param {unknown} err
 * @returns {boolean}
 */
function isSrvDnsError(err) {
  const syscall = err?.syscall || '';
  const code = err?.code || '';
  const message = err?.message || '';
  return (
    syscall === 'querySrv' ||
    /querySrv|ESERVFAIL|EREFUSED/i.test(message) ||
    (/ECONNREFUSED|ETIMEOUT|ESERVFAIL/i.test(code) && message.includes('mongodb'))
  );
}

/**
 * Connect to MongoDB using the connection string from the environment.
 *
 * The URI is read exclusively from process.env.MONGODB_URI (loaded via dotenv in
 * server.js). It is never hardcoded or logged, so secrets stay out of source control.
 *
 * For `mongodb+srv://` (Atlas) URIs, if the initial connect fails because the local DNS
 * resolver refuses the SRV lookup (a common Windows/router issue — `querySrv ECONNREFUSED`),
 * we retry once after pointing Node's resolver at reliable public DNS servers. Override the
 * list with DNS_SERVERS (comma-separated); set DNS_SERVERS="" to disable the fallback.
 *
 * @param {string} [uri=process.env.MONGODB_URI] - MongoDB connection string.
 * @returns {Promise<typeof mongoose>} The connected mongoose instance.
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
  }

  // strictQuery keeps Mongoose from silently dropping unknown query fields.
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
  } catch (err) {
    const canRetry = uri.startsWith('mongodb+srv://') && isSrvDnsError(err);
    const servers = (process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (canRetry && servers.length) {
      console.warn(
        `[db] SRV DNS lookup failed (${err.code || err.message}); retrying via DNS ${servers.join(
          ', ',
        )}`,
      );
      dns.setServers(servers);
      await mongoose.connect(uri);
    } else {
      throw err;
    }
  }

  console.log('[db] Connected to MongoDB');
  return mongoose;
}

/**
 * Gracefully close the MongoDB connection (used on shutdown and in tests).
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  await mongoose.disconnect();
}
