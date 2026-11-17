import type { Buyer, Constraints, Farmer, StrategyId } from '@contracts/types';
import type { FeasiblePair } from '../domain/matching';
import { jainsFairnessIndex, round } from '../utils/math';

/** A feasible farmer -> buyer edge in the transportation network. */
export interface NetworkEdge {
  id: string;
  farmerId: string;
  buyerId: string;
  capacity: number;
  /** Integer disutility in milli-Rs per kg (see edgeDisutility). */
  cost: number;
  score: number;
  transportCostPerKg: number;
}

export interface Flow {
  farmerId: string;
  buyerId: string;
  quantityKg: number;
}

export interface EngineResult {
  flows: Flow[];
  algorithm: string;
  augmentations: number;
  totalEdgeCost: number;
  minLotRepairs: number;
}

export interface AllocationInput {
  farmers: Farmer[];
  buyers: Buyer[];
  feasible: FeasiblePair[];
  constraints: Constraints;
  shortagePolicy: 'score-priority' | 'proportional';
}

/**
 * Per-kg disutility used as the min-cost-flow edge cost:
 *   u = V * (1 - score/100) + transport cost per kg
 * with V = scoreValuePerKg (Rs). A 10-point score loss is therefore worth
 * Rs 2/kg at the default V = 20, while 150 km of transport costs Rs 1.80/kg.
 * Multiplying by 1000 keeps the solver in integers.
 */
export function edgeDisutility(score: number, transportCostPerKg: number, valuePerKg: number): number {
  return Math.round((valuePerKg * (1 - score / 100) + transportCostPerKg) * 1000);
}

export function buildEdges(feasible: FeasiblePair[], constraints: Constraints): NetworkEdge[] {
  return feasible.map(({ farmer, buyer, pair }) => ({
    id: `${farmer.id}->${buyer.id}`,
    farmerId: farmer.id,
    buyerId: buyer.id,
    capacity: Math.min(farmer.quantityKg, buyer.requiredQuantityKg),
    cost: edgeDisutility(pair.score, pair.transportCostPerKg, constraints.scoreValuePerKg),
    score: pair.score,
    transportCostPerKg: pair.transportCostPerKg,
  }));
}

export function supplyMap(farmers: Farmer[]): Map<string, number> {
  return new Map(farmers.map((farmer) => [farmer.id, farmer.quantityKg]));
}

export function demandMap(buyers: Buyer[]): Map<string, number> {
  return new Map(buyers.map((buyer) => [buyer.id, buyer.requiredQuantityKg]));
}

/** Sum flows by key and drop zero rows. */
export function normalizeFlows(flows: Flow[]): Flow[] {
  const map = new Map<string, Flow>();
  for (const flow of flows) {
    if (flow.quantityKg <= 0) continue;
    const key = flowKey(flow.farmerId, flow.buyerId);
    const existing = map.get(key);
    if (existing) existing.quantityKg += flow.quantityKg;
    else map.set(key, { ...flow });
  }
  return [...map.values()].map((flow) => ({
    farmerId: flow.farmerId,
    buyerId: flow.buyerId,
    quantityKg: Math.round(flow.quantityKg),
  }));
}

export function flowKey(farmerId: string, buyerId: string): string {
  return `${farmerId}->${buyerId}`;
}

/** Proportional per-product targets: each buyer is promised min(Q, rho*Q). */
export function proportionalTargets(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
): Map<string, number> {
  const targets = new Map<string, number>();
  const usableSupply = new Map<string, number>();
  const demand = new Map<string, number>();

  const buyersWithEdge = new Map<string, Set<string>>();
  for (const edge of edges) {
    const set = buyersWithEdge.get(edge.farmerId) ?? new Set<string>();
    set.add(edge.buyerId);
    buyersWithEdge.set(edge.farmerId, set);
  }

  for (const farmer of farmers) {
    if (buyersWithEdge.has(farmer.id)) {
      usableSupply.set(farmer.cropType, (usableSupply.get(farmer.cropType) ?? 0) + farmer.quantityKg);
    }
  }
  for (const buyer of buyers) {
    demand.set(buyer.requiredCropType, (demand.get(buyer.requiredCropType) ?? 0) + buyer.requiredQuantityKg);
  }

  const rho = new Map<string, number>();
  for (const [product, demandKg] of demand) {
    const supplyKg = usableSupply.get(product) ?? 0;
    rho.set(product, demandKg > 0 ? Math.min(1, supplyKg / demandKg) : 0);
  }

  for (const buyer of buyers) {
    const ratio = rho.get(buyer.requiredCropType) ?? 0;
    if (ratio >= 1) {
      targets.set(buyer.id, buyer.requiredQuantityKg);
      continue;
    }
    const target = Math.floor(buyer.requiredQuantityKg * ratio);
    targets.set(buyer.id, target >= buyer.minAcceptableQuantityKg ? target : 0);
  }
  return targets;
}

/**
 * Minimum-lot repair.
 *
 * The network model cannot express "a buyer accepts either nothing or at least
 * L kg" without lower bounds. This pass removes sub-lot deliveries, returns
 * those kg to the supply pool, and reallocates them to buyers that can accept
 * a full consignment. It runs at most three times and reports how many buyers
 * were dropped, so the behaviour is visible rather than hidden.
 */
