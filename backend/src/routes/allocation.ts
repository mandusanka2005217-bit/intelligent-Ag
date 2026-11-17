import { Router } from 'express';
import type { ScenarioId, ShortagePolicy, StrategyId } from '@contracts/types';
import type { DataStore } from '../data/store';
import {
  buildAllocationResponse,
  runAllocationAnalysis,
  type AllocationOptions,
} from '../domain/analysis';
import { NotFoundError } from '../errors';
import { parseOrThrow, stableStringify } from '../middleware/validate';
import { cached } from '../utils/cache';
import { allocateBodySchema, allocationQuerySchema } from './schemas';

export function createAllocationRouter(store: DataStore): Router {
  const router = Router();

  function compute(scenarioId: ScenarioId, options: AllocationOptions) {
    const key = `allocate:${store.revision}:${scenarioId}:${stableStringify(options)}`;
    return cached(key, () => {
      const run = runAllocationAnalysis(store, scenarioId, options);
      return buildAllocationResponse(
        store,
        run,
        options.strategy ?? 'min-cost-flow',
        options.shortagePolicy ?? 'score-priority',
      );
    });
  }

  router.post('/', (req, res) => {
    const body = parseOrThrow(allocateBodySchema, req.body);
    const scenarioId: ScenarioId = body.scenarioId ?? 'A';
    const response = compute(scenarioId, {
      weights: body.weights,
      strategy: body.strategy,
      shortagePolicy: body.shortagePolicy,
      constraints: body.constraints,
    });
    res.json(response);
  });

  // Legacy list endpoint used by the original frontend stub.
  router.get('/', (req, res) => {
    const query = parseOrThrow(allocationQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';
    const strategy: StrategyId = query.strategy ?? 'min-cost-flow';
    const shortagePolicy: ShortagePolicy = query.shortagePolicy ?? 'score-priority';
    const response = compute(scenarioId, { strategy, shortagePolicy });
    res.json(response.allocations);
  });

  router.get('/:id', (req, res) => {
    const query = parseOrThrow(allocationQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';
    const response = compute(scenarioId, {
      strategy: query.strategy ?? 'min-cost-flow',
      shortagePolicy: query.shortagePolicy ?? 'score-priority',
    });
    const row = response.allocations.find((allocation) => allocation.id === req.params.id);
    if (!row) throw new NotFoundError(`Allocation ${req.params.id} not found`);
    res.json(row);
  });

  return router;
}
