import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../src/app';
import { loadData } from '../src/data/loader';
import { DataStore } from '../src/data/store';
import { clearCache } from '../src/utils/cache';

const store = new DataStore(loadData());
const app = createApp(store, { logger: pino({ level: 'silent' }), serveFrontend: false });

beforeAll(() => {
  clearCache();
});

describe('GET /api', () => {
  it('exposes service metadata', async () => {
    const response = await request(app).get('/api').expect(200);
    expect(response.body.name).toMatch(/Agricultural Supply/);
    expect(response.body.simulated).toBe(true);
  });

  it('reports healthy scenarios', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.scenarios).toHaveLength(2);
  });

  it('returns both scenario descriptors and their totals', async () => {
    const list = await request(app).get('/api/scenarios').expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body.find((scenario: { id: string }) => scenario.id === 'B').totals.totalSupplyKg).toBe(9600);

    const data = await request(app).get('/api/scenarios/A/data').expect(200);
    expect(data.body.farmers).toHaveLength(15);
    expect(data.body.buyers).toHaveLength(8);
    expect(data.body.locations.length).toBeGreaterThan(0);
    expect(data.body.simulated).toBe(true);
  });

  it('rejects an unknown scenario id with a validation error', async () => {
    const response = await request(app).get('/api/scenarios/C/data').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBeTruthy();
    expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
  });
});

describe('farmers and buyers', () => {
  it('filters farmers by scenario and crop', async () => {
    const response = await request(app).get('/api/farmers?scenarioId=A&cropType=Tomato').expect(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.every((farmer: { cropType: string }) => farmer.cropType === 'Tomato')).toBe(true);
  });

  it('validates a bad farmer payload', async () => {
    const response = await request(app)
      .post('/api/farmers')
      .send({ name: 'X', location: 'Nowhere', cropType: 'Tomato', quantityKg: -5, pricePerKg: 0 })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    const paths = response.body.error.details.map((detail: { path: string }) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'quantityKg', 'pricePerKg']));
  });

  it('creates, edits and deletes a farmer in scenario A only', async () => {
    const created = await request(app)
      .post('/api/farmers')
      .send({
        scenarioId: 'A',
        name: 'API Farmer',
        location: 'Dambulla',
        cropType: 'Tomato',
        quantityKg: 450,
        pricePerKg: 99,
      })
      .expect(201);
    expect(created.body.id).toMatch(/^F\d{2,}$/);
    expect(created.body.minPricePerKg).toBeCloseTo(84.15, 2);

    const updated = await request(app)
      .patch(`/api/farmers/${created.body.id}?scenarioId=A`)
      .send({ quantityKg: 600 })
      .expect(200);
    expect(updated.body.quantityKg).toBe(600);

    await request(app).delete(`/api/farmers/${created.body.id}?scenarioId=A`).expect(204);
    await request(app).get(`/api/farmers/${created.body.id}?scenarioId=A`).expect(404);

    const bFarmers = await request(app).get('/api/farmers?scenarioId=B').expect(200);
    expect(bFarmers.body).toHaveLength(15);
  });

  it('creates a buyer with default minimum lot and quality', async () => {
    const created = await request(app)
      .post('/api/buyers')
      .send({
        scenarioId: 'B',
        name: 'API Buyer',
        location: 'Colombo',
        requiredCropType: 'Tomato',
        requiredQuantityKg: 800,
        maxPricePerKg: 150,
      })
      .expect(201);
    expect(created.body.minAcceptableQuantityKg).toBe(80);
    expect(created.body.minQualityGrade).toBe('C');
    await request(app).delete(`/api/buyers/${created.body.id}?scenarioId=B`).expect(204);
  });
});

