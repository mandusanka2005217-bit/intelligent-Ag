import { Router } from 'express';
import type { ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { parseOrThrow } from '../middleware/validate';
import {
  farmerCreateSchema,
  farmerQuerySchema,
  farmerUpdateSchema,
} from './schemas';

export function createFarmersRouter(store: DataStore): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const query = parseOrThrow(farmerQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';
    res.json(
      store.listFarmers(scenarioId, {
        search: query.search,
        cropType: query.cropType,
        minPricePerKg: query.minPricePerKg,
        maxPricePerKg: query.maxPricePerKg,
      }),
    );
  });

  router.get('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    res.json(store.getFarmer(scenarioId, req.params.id));
  });

  router.post('/', (req, res) => {
    const body = parseOrThrow(farmerCreateSchema, req.body, 'Farmer');
    const { scenarioId, ...dto } = body;
    const scenario: ScenarioId = scenarioId ?? 'A';
    res.status(201).json(store.addFarmer(scenario, dto));
  });

  router.patch('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    const dto = parseOrThrow(farmerUpdateSchema, req.body, 'Farmer update');
    res.json(store.updateFarmer(scenarioId, req.params.id, dto));
  });

  router.delete('/:id', (req, res) => {
    const scenarioId = (req.query.scenarioId as ScenarioId | undefined) ?? 'A';
    store.deleteFarmer(scenarioId, req.params.id);
    res.status(204).send();
  });

  return router;
}
