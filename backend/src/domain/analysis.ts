import type {
  AllocationResponse,
  AllocationRow,
  AnomalyInfo,
  Buyer,
  Farmer,
  Match,
  MatchesResponse,
  ScenarioId,
  ShortagePolicy,
  StrategyId,
  StrategyMetrics,
  UnmetDemand,
  FarmerSurplus,
  WeightVector,
} from '@contracts/types';
import type { DataStore } from '../data/store';
import { compareStrategies, executeStrategy, metricsFor, type StrategyExecution } from '../allocation/compare';
import type { AllocationInput } from '../allocation/shared';
import { summarizeFlows } from '../allocation/shared';
import { buildExplanation, buildReasons, summarizeUnmetIssues } from './explain';
import { generateMatches, type FeasiblePair, type MatchGenerationResult } from './matching';
import { normalizeWeights, scorePair, type ScoringContext } from './scoring';
import { round } from '../utils/math';

export interface AnalysisWeights {
  weights?: Partial<WeightVector>;
}

export function buildScoringContext(
  store: DataStore,
  scenarioId: ScenarioId,
  constraints = store.getBaseConstraints(),
): ScoringContext {
  return {
    towns: store.getLocations(),
    constraints,
    marketPrices: store.loaded.marketPrices[scenarioId],
    anomalies: store.getAnomalies(scenarioId),
    blockedCorridors: store.loaded.descriptors[scenarioId].disruption.blockedCorridors,
  };
}

function anomaliesFor(store: DataStore, scenarioId: ScenarioId): AnomalyInfo[] {
  return Object.values(store.getAnomalies(scenarioId));
}

export interface MatchingRun {
  scenarioId: ScenarioId;
  farmers: Farmer[];
  buyers: Buyer[];
  context: ScoringContext;
  weights: WeightVector;
  result: MatchGenerationResult;
}

/** Shared front half of matching and allocation. */
export function runMatchingAnalysis(
  store: DataStore,
  scenarioId: ScenarioId,
  weights: Partial<WeightVector> | undefined,
  minScore = 0,
  limit = 200,
  constraints = store.getBaseConstraints(),
): MatchingRun {
  const farmers = store.getFarmers(scenarioId);
  const buyers = store.getBuyers(scenarioId);
  const context = buildScoringContext(store, scenarioId, constraints);
  const normalizedWeights = normalizeWeights(weights, store.getDefaultWeights());
  const result = generateMatches({
    scenarioId,
    farmers,
    buyers,
    context,
    weights: normalizedWeights,
    defaultWeights: store.getDefaultWeights(),
    minScore,
    limit,
  });
  return { scenarioId, farmers, buyers, context, weights: normalizedWeights, result };
}

export function buildMatchesResponse(run: MatchingRun): MatchesResponse {
  return {
    scenarioId: run.scenarioId,
    simulated: true,
    generatedAt: new Date().toISOString(),
    weights: run.weights,
    matches: run.result.matches,
    summary: run.result.summary,
    anomalies: anomaliesForStore(run),
  };
}

function anomaliesForStore(run: MatchingRun): AnomalyInfo[] {
  return Object.values(run.context.anomalies);
}

export interface AllocationRun {
  matching: MatchingRun;
  input: AllocationInput;
  execution: StrategyExecution;
  metrics: StrategyMetrics;
}

export interface AllocationOptions {
  weights?: Partial<WeightVector>;
  strategy?: StrategyId;
  shortagePolicy?: ShortagePolicy;
  constraints?: Partial<import('@contracts/types').Constraints>;
}

/** Run one allocator on a freshly scored candidate graph. */
export function runAllocationAnalysis(
  store: DataStore,
  scenarioId: ScenarioId,
  options: AllocationOptions = {},
): AllocationRun {
  const constraints = store.mergeConstraints(options.constraints);
  const matching = runMatchingAnalysis(
    store,
    scenarioId,
    options.weights,
    0,
    200,
    constraints,
  );
  const input: AllocationInput = {
    farmers: matching.farmers,
    buyers: matching.buyers,
    feasible: matching.result.feasiblePairs,
    constraints,
    shortagePolicy: options.shortagePolicy ?? 'score-priority',
  };
  const strategy = options.strategy ?? 'min-cost-flow';
  const execution = executeStrategy(input, strategy);
  const metrics = metricsFor(input, execution, strategy);
  return { matching, input, execution, metrics };
}