describe('matching', () => {
  it('returns scored, explained matches for scenario A', async () => {
    const response = await request(app)
      .post('/api/matches')
      .send({ scenarioId: 'A' })
      .expect(200);

    expect(response.body.matches.length).toBeGreaterThan(0);
    expect(response.body.summary.feasiblePairs).toBe(response.body.matches.length);
    expect(response.body.summary.candidatePairs).toBe(120);
    expect(response.body.weights.price).toBeCloseTo(0.3, 6);

    const match = response.body.matches[0];
    expect(match.suitabilityScore).toBeGreaterThan(0);
    expect(match.suitabilityScore).toBeLessThanOrEqual(100);
    expect(match.components.price).toBeDefined();
    expect(match.distanceKm).toBeGreaterThanOrEqual(0);
    expect(response.body.matches.some((candidate: { distanceKm: number }) => candidate.distanceKm > 0)).toBe(
      true,
    );
    expect(match.explanation).toMatch(/because/);
    expect(match.reasons.length).toBeGreaterThan(0);
  });

  it('serves identical requests from the in-process cache', async () => {
    const first = await request(app).post('/api/matches').send({ scenarioId: 'B' }).expect(200);
    const second = await request(app).post('/api/matches').send({ scenarioId: 'B' }).expect(200);
    expect(second.body.generatedAt).toBe(first.body.generatedAt);
    expect(second.body.matches).toEqual(first.body.matches);
  });

  it('honours a minimum score filter', async () => {
    const response = await request(app)
      .post('/api/matches')
      .send({ scenarioId: 'A', minScore: 75, limit: 5 })
      .expect(200);
    expect(response.body.matches.length).toBeLessThanOrEqual(5);
    expect(
      response.body.matches.every((match: { suitabilityScore: number }) => match.suitabilityScore >= 75),
    ).toBe(true);
  });

  it('supports custom weights and renormalises them', async () => {
    const response = await request(app)
      .post('/api/matches')
      .send({ scenarioId: 'A', weights: { price: 1, distance: 0, quantity: 0, quality: 0, availability: 0 } })
      .expect(200);
    expect(response.body.weights.price).toBe(1);
    expect(response.body.weights.distance).toBe(0);
  });
});

describe('allocation', () => {
  it('allocates scenario A with full KPIs and explainable rows', async () => {
    const response = await request(app)
      .post('/api/allocate')
      .send({ scenarioId: 'A', strategy: 'min-cost-flow' })
      .expect(200);

    const body = response.body;
    expect(body.strategy).toBe('min-cost-flow');
    expect(body.kpis.totalAllocatedKg).toBeGreaterThan(0);
    expect(body.kpis.totalAllocatedKg).toBeLessThanOrEqual(body.kpis.totalSupplyKg);
    expect(body.kpis.fillRate).toBeGreaterThan(0.5);
    expect(body.kpis.jainIndex).toBeGreaterThan(0);
    expect(body.allocations.length).toBeGreaterThan(0);

    const row = body.allocations[0];
    expect(row.explanation).toMatch(/chosen/);
    expect(row.transportCostRs).toBeGreaterThanOrEqual(0);
    expect(row.components.quality).toBeGreaterThan(0);
    expect(body.solver.algorithm).toMatch(/Min-cost max-flow/);

    // No buyer receives less than its declared minimum lot.
    const byBuyer = new Map<string, number>();
    for (const allocation of body.allocations) {
      byBuyer.set(allocation.buyerId, (byBuyer.get(allocation.buyerId) ?? 0) + allocation.quantityKg);
    }
    for (const unmet of body.unmetDemand) {
      expect(byBuyer.get(unmet.buyerId) ?? 0).toBe(unmet.allocatedKg);
    }
  });

  it('shows meaningful unmet demand in the disrupted scenario', async () => {
    const response = await request(app)
      .post('/api/allocate')
      .send({ scenarioId: 'B', strategy: 'min-cost-flow' })
      .expect(200);
    expect(response.body.kpis.unmetDemandKg).toBeGreaterThan(0);
    expect(response.body.unmetDemand.length).toBeGreaterThan(0);
    expect(response.body.kpis.fillRate).toBeLessThan(0.8);
  });

  it('serves an identical request in well under 100 ms from cache', async () => {
    const payload = { scenarioId: 'B', strategy: 'fairness', shortagePolicy: 'proportional' };
    await request(app).post('/api/allocate').send(payload).expect(200);
    const started = performance.now();
    const second = await request(app).post('/api/allocate').send(payload).expect(200);
    const elapsed = performance.now() - started;
    expect(second.status).toBe(200);
    expect(elapsed).toBeLessThan(100);
  });

  it('rejects an unknown strategy', async () => {
    const response = await request(app)
      .post('/api/allocate')
      .send({ scenarioId: 'A', strategy: 'magic' })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('keeps the legacy GET /api/allocations shape working', async () => {
    const response = await request(app).get('/api/allocations?scenarioId=A').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].farmerName).toBeTruthy();
  });
});

