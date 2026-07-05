import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createApp } from '../app.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { startTestDb, stopTestDb, seedInsights } from './helpers/testDb.js';
import { FIXTURE } from './helpers/fixtures.js';

/**
 * Security test suite (Prompt 4). Each case is a real assertion, not a comment.
 * Uses an in-memory MongoDB and Supertest against the real Express app.
 */

// App with rate limiting DISABLED for functional security tests (a dedicated test
// below builds its own app with a low limit to prove 429 enforcement).
const app = createApp({ enableRateLimit: false });

beforeAll(async () => {
  await startTestDb();
  await seedInsights(FIXTURE);
});

afterAll(async () => {
  await stopTestDb();
});

describe('input validation', () => {
  it('test_rejects_oversized_string_filter — 10k-char topic returns 422 (not 500)', async () => {
    const huge = 'a'.repeat(10_000);
    const res = await request(app).get('/api/insights').query({ topic: huge });
    expect(res.status).toBe(422);
    expect(res.body.error.status).toBe(422);
  });

  it('test_rejects_non_integer_year — end_year=abc returns 422', async () => {
    const res = await request(app).get('/api/insights?end_year=abc');
    expect(res.status).toBe(422);
  });

  it('test_pagination_bounds_enforced — page_size=100000 is clamped to 200', async () => {
    const res = await request(app).get('/api/insights?page_size=100000');
    expect(res.status).toBe(200);
    expect(res.body.page_size).toBe(200);
  });
});

describe('NoSQL injection', () => {
  it('test_nosql_operator_injection_blocked — ?topic[$ne]= is rejected, no data bypass', async () => {
    const res = await request(app).get('/api/insights?topic[$ne]=');
    // Sanitized ($ne stripped) then rejected by schema validation.
    expect(res.status).toBe(422);
    // And crucially: it never returns the full unfiltered dataset as a bypass.
    expect(res.body.data).toBeUndefined();
  });

  it('operator injection via $gt is also neutralized', async () => {
    const res = await request(app).get('/api/insights?intensity_min[$gt]=0');
    expect(res.status).toBe(422);
  });
});

describe('rate limiting', () => {
  it('test_rate_limit_enforced — excess requests over the limit return 429', async () => {
    const limitedApp = createApp({
      enableRateLimit: true,
      rateLimitMax: 5,
      rateLimitWindowMs: 60_000,
    });
    const statuses = [];
    for (let i = 0; i < 8; i += 1) {
      const res = await request(limitedApp).get('/api/health');
      statuses.push(res.status);
    }
    expect(statuses.filter((s) => s === 200).length).toBe(5);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});

describe('CORS', () => {
  it('test_cors_rejects_unlisted_origin — no ACAO header for a non-allowlisted origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allowlisted origin receives a matching ACAO header', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('security headers', () => {
  it('test_security_headers_present — nosniff + frame DENY are set', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toBeTruthy();
  });
});

describe('error responses', () => {
  it('test_error_responses_do_not_leak_internals — 500 body has no stack/path/class in prod', async () => {
    // Build a tiny app that forces a 500 through the REAL error handler in production mode.
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const leakApp = express();
      leakApp.get('/boom', () => {
        throw new Error('boom at C:/secret/internal/path.js near TypeError');
      });
      leakApp.use(errorHandler);

      const res = await request(leakApp).get('/boom');
      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('Internal server error');

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('boom');
      expect(serialized).not.toContain('.js');
      expect(serialized.toLowerCase()).not.toContain('stack');
      expect(serialized).not.toContain('TypeError');
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe('read-only API surface', () => {
  it('test_health_endpoint_no_auth_required — GET /api/health works with no auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('test_insights_endpoint_read_only — no write routes exist (POST/PUT/DELETE 404)', async () => {
    const post = await request(app).post('/api/insights').send({ title: 'x' });
    const put = await request(app).put('/api/insights/anything').send({ title: 'x' });
    const del = await request(app).delete('/api/insights/anything');
    expect(post.status).toBe(404);
    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
  });
});
