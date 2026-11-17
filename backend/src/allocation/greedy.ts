import type { Buyer, Farmer } from '@contracts/types';
import {
  demandMap,
  flowKey,
  normalizeFlows,
  proportionalTargets,
  supplyMap,
  type Flow,
  type NetworkEdge,
} from './shared';

function sortEdges(edges: NetworkEdge[]): NetworkEdge[] {
  return [...edges].sort(
    (a, b) => b.score - a.score || a.transportCostPerKg - b.transportCostPerKg || a.id.localeCompare(b.id),
  );
}

function buyerTotals(flows: Flow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const flow of flows) {
    totals.set(flow.buyerId, (totals.get(flow.buyerId) ?? 0) + flow.quantityKg);
  }
  return totals;
}

/**
 * Allocate greedily in score order until every buyer limit is reached.
 * Returns the allocations ADDED by this pass (caller merges them).
 */
function allocatePass(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
  alreadyAllocated: Map<string, number>,
  buyerLimit: Map<string, number>,
): Flow[] {
  const remainingSupply = supplyMap(farmers);
  const buyerById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
  const allocatedBefore = new Map<string, number>();

  for (const [key, quantity] of alreadyAllocated) {
    const [farmerId] = key.split('->');
    remainingSupply.set(farmerId, (remainingSupply.get(farmerId) ?? 0) - quantity);
    const buyerId = key.split('->')[1];
    allocatedBefore.set(buyerId, (allocatedBefore.get(buyerId) ?? 0) + quantity);
  }

  const added: Flow[] = [];
  const addedByBuyer = new Map<string, number>();

  for (const edge of sortEdges(edges)) {
    const supply = remainingSupply.get(edge.farmerId) ?? 0;
    const buyer = buyerById.get(edge.buyerId);
    if (!buyer || supply <= 0) continue;

    const before = allocatedBefore.get(edge.buyerId) ?? 0;
    const addedSoFar = addedByBuyer.get(edge.buyerId) ?? 0;
    const limit = Math.min(buyerLimit.get(edge.buyerId) ?? buyer.requiredQuantityKg, buyer.requiredQuantityKg);

    const remainingDemand = buyer.requiredQuantityKg - before - addedSoFar;
    const remainingLimit = limit - before - addedSoFar;
    const chunk = Math.floor(Math.min(supply, remainingDemand, remainingLimit, edge.capacity));
    if (chunk <= 0) continue;

    // Never open a buyer with a consignment below its minimum.
    if (before + addedSoFar === 0 && chunk < buyer.minAcceptableQuantityKg) continue;

    added.push({ farmerId: edge.farmerId, buyerId: edge.buyerId, quantityKg: chunk });
    addedByBuyer.set(edge.buyerId, addedSoFar + chunk);
    remainingSupply.set(edge.farmerId, supply - chunk);
  }

  return added;
}

/**
 * Greedy-by-score allocator.
 *
 * `score-priority` fills every buyer by ranking alone.
 * `proportional` first fills each buyer's fair-share target (rho * demand),
 * then distributes whatever is left by score. This is the selectable shortage
 * policy required by the brief.
 */
export function greedyAllocate(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
  policy: 'score-priority' | 'proportional',
): Flow[] {
  const fullLimits = demandMap(buyers);
  const empty = new Map<string, number>();

  if (policy === 'score-priority') {
    return normalizeFlows(allocatePass(edges, farmers, buyers, empty, fullLimits));
  }

  const targets = proportionalTargets(edges, farmers, buyers);
  const first = allocatePass(edges, farmers, buyers, empty, targets);
  const merged = normalizeFlows(first);
  const allocated = new Map<string, number>();
  for (const flow of merged) {
    allocated.set(flowKey(flow.farmerId, flow.buyerId), flow.quantityKg);
  }
  const leftover = allocatePass(edges, farmers, buyers, allocated, fullLimits);
  return normalizeFlows([...merged, ...leftover]);
}

/** Top up unused supply after another allocator has run. */
export function topUpGreedy(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
  existing: Flow[],
): Flow[] {
  const allocated = new Map<string, number>();
  for (const flow of existing) {
    allocated.set(flowKey(flow.farmerId, flow.buyerId), flow.quantityKg);
  }
  const extra = allocatePass(edges, farmers, buyers, allocated, demandMap(buyers));
  return normalizeFlows([...existing, ...extra]);
}

/** Exposed for tests: total allocation per buyer. */
export function allocatedByBuyer(flows: Flow[]): Map<string, number> {
  return buyerTotals(flows);
}