describe('strategy comparison', () => {
  it('runs all three strategies on the same instance and explains trade-offs', async () => {
    const response = await request(app)
      .post('/api/compare')
      .send({ scenarioId: 'B' })
      .expect(200);
    expect(response.body.results).toHaveLength(3);
    expect(response.body.results.map((result: { strategy: string }) => result.strategy).sort()).toEqual([
      'fairness',
      'greedy',
      'min-cost-flow',
    ]);
    expect(response.body.tradeoffs.length).toBeGreaterThanOrEqual(2);
    const totals = response.body.results.map((result: { totalAllocatedKg: number }) => result.totalAllocatedKg);
    expect(new Set(totals).size).toBe(1); // all allocators move the same scarce kg
  });
});

describe('prices', () => {
  it('returns the price series and flags the simulated tomato spike', async () => {
    const response = await request(app)
      .get('/api/prices/Tomato/anomalies?scenarioId=B')
      .expect(200);
    expect(response.body.points).toHaveLength(90);
    expect(response.body.flagged).toBe(true);
    expect(response.body.warning).toMatch(/standard deviations/);
    expect(response.body.forecast.nextPrice).toBeGreaterThan(0);
    expect(response.body.current.price).toBeGreaterThan(response.body.robustReference);
  });

  it('does not flag the normal-season series', async () => {
    const response = await request(app)
      .get('/api/prices/Tomato/anomalies?scenarioId=A')
      .expect(200);
    expect(response.body.flagged).toBe(false);
    expect(response.body.warning).toBeNull();
  });

  it('returns a helpful 404 for an unknown product', async () => {
    const response = await request(app).get('/api/prices/Dragonfruit/anomalies').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toMatch(/Available:/);
  });
});

describe('dashboard', () => {
  it('returns stats, score buckets, scatter points and allocation breakdown', async () => {
    const stats = await request(app).get('/api/dashboard/stats?scenarioId=A').expect(200);
    expect(stats.body.totalFarmers).toBe(15);
    expect(stats.body.totalBuyers).toBe(8);
    expect(stats.body.totalMatches).toBeGreaterThan(0);

    const buckets = await request(app).get('/api/dashboard/score-distribution?scenarioId=A').expect(200);
    expect(buckets.body).toHaveLength(10);

    const scatter = await request(app).get('/api/dashboard/distance-price?scenarioId=A').expect(200);
    expect(scatter.body.length).toBe(stats.body.totalMatches);

    const breakdown = await request(app).get('/api/dashboard/allocation-breakdown?scenarioId=A').expect(200);
    expect(breakdown.body.length).toBeGreaterThan(0);
    expect(breakdown.body[0].value).toBeGreaterThan(0);
  });
});

describe('CSV upload', () => {
  it('inserts valid rows and reports per-row errors', async () => {
    const csv = [
      'name,location,cropType,quantityKg,pricePerKg,qualityGrade,availableFrom',
      'CSV Farmer One,Dambulla,Tomato,300,100,A,2026-11-15',
      'Bad Row,Atlantis,Tomato,-5,0,Z,not-a-date',
    ].join('\n');

    const response = await request(app)
      .post('/api/upload/csv?scenarioId=A&type=farmer')
      .attach('file', Buffer.from(csv, 'utf8'), 'farmers.csv')
      .expect(200);

    expect(response.body.inserted).toBe(1);
    expect(response.body.totalRows).toBe(2);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0].row).toBe(3);
  });

  it('rejects a request without a file', async () => {
    const response = await request(app).post('/api/upload/csv?scenarioId=A&type=farmer').expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
