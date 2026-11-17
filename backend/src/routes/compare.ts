import { Router } from 'express';
import type { CompareResponse, ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { runComparison } from '../domain/analysis';
import { parseOrThrow, stableStringify } from '../middleware/validate';
import { cached } from '../utils/cache';
import { compareBodySchema } from './schemas';

export function createCompareRouter(store: DataStore): Router {
  const router = Router();

  router.post('/', (req, res) => {
    const body = parseOrThrow(compareBodySchema, req.body);
    const scenarioId: ScenarioId = body.scenarioId ?? 'A';
    const key = `compare:${store.revision}:${scenarioId}:${stableStringify(body)}`;

    const response = cached(key, (): CompareResponse => {
      const { comparison, weights } = runComparison(store, scenarioId, {
        weights: body.weights,
        shortagePolicy: body.shortagePolicy,
      });
      return {
        scenarioId,
        simulated: true,
        generatedAt: new Date().toISOString(),
        weights,
        shortagePolicy: body.shortagePolicy ?? 'score-priority',
        results: comparison.results,
        tradeoffs: comparison.tradeoffs,
      };
    });

    res.json(response);
  });

  return router;
}
