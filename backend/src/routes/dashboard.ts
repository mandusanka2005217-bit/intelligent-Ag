import { Router } from 'express';
import type { ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { buildDashboardSummary } from '../domain/analysis';
import { parseOrThrow } from '../middleware/validate';
import { cached } from '../utils/cache';
import { dashboardQuerySchema } from './schemas';

export function createDashboardRouter(store: DataStore): Router {
  const router = Router();

  function summaryFor(scenarioId: ScenarioId) {
    const key = `dashboard:${store.revision}:${scenarioId}`;
    return cached(key, () => buildDashboardSummary(store, scenarioId));
  }

  router.get('/stats', (req, res) => {
    const query = parseOrThrow(dashboardQuerySchema, req.query);
    res.json(summaryFor(query.scenarioId ?? 'A').stats);
  });

  router.get('/score-distribution', (req, res) => {
    const query = parseOrThrow(dashboardQuerySchema, req.query);
    res.json(summaryFor(query.scenarioId ?? 'A').scoreDistribution);
  });

  router.get('/distance-price', (req, res) => {
    const query = parseOrThrow(dashboardQuerySchema, req.query);
    res.json(summaryFor(query.scenarioId ?? 'A').distancePrice);
  });

  router.get('/allocation-breakdown', (req, res) => {
    const query = parseOrThrow(dashboardQuerySchema, req.query);
    res.json(summaryFor(query.scenarioId ?? 'A').allocationBreakdown);
  });

  return router;
}
