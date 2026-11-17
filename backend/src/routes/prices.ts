import { Router } from 'express';
import type { PriceAnomalyResponse, Product, ScenarioId } from '@contracts/types';
import type { DataStore } from '../data/store';
import { forecastNextPrice } from '../domain/forecast';
import { NotFoundError } from '../errors';
import { parseOrThrow } from '../middleware/validate';
import { cached } from '../utils/cache';
import { priceQuerySchema, productParamSchema } from './schemas';

export function createPricesRouter(store: DataStore): Router {
  const router = Router();

  router.get('/:product/anomalies', (req, res) => {
    const { product: rawProduct } = parseOrThrow(productParamSchema, req.params);
    const query = parseOrThrow(priceQuerySchema, req.query);
    const scenarioId: ScenarioId = query.scenarioId ?? 'A';

    const match = Object.keys(store.loaded.priceHistory[scenarioId]).find(
      (candidate) => candidate.toLowerCase() === rawProduct.toLowerCase(),
    );
    if (!match) {
      throw new NotFoundError(
        `No price history for "${rawProduct}" in scenario ${scenarioId}. Available: ${Object.keys(
          store.loaded.priceHistory[scenarioId],
        ).join(', ')}`,
      );
    }
    const product = match as Product;

    const key = `prices:${store.revision}:${scenarioId}:${product}`;
    const response = cached(key, (): PriceAnomalyResponse => {
      const points = store.getPriceSeries(scenarioId, product);
      const info = store.getAnomalies(scenarioId)[product];
      const current = points[points.length - 1];
      return {
        scenarioId,
        product,
        simulated: true,
        points,
        current,
        flagged: info?.flagged ?? false,
        warning: info?.warning ?? null,
        thresholdZ: store.loaded.constraints.anomaly.thresholdZ,
        windowDays: store.loaded.constraints.anomaly.windowDays,
        robustReference: info?.robustReference ?? current.price,
        forecast: forecastNextPrice(store.getRawPriceHistory(scenarioId, product)),
      };
    });

    res.json(response);
  });

  return router;
}
