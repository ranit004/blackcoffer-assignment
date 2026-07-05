import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import healthRouter from './routes/health.js';
import insightsRouter from './routes/insights.js';
import { sanitizeRequest } from './middleware/sanitize.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';

/**
 * Build and configure the Express application.
 *
 * The app is created separately from the HTTP server (see server.js) so integration
 * and security tests can drive it with Supertest without opening a port.
 *
 * @param {object} [options]
 * @param {boolean} [options.enableRateLimit=true] - Toggle the /api rate limiter (tests
 *   disable it except for the dedicated rate-limit test).
 * @param {number} [options.rateLimitMax] - Max requests per window per IP.
 * @param {number} [options.rateLimitWindowMs] - Rate-limit window in ms.
 * @returns {import('express').Express}
 */
export function createApp(options = {}) {
  const {
    enableRateLimit = process.env.NODE_ENV !== 'test',
    rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 100,
    rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  } = options;

  const app = express();

  // Trust the first proxy so express-rate-limit sees real client IPs behind a proxy.
  app.set('trust proxy', 1);

  // Express 5 defaults to the "simple" query parser, which flattens `topic[$ne]=` into
  // a literal key. Use the "extended" (qs) parser so bracket/nested notation parses into
  // real objects — this is the classic NoSQL-injection surface. The sanitize middleware
  // then strips any `$`/`.` keys and Zod rejects the leftover non-string shape with 422,
  // so operator-injection payloads are neutralized AND rejected (never a data bypass).
  app.set('query parser', 'extended');

  // --- Security headers (helmet) ---------------------------------------------
  // Sets X-Content-Type-Options: nosniff, X-Frame-Options: DENY, HSTS (https only),
  // and a restrictive CSP. The CSP allows inline styles/scripts so the Swagger UI at
  // /api/docs renders; JSON API responses are unaffected.
  app.use(
    helmet({
      // Prompt 4 requires X-Frame-Options: DENY (helmet defaults to SAMEORIGIN).
      frameguard: { action: 'deny' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  // --- CORS allowlist --------------------------------------------------------
  // Restrict to configured frontend origins (never a wildcard). Disallowed origins get
  // NO Access-Control-Allow-Origin header (browser blocks them) but do not 500.
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false); // no CORS headers, but not an error
      },
    }),
  );

  // --- Request logging (quiet in tests) --------------------------------------
  app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV !== 'test' }));

  // --- Body parsing + NoSQL-injection sanitization ---------------------------
  app.use(express.json({ limit: '100kb' }));
  app.use(sanitizeRequest);

  // --- Rate limiting on all /api routes --------------------------------------
  if (enableRateLimit) {
    app.use(
      '/api',
      rateLimit({
        windowMs: rateLimitWindowMs,
        max: rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { status: 429, message: 'Too many requests, please try later.' } },
      }),
    );
  }

  // --- API documentation -----------------------------------------------------
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Feature routes --------------------------------------------------------
  app.use('/api', healthRouter);
  app.use('/api', insightsRouter);

  // --- 404 + centralized error handling (must be last) -----------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