/** Map internal flows to the API's explainable allocation rows. */
export function buildAllocationResponse(
  store: DataStore,
  run: AllocationRun,
  strategy: StrategyId,
  shortagePolicy: ShortagePolicy,
): AllocationResponse {
  const { matching, execution, metrics, input } = run;
  const pairByKey = new Map<string, FeasiblePair>(
    matching.result.feasiblePairs.map((pair) => [
      `${pair.farmer.id}->${pair.buyer.id}`,
      pair,
    ]),
  );

  const allocations: AllocationRow[] = execution.result.flows
    .map((flow) => {
      const pair = pairByKey.get(`${flow.farmerId}->${flow.buyerId}`);
      if (!pair) return null;
      const { farmer, buyer } = pair;
      const row: AllocationRow = {
        id: `${farmer.id}->${buyer.id}`,
        farmerId: farmer.id,
        farmerName: farmer.name,
        buyerId: buyer.id,
        buyerName: buyer.name,
        cropType: farmer.cropType,
        quantityKg: flow.quantityKg,
        pricePerKg: farmer.pricePerKg,
        marketPrice: pair.pair.marketReference,
        suitabilityScore: pair.pair.score,
        components: pair.pair.components!,
        distanceKm: pair.pair.distanceKm,
        transportCostPerKg: pair.pair.transportCostPerKg,
        transportCostRs: round(flow.quantityKg * pair.pair.transportCostPerKg, 2),
        reasons: buildReasons(farmer, buyer, pair.pair),
        explanation: buildExplanation(farmer, buyer, pair.pair, {
          verb: 'chosen',
          betterSupplies: pair.betterSupplies,
        }),
        priceAnomaly: pair.pair.anomaly,
      };
      return row;
    })
    .filter((row): row is AllocationRow => row !== null)
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore || b.quantityKg - a.quantityKg);

  const allocatedByBuyer = new Map<string, number>();
  const allocatedByFarmer = new Map<string, number>();
  for (const flow of execution.result.flows) {
    allocatedByBuyer.set(flow.buyerId, (allocatedByBuyer.get(flow.buyerId) ?? 0) + flow.quantityKg);
    allocatedByFarmer.set(flow.farmerId, (allocatedByFarmer.get(flow.farmerId) ?? 0) + flow.quantityKg);
  }

  const unmetDemand: UnmetDemand[] = [];
  for (const buyer of input.buyers) {
    const allocatedKg = allocatedByBuyer.get(buyer.id) ?? 0;
    const unmetKg = Math.max(0, buyer.requiredQuantityKg - allocatedKg);
    if (unmetKg <= 0) continue;
    const issueReasons = summarizeUnmetIssues(matching.result.buyerIssues[buyer.id] ?? []);
    unmetDemand.push({
      buyerId: buyer.id,
      buyerName: buyer.name,
      cropType: buyer.requiredCropType,
      location: buyer.location,
      requiredKg: buyer.requiredQuantityKg,
      allocatedKg,
      unmetKg,
      fillRatio: round(allocatedKg / buyer.requiredQuantityKg, 4),
      reasons: [
        `Only ${allocatedKg} kg of ${buyer.requiredQuantityKg} kg could be sourced under the hard constraints.`,
        ...issueReasons,
      ],
    });
  }

  const farmerSurplus: FarmerSurplus[] = input.farmers.map((farmer) => {
    const allocatedKg = allocatedByFarmer.get(farmer.id) ?? 0;
    return {
      farmerId: farmer.id,
      farmerName: farmer.name,
      cropType: farmer.cropType,
      location: farmer.location,
      availableKg: farmer.quantityKg,
      allocatedKg,
      surplusKg: Math.max(0, farmer.quantityKg - allocatedKg),
    };
  });

  const totalSupplyKg = input.farmers.reduce((total, farmer) => total + farmer.quantityKg, 0);
  const totalDemandKg = input.buyers.reduce((total, buyer) => total + buyer.requiredQuantityKg, 0);

  return {
    scenarioId: matching.scenarioId,
    simulated: true,
    generatedAt: new Date().toISOString(),
    strategy,
    strategyLabel: metrics.label,
    shortagePolicy,
    weights: matching.weights,
    allocations,
    kpis: {
      totalSupplyKg,
      totalDemandKg,
      totalAllocatedKg: metrics.totalAllocatedKg,
      unmetDemandKg: Math.max(0, totalDemandKg - metrics.totalAllocatedKg),
      fillRate: metrics.fillRate,
      avgSuitability: metrics.avgSuitability,
      totalTransportCostRs: metrics.totalTransportCostRs,
      jainIndex: metrics.jainIndex,
      fullyServedBuyers: metrics.fullyServedBuyers,
      partiallyServedBuyers: metrics.partiallyServedBuyers,
      unservedBuyers: metrics.unservedBuyers,
      farmerCount: input.farmers.length,
      buyerCount: input.buyers.length,
      feasibleEdges: matching.result.summary.feasiblePairs,
      runtimeMs: execution.runtimeMs,
    },
    unmetDemand,
    farmerSurplus,
    anomalies: anomaliesForStore(matching),
    solver: {
      algorithm: execution.result.algorithm,
      augmentations: execution.result.augmentations,
      totalEdgeCost: execution.result.totalEdgeCost,
      minLotRepairs: execution.result.minLotRepairs,
    },
  };
}

