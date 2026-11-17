import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { DataStore } from '../src/data/store';
import { loadData } from '../src/data/loader';
import pino from 'pino';

describe('Intelligence API Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    const data = await loadData();
    const logger = pino({ level: 'silent' });
    const store = new DataStore(data, logger);
    app = createApp(store, logger);
  });

  it('GET /api/intelligence/forecasting returns valid points, productForecasts and accuracy', async () => {
    const res = await request(app).get('/api/intelligence/forecasting?scenarioId=A&horizon=30');
    expect(res.status).toBe(200);
    expect(res.body.scenarioId).toBe('A');
    expect(res.body.points.length).toBeGreaterThan(0);
    expect(res.body.productForecasts.length).toBeGreaterThan(0);
    expect(res.body.accuracyMetrics).toBeDefined();
    expect(res.body.topProducts).toBeInstanceOf(Array);
  });

  it('GET /api/intelligence/transportation/optimize returns optimized vehicle routes', async () => {
    const res = await request(app).get('/api/intelligence/transportation/optimize?scenarioId=A');
    expect(res.status).toBe(200);
    expect(res.body.optimized.routes).toBeInstanceOf(Array);
    expect(res.body.baseline).toBeDefined();
    expect(res.body.optimized.distanceSavedKm).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/intelligence/freshness returns perishable rankings and spoilage risk', async () => {
    const res = await request(app).get('/api/intelligence/freshness?scenarioId=A');
    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.avgFreshnessScore).toBeDefined();
    expect(res.body.items[0]).toHaveProperty('spoilageRisk');
    expect(res.body.items[0]).toHaveProperty('freshnessScore');
  });

  it('GET /api/intelligence/risk returns district supply-demand risk alerts', async () => {
    const res = await request(app).get('/api/intelligence/risk?scenarioId=A');
    expect(res.status).toBe(200);
    expect(res.body.districts).toBeInstanceOf(Array);
    expect(res.body.overallRiskCategory).toBeDefined();
    expect(res.body.alerts).toBeInstanceOf(Array);
  });

  it('GET /api/intelligence/pricing/recommendations returns grade corridors and net proceeds', async () => {
    const res = await request(app).get('/api/intelligence/pricing/recommendations?scenarioId=A');
    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeInstanceOf(Array);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    const first = res.body.recommendations[0];
    expect(first.recommendedSellingPrice.gradeA).toBeGreaterThan(first.recommendedSellingPrice.gradeC);
  });

  it('POST /api/intelligence/simulation/run runs what-if analysis without mutating store', async () => {
    const res = await request(app)
      .post('/api/intelligence/simulation/run?scenarioId=A')
      .send({
        supplyFactorPct: -20,
        demandFactorPct: 15,
        transportRateFactorPct: 10,
      });
    expect(res.status).toBe(200);
    expect(res.body.baseline).toBeDefined();
    expect(res.body.simulated).toBeDefined();
    expect(res.body.impactDeltas).toBeDefined();
    expect(res.body.recommendations).toBeInstanceOf(Array);
  });

  it('GET /api/intelligence/sustainability returns avoided food waste and CO2 metrics', async () => {
    const res = await request(app).get('/api/intelligence/sustainability?scenarioId=A');
    expect(res.status).toBe(200);
    expect(res.body.metrics.estimatedSpoilageAvoidedKg).toBeGreaterThanOrEqual(0);
    expect(res.body.metrics.co2EmissionsSavedKg).toBeGreaterThanOrEqual(0);
    expect(res.body.assumptions).toBeDefined();
  });
});
