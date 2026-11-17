import { Router } from 'express';
import type { ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { buildMatchesResponse, runMatchingAnalysis } from '../domain/analysis';
import { parseOrThrow, stableStringify } from '../middleware/validate';
import { cached } from '../utils/cache';
import { matchBodySchema, matchQuerySchema } from './schemas';

export function createMatchesRouter(store: DataStore): Router {
  const router = Router();

  function respond(
    scenarioId: ScenarioId,
    weights: Parameters<typeof runMatchingAnalysis>[2],
    minScore: number,
    limit: number,
    cacheKey: string,
  ) {
    return cached(cacheKey, () =>
      buildMatchesResponse(runMatchingAnalysis(store, scenarioId, weights, minScore, limit)),
    );
  }

  router.post('/', (req, res) => {
    const body = parseOrThrow(matchBodySchema, req.body);
    const scenarioId: ScenarioId = body.scenarioId ?? 'A';
    const minScore = body.minScore ?? 0;
    const limit = body.limit ?? 200;
    const key = `matches:${store.revision}:${scenarioId}:${stableStringify(body)}`;
    res.json(respond(scenarioId, body.weights, minScore, limit, key));
  });

  // Legacy alias used by the original frontend stub.
  router.post('/run', (req, res) => {
    const body = parseOrThrow(matchBodySchema, req.body);
    const scenarioId: ScenarioId = body.scenarioId ?? 'A';
    const key = `matches-run:${store.revision}:${scenarioId}:${stableStringify(body)}`;
    res.json(respond(scenarioId, body.weights, body.minScore ?? 0, 200, key));
  });

  router.get('/', (req, res) => {
    const query = parseOrThrow(matchQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';
    const key = `matches-get:${store.revision}:${scenarioId}:${stableStringify(query)}`;
    res.json(respond(scenarioId, undefined, query.minScore ?? 0, query.limit ?? 200, key));
  });

  return router;
}