/** Compare all strategies on exactly the same candidates. */
export function runComparison(store: DataStore, scenarioId: ScenarioId, options: AllocationOptions) {
  const constraints = store.mergeConstraints(options.constraints);
  const matching = runMatchingAnalysis(store, scenarioId, options.weights, 0, 200, constraints);
  const input: AllocationInput = {
    farmers: matching.farmers,
    buyers: matching.buyers,
    feasible: matching.result.feasiblePairs,
    constraints,
    shortagePolicy: options.shortagePolicy ?? 'score-priority',
  };
  const comparison = compareStrategies(input);
  return { comparison, weights: matching.weights };
}

/** Summary helpers used by the legacy dashboard endpoints. */
export function buildDashboardSummary(store: DataStore, scenarioId: ScenarioId) {
  const matching = runMatchingAnalysis(store, scenarioId, undefined);
  const allocation = runAllocationAnalysis(store, scenarioId, { strategy: 'min-cost-flow' });
  const summary = summarizeFlows(
    allocation.execution.result.flows,
    allocation.input.buyers,
    allocation.execution.edgeByKey,
  );

  const scoreBuckets = Array.from({ length: 10 }, (_, index) => ({
    range: `${index * 10}-${index * 10 + 10}`,
    count: 0,
  }));
  for (const match of matching.result.matches) {
    const bucket = Math.min(9, Math.floor(match.suitabilityScore / 10));
    scoreBuckets[bucket].count += 1;
  }

  const distancePrice = matching.result.feasiblePairs.map((pair) => ({
    farmerId: pair.farmer.id,
    farmerName: pair.farmer.name,
    buyerName: pair.buyer.name,
    distanceKm: pair.pair.distanceKm,
    pricePerKg: pair.farmer.pricePerKg,
    cropType: pair.farmer.cropType,
    score: pair.pair.score,
  }));

  const breakdownMap = new Map<string, number>();
  for (const row of allocation.execution.result.flows) {
    const pair = allocation.input.feasible.find(
      (candidate) => candidate.farmer.id === row.farmerId && candidate.buyer.id === row.buyerId,
    );
    if (!pair) continue;
    breakdownMap.set(pair.farmer.cropType, (breakdownMap.get(pair.farmer.cropType) ?? 0) + row.quantityKg);
  }

  return {
    stats: {
      totalFarmers: matching.farmers.length,
      totalBuyers: matching.buyers.length,
      totalMatches: matching.result.summary.feasiblePairs,
      avgSuitabilityScore: matching.result.summary.avgScore,
      totalAllocatedKg: summary.totalAllocatedKg,
      // Share of offered supply that actually moved. This is deliberately
      // distinct from fillRate (share of demand satisfied): in a shortage the
      // two diverge sharply and the dashboard shows both.
      avgUtilizationPct: round(
        summary.totalAllocatedKg /
          Math.max(
            1,
            matching.farmers.reduce((total, farmer) => total + farmer.quantityKg, 0),
          ),
        4,
      ),
      fillRate: summary.fillRate,
      totalTransportCostRs: summary.totalTransportCostRs,
      jainIndex: summary.jainIndex,
    },
    scoreDistribution: scoreBuckets,
    distancePrice,
    allocationBreakdown: [...breakdownMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    matches: matching.result.matches as Match[],
    allocation,
  };
}
