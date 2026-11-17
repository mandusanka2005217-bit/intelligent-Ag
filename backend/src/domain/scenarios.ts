import type { Buyer, Farmer, ScenarioData, ScenarioId, ScenarioMeta } from '@contracts/types';
import type { LoadedData } from '../data/loader';

/** Assemble scenario metadata (including computed supply/demand totals). */
export function buildScenarioMeta(
  id: ScenarioId,
  loaded: LoadedData,
  farmers: Farmer[],
  buyers: Buyer[],
): ScenarioMeta {
  const descriptor = loaded.descriptors[id];
  return {
    id,
    name: descriptor.name,
    description: descriptor.description,
    simulated: true,
    disruption: descriptor.disruption,
    totals: {
      farmerCount: farmers.length,
      buyerCount: buyers.length,
      totalSupplyKg: farmers.reduce((total, farmer) => total + farmer.quantityKg, 0),
      totalDemandKg: buyers.reduce((total, buyer) => total + buyer.requiredQuantityKg, 0),
    },
  };
}

/** One-shot payload used by the frontend for maps, switchers and forms. */
export function buildScenarioData(
  id: ScenarioId,
  loaded: LoadedData,
  farmers: Farmer[],
  buyers: Buyer[],
): ScenarioData {
  return {
    scenario: buildScenarioMeta(id, loaded, farmers, buyers),
    farmers,
    buyers,
    locations: loaded.locations,
    marketPrices: loaded.marketPrices[id],
    constraints: loaded.constraints,
    defaultWeights: loaded.defaultWeights,
    simulated: true,
  };
}
