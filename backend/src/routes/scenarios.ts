import { Router } from 'express';
import type { ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { parseOrThrow } from '../middleware/validate';
import { NotFoundError } from '../errors';
import { scenarioParamSchema, scenarioQuerySchema } from './schemas';

export function createScenariosRouter(store: DataStore): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(store.listScenarios());
  });

  router.get('/:id/data', (req, res) => {
    const { id } = parseOrThrow(scenarioParamSchema, req.params);
    res.json(store.getScenarioData(id));
  });

  router.get('/:id', (req, res) => {
    const { id } = parseOrThrow(scenarioParamSchema, req.params);
    const scenario = store.listScenarios().find((candidate) => candidate.id === id);
    if (!scenario) throw new NotFoundError(`Scenario ${id} not found`);
    res.json(scenario);
  });

  return router;
}
