import { Router } from 'express';
import type { DataStore } from '../data/store';
import { createAllocationRouter } from './allocation';
import { createBuyersRouter } from './buyers';
import { createCompareRouter } from './compare';
import { createDashboardRouter } from './dashboard';
import { createFarmersRouter } from './farmers';
import { createHealthRouter } from './health';
import { createMatchesRouter } from './matches';
import { createOrdersRouter } from './orders';
import { createPricesRouter } from './prices';
import { createScenariosRouter } from './scenarios';
import { createUploadRouter } from './upload';
import { createIntelligenceRouter } from './intelligence';

export function createApiRouter(store: DataStore): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json({
      name: 'Intelligent Agricultural Supply API',
      simulated: true,
      endpoints: [
        'GET /api/health',
        'GET /api/scenarios',
        'GET /api/scenarios/:id/data',
        'GET|POST /api/farmers',
        'GET|POST /api/buyers',
        'GET|POST /api/orders',
        'POST /api/upload/csv',
        'POST /api/matches',
        'POST /api/allocate',
        'POST /api/compare',
        'GET /api/prices/:product/anomalies',
      ],
    });
  });
  router.use('/health', createHealthRouter(store));
  router.use('/scenarios', createScenariosRouter(store));
  router.use('/farmers', createFarmersRouter(store));
  router.use('/buyers', createBuyersRouter(store));
  router.use('/orders', createOrdersRouter(store));
  router.use('/upload/csv', createUploadRouter(store));
  router.use('/matches', createMatchesRouter(store));
  router.use('/allocate', createAllocationRouter(store));
  router.use('/allocations', createAllocationRouter(store));
  router.use('/compare', createCompareRouter(store));
  router.use('/prices', createPricesRouter(store));
  router.use('/dashboard', createDashboardRouter(store));
  router.use('/intelligence', createIntelligenceRouter(store));
  return router;
}
