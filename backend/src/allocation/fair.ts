import type { Buyer, Farmer } from '@contracts/types';
import { demandMap, normalizeFlows, supplyMap, type Flow, type NetworkEdge } from './shared';

/**
 * Fairness-weighted allocator.
 *
 * It greedily maximises a concave welfare function:
 *   marginal utility of the next kg to buyer b = score_fb * (1 - fill_b)^2
 * so a buyer that is already well served has rapidly diminishing returns.
 * This is a heuristic for max-min fairness (not an exact LP), chosen because
 * every step is easy to explain and audit. Jain's index is reported alongside
 * the result so the trade-off is measurable.
 */
export function fairnessAllocate(
  edges: NetworkEdge[],
  farmers: Farmer[],
  buyers: Buyer[],
): Flow[] {
  const remainingSupply = supplyMap(farmers);
  const remainingDemand = demandMap(buyers);
  const buyerById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
  const allocatedByBuyer = new Map<string, number>();
  const flows: Flow[] = [];
  const skipped = new Set<string>();

  /** Small slice so several buyers advance together instead of one filling up. */
  const QUANTUM_KG = 10;
  const MAX_STEPS = 20_000;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    let best: NetworkEdge | null = null;
    let bestUtility = -1;

    for (const edge of edges) {
      if (skipped.has(edge.id)) continue;
      const supply = remainingSupply.get(edge.farmerId) ?? 0;
      const demand = remainingDemand.get(edge.buyerId) ?? 0;
      if (supply <= 0 || demand <= 0) continue;

      const buyer = buyerById.get(edge.buyerId);
      if (!buyer) continue;
      const fill = buyer.requiredQuantityKg > 0
        ? (allocatedByBuyer.get(edge.buyerId) ?? 0) / buyer.requiredQuantityKg
        : 0;
      const utility = edge.score * (1 - fill) ** 2;
      if (
        utility > bestUtility ||
        (utility === bestUtility && best !== null && edge.transportCostPerKg < best.transportCostPerKg)
      ) {
        best = edge;
        bestUtility = utility;
      }
    }

    if (!best || bestUtility <= 0) break;

    const supply = remainingSupply.get(best.farmerId) ?? 0;
    const demand = remainingDemand.get(best.buyerId) ?? 0;
    const buyer = buyerById.get(best.buyerId)!;
    const already = allocatedByBuyer.get(best.buyerId) ?? 0;

    // When opening a buyer, deliver at least one minimum lot; afterwards move in
    // small quanta so fill ratios stay close to each other.
    const desired = already === 0 ? Math.max(QUANTUM_KG, buyer.minAcceptableQuantityKg) : QUANTUM_KG;
    const chunk = Math.floor(Math.min(supply, demand, best.capacity, desired));

    if (chunk <= 0) {
      remainingSupply.set(best.farmerId, 0);
      continue;
    }
    if (already === 0 && chunk < buyer.minAcceptableQuantityKg) {
      // This edge cannot open the buyer; another farmer may supply a full lot.
      skipped.add(best.id);
      continue;
    }

    flows.push({ farmerId: best.farmerId, buyerId: best.buyerId, quantityKg: chunk });
    allocatedByBuyer.set(best.buyerId, already + chunk);
    remainingSupply.set(best.farmerId, supply - chunk);
    remainingDemand.set(best.buyerId, demand - chunk);
  }

  return normalizeFlows(flows);
}
