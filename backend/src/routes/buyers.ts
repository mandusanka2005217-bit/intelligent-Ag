import { Router } from 'express';
import type { ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { parseOrThrow } from '../middleware/validate';
import { buyerCreateSchema, buyerQuerySchema, buyerUpdateSchema } from './schemas';

export function createBuyersRouter(store: DataStore): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const query = parseOrThrow(buyerQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';
    res.json(
      store.listBuyers(scenarioId, {
        search: query.search,
        requiredCropType: query.requiredCropType,
        maxPricePerKg: query.maxPricePerKg,
      }),
    );
  });

  router.get('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    res.json(store.getBuyer(scenarioId, req.params.id));
  });

  router.post('/', (req, res) => {
    const body = parseOrThrow(buyerCreateSchema, req.body, 'Buyer');
    const { scenarioId, ...dto } = body;
    const scenario: ScenarioId = scenarioId ?? 'A';
    res.status(201).json(store.addBuyer(scenario, dto));
  });

  router.patch('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    const dto = parseOrThrow(buyerUpdateSchema, req.body, 'Buyer update');
    res.json(store.updateBuyer(scenarioId, req.params.id, dto));
  });

  router.delete('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    store.deleteBuyer(scenarioId, req.params.id);
    res.status(204).send();
  });

  return router;
}
