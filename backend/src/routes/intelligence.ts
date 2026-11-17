import { Router } from 'express';
import type { DataStore } from '../data/store';
import { generateDemandForecast } from '../forecasting/engine';
import { optimizeTransportationRoutes } from '../transportation/vrp';
import { evaluateFreshnessIntelligence } from '../freshness/engine';
import { evaluateSupplyRisk } from '../risk/engine';
import { generatePriceRecommendations } from '../pricing/engine';
import { runWhatIfSimulation } from '../simulation/engine';
import { calculateSustainabilityMetrics } from '../sustainability/engine';
import { runAllocationAnalysis, buildAllocationResponse } from '../domain/analysis';
import { parseOrThrow } from '../middleware/validate';
import { z } from 'zod';

const simulationBodySchema = z.object({
  supplyFactorPct: z.number().min(-90).max(100).optional(),
  demandFactorPct: z.number().min(-90).max(200).optional(),
  transportRateFactorPct: z.number().min(-50).max(200).optional(),
  disabledFarmerIds: z.array(z.string()).optional(),
});

function getAllocation(store: DataStore, scenarioId: any) {
  const run = runAllocationAnalysis(store, scenarioId, { strategy: 'min-cost-flow', shortagePolicy: 'score-priority' });
  return buildAllocationResponse(store, run, 'min-cost-flow', 'score-priority');
}

export function createIntelligenceRouter(store: DataStore): Router {
  const router = Router();

  // 1. Demand Forecasting
  router.get('/forecasting', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const horizon = Number(req.query.horizon) || 30;
    const buyers = store.listBuyers(scenarioId);
    const orders = store.listOrders();
    const result = generateDemandForecast(scenarioId, buyers, orders, horizon);
    res.json(result);
  });

  // 2. Transportation Optimization
  router.get('/transportation/optimize', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const allocation = getAllocation(store, scenarioId);
    const farmers = store.listFarmers(scenarioId);
    const buyers = store.listBuyers(scenarioId);
    const towns = store.getLocations();
    const result = optimizeTransportationRoutes(scenarioId, allocation.allocations, farmers, buyers, towns);
    res.json(result);
  });

  // 3. Freshness & Perishables Intelligence
  router.get('/freshness', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const farmers = store.listFarmers(scenarioId);
    const result = evaluateFreshnessIntelligence(scenarioId, farmers);
    res.json(result);
  });

  // 4. Supply Risk Monitoring
  router.get('/risk', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const farmers = store.listFarmers(scenarioId);
    const buyers = store.listBuyers(scenarioId);
    const result = evaluateSupplyRisk(scenarioId, farmers, buyers);
    res.json(result);
  });

  // 5. Intelligent Price Recommendations
  router.get('/pricing/recommendations', (req, res) => {
    const scenarioId: 'A' | 'B' = req.query.scenarioId === 'B' ? 'B' : 'A';
    const farmers = store.listFarmers(scenarioId);
    const buyers = store.listBuyers(scenarioId);
    const marketPrices = store.loaded.marketPrices[scenarioId] || {};
    const result = generatePriceRecommendations(scenarioId, farmers, buyers, marketPrices);
    res.json(result);
  });

  // 6. What-If Decision Simulator
  router.post('/simulation/run', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const body = parseOrThrow(simulationBodySchema, req.body, 'Simulation Parameters');
    const allocation = getAllocation(store, scenarioId);
    const farmers = store.listFarmers(scenarioId);
    const buyers = store.listBuyers(scenarioId);
    const result = runWhatIfSimulation(scenarioId, allocation, farmers, buyers, body);
    res.json(result);
  });

  // 7. Food Waste & Sustainability Analytics
  router.get('/sustainability', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const allocation = getAllocation(store, scenarioId);
    const farmers = store.listFarmers(scenarioId);
    const buyers = store.listBuyers(scenarioId);
    const towns = store.getLocations();
    const transport = optimizeTransportationRoutes(scenarioId, allocation.allocations, farmers, buyers, towns);
    const result = calculateSustainabilityMetrics(scenarioId, allocation, transport);
    res.json(result);
  });

  return router;
}
