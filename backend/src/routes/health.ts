import { Router } from 'express';
import type { DataStore } from '../data/store';
import { cacheSize } from '../utils/cache';

export function createHealthRouter(store: DataStore): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const scenarios = store.listScenarios();
    res.json({
      status: 'ok',
      simulated: true,
      uptimeSeconds: Math.round(process.uptime()),
      scenarios: scenarios.map((scenario) => ({
        id: scenario.id,
        name: scenario.name,
        farmers: scenario.totals.farmerCount,
        buyers: scenario.totals.buyerCount,
      })),
      revision: store.revision,
      cacheEntries: cacheSize(),
    });
  });
  return router;
}