export function repairMinLots(
  flows: Flow[],
  farmers: Farmer[],
  buyers: Buyer[],
  edges: NetworkEdge[],
): { flows: Flow[]; minLotRepairs: number } {
  const buyerById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
  let current = normalizeFlows(flows);
  let repairs = 0;
  const dropped = new Set<string>();

  for (let pass = 0; pass < 3; pass += 1) {
    const totals = new Map<string, number>();
    for (const flow of current) {
      totals.set(flow.buyerId, (totals.get(flow.buyerId) ?? 0) + flow.quantityKg);
    }

    const offenders = [...totals.entries()]
      .filter(([buyerId, total]) => {
        const buyer = buyerById.get(buyerId);
        return buyer !== undefined && total > 0 && total < buyer.minAcceptableQuantityKg;
      })
      .map(([buyerId]) => buyerId);
    if (offenders.length === 0) break;

    for (const buyerId of offenders) {
      dropped.add(buyerId);
      repairs += 1;
    }
    current = current.filter((flow) => !dropped.has(flow.buyerId));

    // Rebuild remaining capacities and top up with score-greedy.
    const remainingSupply = supplyMap(farmers);
    const remainingDemand = demandMap(buyers);
    for (const buyerId of dropped) remainingDemand.set(buyerId, 0);
    for (const flow of current) {
      remainingSupply.set(flow.farmerId, (remainingSupply.get(flow.farmerId) ?? 0) - flow.quantityKg);
      remainingDemand.set(flow.buyerId, (remainingDemand.get(flow.buyerId) ?? 0) - flow.quantityKg);
    }

    const sorted = [...edges].sort((a, b) => b.score - a.score || a.transportCostPerKg - b.transportCostPerKg);
    for (const edge of sorted) {
      const supply = remainingSupply.get(edge.farmerId) ?? 0;
      const demand = remainingDemand.get(edge.buyerId) ?? 0;
      const buyer = buyerById.get(edge.buyerId);
      if (!buyer || supply <= 0 || demand <= 0) continue;

      const chunk = Math.min(supply, demand, edge.capacity);
      const already = current
        .filter((flow) => flow.buyerId === edge.buyerId)
        .reduce((total, flow) => total + flow.quantityKg, 0);
      // Do not open a buyer with a sub-lot delivery.
      if (already === 0 && chunk < buyer.minAcceptableQuantityKg) continue;

      if (chunk <= 0) continue;
      current.push({ farmerId: edge.farmerId, buyerId: edge.buyerId, quantityKg: chunk });
      remainingSupply.set(edge.farmerId, supply - chunk);
      remainingDemand.set(edge.buyerId, demand - chunk);
    }
    current = normalizeFlows(current);
  }

  return { flows: current, minLotRepairs: repairs };
}

export interface FlowSummary {
  totalAllocatedKg: number;
  totalDemandKg: number;
  fillRate: number;
  avgSuitability: number;
  totalTransportCostRs: number;
  jainIndex: number;
  minFillRate: number;
  maxFillRate: number;
  fullyServedBuyers: number;
  partiallyServedBuyers: number;
  unservedBuyers: number;
}

/** Metrics shared by the allocation response and strategy comparison. */
export function summarizeFlows(
  flows: Flow[],
  buyers: Buyer[],
  edgeByKey: Map<string, NetworkEdge>,
): FlowSummary {
  const allocated = new Map<string, number>();
  let totalAllocatedKg = 0;
  let weightedScore = 0;
  let transport = 0;

  for (const flow of flows) {
    const edge = edgeByKey.get(flowKey(flow.farmerId, flow.buyerId));
    if (!edge) continue;
    allocated.set(flow.buyerId, (allocated.get(flow.buyerId) ?? 0) + flow.quantityKg);
    totalAllocatedKg += flow.quantityKg;
    weightedScore += flow.quantityKg * edge.score;
    transport += flow.quantityKg * edge.transportCostPerKg;
  }

  const fillRates = buyers.map((buyer) => {
    const received = allocated.get(buyer.id) ?? 0;
    return buyer.requiredQuantityKg > 0 ? received / buyer.requiredQuantityKg : 0;
  });
  const totalDemandKg = buyers.reduce((total, buyer) => total + buyer.requiredQuantityKg, 0);

  return {
    totalAllocatedKg,
    totalDemandKg,
    fillRate: totalDemandKg > 0 ? round(totalAllocatedKg / totalDemandKg, 4) : 0,
    avgSuitability: totalAllocatedKg > 0 ? round(weightedScore / totalAllocatedKg, 2) : 0,
    totalTransportCostRs: round(transport, 2),
    jainIndex: jainsFairnessIndex(fillRates),
    minFillRate: fillRates.length ? round(Math.min(...fillRates), 4) : 0,
    maxFillRate: fillRates.length ? round(Math.max(...fillRates), 4) : 0,
    fullyServedBuyers: fillRates.filter((rate) => rate >= 0.999).length,
    partiallyServedBuyers: fillRates.filter((rate) => rate > 0 && rate < 0.999).length,
    unservedBuyers: fillRates.filter((rate) => rate === 0).length,
  };
}
