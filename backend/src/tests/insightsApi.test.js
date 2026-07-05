import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createApp } from '../app.js';
import { startTestDb, stopTestDb, clearInsights, seedInsights } from './helpers/testDb.js';
import { FIXTURE } from './helpers/fixtures.js';

/**
 * Integration tests (Prompt 7): a known 8-record fixture is seeded into an in-memory
 * MongoDB, and every assertion is hand-calculated from that fixture (see fixtures.js).
 */

const app = createApp({ enableRateLimit: false });

beforeAll(async () => {
  await startTestDb();
  await clearInsights();
  await seedInsights(FIXTURE);
});

afterAll(async () => {
  await stopTestDb();
});

async function total(query = '') {
  const res = await request(app).get(`/api/insights${query}`);
  expect(res.status).toBe(200);
  return res.body.total;
}

describe('GET /api/insights — filtering', () => {
  it('no filter returns all 8 records', async () => {
    expect(await total()).toBe(8);
  });

  it('topic=oil returns 3', async () => {
    expect(await total('?topic=oil')).toBe(3);
  });

  it('sector=Energy returns 4', async () => {
    expect(await total('?sector=Energy')).toBe(4);
  });

  it('region=World returns 4', async () => {
    expect(await total('?region=World')).toBe(4);
  });

  it('pestle=Economic returns 4', async () => {
    expect(await total('?pestle=Economic')).toBe(4);
  });

  it('source=EIA returns 2', async () => {
    expect(await total('?source=EIA')).toBe(2);
  });

  it('country=Saudi Arabia returns 2', async () => {
    expect(await total('?country=Saudi%20Arabia')).toBe(2);
  });

  it('end_year=2017 returns 3', async () => {
    expect(await total('?end_year=2017')).toBe(3);
  });

  it('intensity_min=15 returns 3 (20, 16, 24)', async () => {
    expect(await total('?intensity_min=15')).toBe(3);
  });

  it('combined topic=oil & region=World returns 2 (AND across fields)', async () => {
    expect(await total('?topic=oil&region=World')).toBe(2);
  });

  it('repeatable topic=oil&topic=gas returns 4 (OR within field)', async () => {
    expect(await total('?topic=oil&topic=gas')).toBe(4);
  });

  it('city filter returns 0 (no city data)', async () => {
    expect(await total('?city=Delhi')).toBe(0);
  });
});

describe('GET /api/insights — pagination', () => {
  it('page 2 does not repeat page 1 items; total is accurate', async () => {
    const p1 = await request(app).get('/api/insights?page=1&page_size=3');
    const p2 = await request(app).get('/api/insights?page=2&page_size=3');
    expect(p1.body.total).toBe(8);
    expect(p1.body.total_pages).toBe(3);
    expect(p1.body.data).toHaveLength(3);
    expect(p2.body.data).toHaveLength(3);

    const ids1 = new Set(p1.body.data.map((d) => d._id));
    const ids2 = p2.body.data.map((d) => d._id);
    expect(ids2.some((id) => ids1.has(id))).toBe(false);
  });
});

describe('GET /api/insights/stats — aggregation matches hand-calculated values', () => {
  let stats;
  beforeAll(async () => {
    const res = await request(app).get('/api/insights/stats');
    expect(res.status).toBe(200);
    stats = res.body;
  });

  it('overall: count 8, avgIntensity 12.5, avgLikelihood 3.3, avgRelevance 3.6', () => {
    expect(stats.overall.count).toBe(8);
    expect(stats.overall.avgIntensity).toBe(12.5); // 100/8
    expect(stats.overall.avgLikelihood).toBe(3.3); // 26/8 = 3.25 -> 3.3
    expect(stats.overall.avgRelevance).toBe(3.6); // 29/8 = 3.625 -> 3.6
  });

  it('byYear 2017: avgIntensity 12.7, count 3', () => {
    const y2017 = stats.byYear.find((y) => y.year === 2017);
    expect(y2017.count).toBe(3);
    expect(y2017.avgIntensity).toBe(12.7); // (10+20+8)/3 = 12.666 -> 12.7
    expect(y2017.avgLikelihood).toBe(3.3); // (3+4+3)/3 = 3.333 -> 3.3
    // record 6 (end_year null) is excluded from the year breakdown
    expect(stats.byYear.some((y) => y.year === null)).toBe(false);
  });

  it('byRegion: World has the highest count (4)', () => {
    expect(stats.byRegion[0]).toEqual({ region: 'World', count: 4 });
  });

  it('byTopic: oil is top with count 3 and avgRelevance 4', () => {
    const oil = stats.byTopic.find((t) => t.topic === 'oil');
    expect(oil.count).toBe(3);
    expect(oil.avgRelevance).toBe(4); // (2+4+6)/3
  });

  it('byCountry: excludes blank country; USA count 2, avgIntensity 8', () => {
    expect(stats.byCountry.some((c) => c.country === '')).toBe(false);
    const usa = stats.byCountry.find((c) => c.country === 'United States of America');
    expect(usa.count).toBe(2);
    expect(usa.avgIntensity).toBe(8); // (10+6)/2
  });

  it('bySector: Energy avgIntensity 12, avgLikelihood 3.3, count 4; sorted by intensity desc', () => {
    const energy = stats.bySector.find((s) => s.sector === 'Energy');
    expect(energy.count).toBe(4);
    expect(energy.avgIntensity).toBe(12); // (10+20+6+12)/4
    expect(energy.avgLikelihood).toBe(3.3); // (3+4+2+4)/4 = 3.25 -> 3.3
    // Highest avg intensity sector is Information Technology (24)
    expect(stats.bySector[0].sector).toBe('Information Technology');
  });

  it('stats respect filters (sector=Energy -> single sector bucket)', async () => {
    const res = await request(app).get('/api/insights/stats?sector=Energy');
    expect(res.body.bySector).toHaveLength(1);
    expect(res.body.bySector[0].sector).toBe('Energy');
    expect(res.body.overall.count).toBe(4);
  });
});
