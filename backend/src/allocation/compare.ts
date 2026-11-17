import type { StrategyId, StrategyMetrics } from '@contracts/types';
import { STRATEGY_DESCRIPTIONS, STRATEGY_LABELS } from '../domain/constants';
import { round } from '../utils/math';
import { fairnessAllocate } from './fair';
import { greedyAllocate } from './greedy';
import { minCostFlowAllocate } from './minCostFlow';
import {
  buildEdges,
  flowKey,
  repairMinLots,
  summarizeFlows,
  type AllocationInput,
  type EngineResult,
  type NetworkEdge,
} from './shared';

export interface StrategyExecution {
  result: EngineResult;
  edges: NetworkEdge[];
  edgeByKey: Map<string, NetworkEdge>;
  runtimeMs: number;
}

/** Execute one allocation strategy end-to-end, including minimum-lot repair. */
export function executeStrategy(input: AllocationInput, strategy: StrategyId): StrategyExecution {
  const started = performance.now();
  const edges = buildEdges(input.feasible, input.constraints);
  const edgeByKey = new Map(edges.map((edge) => [flowKey(edge.farmerId, edge.buyerId), edge]));

  let flows;
  let algorithm: string;
  let augmentations = 0;

  if (strategy === 'greedy') {
    flows = greedyAllocate(edges, input.farmers, input.buyers, input.shortagePolicy);
    algorithm = 'Greedy by score';
    augmentations = flows.length;
  } else if (strategy === 'min-cost-flow') {
    const solved = minCostFlowAllocate(edges, input.farmers, input.buyers, input.shortagePolicy);
    flows = solved.flows;
    augmentations = solved.augmentations;
    algorithm = 'Min-cost max-flow (successive shortest paths, SPFA)';
  } else {
    flows = fairnessAllocate(edges, input.farmers, input.buyers);
    algorithm = 'Fairness-weighted concave welfare (greedy)';
    augmentations = flows.length;
  }

  const repaired = repairMinLots(flows, input.farmers, input.buyers, edges);
  const totalEdgeCost = repaired.flows.reduce((total, flow) => {
    const edge = edgeByKey.get(flowKey(flow.farmerId, flow.buyerId));
    return total + (edge ? edge.cost * flow.quantityKg : 0);
  }, 0);

  return {
    result: {
      flows: repaired.flows,
      algorithm,
      augmentations,
      totalEdgeCost,
      minLotRepairs: repaired.minLotRepairs,
    },
    edges,
    edgeByKey,
    runtimeMs: round(performance.now() - started, 2),
  };
}

export function metricsFor(
  input: AllocationInput,
  execution: StrategyExecution,
  strategy: StrategyId,
): StrategyMetrics {
  const summary = summarizeFlows(execution.result.flows, input.buyers, execution.edgeByKey);
  return {
    strategy,
    label: STRATEGY_LABELS[strategy],
    description: STRATEGY_DESCRIPTIONS[strategy],
    ...summary,
    runtimeMs: execution.runtimeMs,
  };
}

export interface StrategyComparisonResult {
  results: StrategyMetrics[];
  tradeoffs: string[];
}

/**
 * Run all three allocators on the same candidate graph and compare them with
 * independent metrics. No strategy is declared an unconditional winner: the
 * trade-off sentences explain what each one buys you.
 */
export function compareStrategies(input: AllocationInput): StrategyComparisonResult {
  const strategies: StrategyId[] = ['greedy', 'min-cost-flow', 'fairness'];
  const results = strategies.map((strategy) =>
    metricsFor(input, executeStrategy(input, strategy), strategy),
  );

  const tradeoffs: string[] = [];
  const greedy = results.find((result) => result.strategy === 'greedy')!;
  const flow = results.find((result) => result.strategy === 'min-cost-flow')!;
  const fair = results.find((result) => result.strategy === 'fairness')!;

  const scoreDiff = round(flow.avgSuitability - greedy.avgSuitability, 2);
  if (scoreDiff > 0.05) {
    tradeoffs.push(
      `Min-cost flow improves the weighted suitability of the greedy plan by ${scoreDiff} points while keeping the same total kg (${flow.totalAllocatedKg} kg).`,
    );
  } else if (scoreDiff < -0.05) {
    tradeoffs.push(
      `Greedy happens to score ${Math.abs(scoreDiff)} points higher than min-cost flow here, but only because it ignores transport cost.`,
    );
  } else {
    tradeoffs.push(
      `Greedy and min-cost flow reach the same weighted suitability (${flow.avgSuitability}); min-cost flow additionally minimises transport cost (Rs ${flow.totalTransportCostRs}).`,
    );
  }

  const jainDiff = round(fair.jainIndex - flow.jainIndex, 4);
  if (jainDiff > 0.005) {
    const scoreCost = round(flow.avgSuitability - fair.avgSuitability, 2);
    tradeoffs.push(
      `Fairness raises Jain's index from ${flow.jainIndex} to ${fair.jainIndex} at a cost of ${Math.max(
        0,
        scoreCost,
      )} suitability points — the classic efficiency vs equity trade-off.`,
    );
  } else {
    tradeoffs.push(
      `Fairness does not improve Jain's index here (${fair.jainIndex} vs ${flow.jainIndex}); supply is too scarce for redistribution to help.`,
    );
  }

  const minTransport = Math.min(...results.map((result) => result.totalTransportCostRs));
  const cheapest = results.filter(
    (result) => Math.abs(result.totalTransportCostRs - minTransport) < 0.01,
  );
  if (cheapest.length === results.length) {
    tradeoffs.push(
      `All three strategies have the same transport bill (Rs ${round(minTransport, 2)}) on this instance.`,
    );
  } else if (cheapest.length > 1) {
    tradeoffs.push(
      `${cheapest.map((result) => result.label).join(' and ')} tie for the lowest transport bill (Rs ${round(
        minTransport,
        2,
      )}) on this instance.`,
    );
  } else {
    tradeoffs.push(
      `${cheapest[0].label} has the lowest transport bill (Rs ${round(minTransport, 2)}) on this instance.`,
    );
  }

  return { results, tradeoffs };
}
