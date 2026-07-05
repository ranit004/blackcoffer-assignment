import 'dotenv/config';

import { createApp } from './app.js';
import { connectDB, disconnectDB } from './db.js';

const PORT = Number(process.env.PORT) || 8000;

/**
 * Boot the API: connect to MongoDB (if configured), then start listening.
 *
 * During early scaffolding the database may not be provisioned yet, so a failed
 * connection is logged as a warning and the server still starts — this keeps the
 * health check reachable so the frontend wiring can be verified independently.
 */
async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`[server] Starting without a DB connection: ${err.message}`);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown so nodemon restarts and container stops close cleanly.
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
