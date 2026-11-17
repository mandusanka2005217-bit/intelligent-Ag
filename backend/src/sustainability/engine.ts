import type {
  AllocationResponse,
  ScenarioId,
  SustainabilityResponse,
  TransportationOptimizationResponse,
} from '@contracts/types';
import { round } from '../utils/math';

const CO2_KG_PER_LITER_DIESEL = 2.68;
const KM_PER_LITER_DIESEL = 3.8;
const BASELINE_SPOILAGE_RATE_PCT = 18.5; // Traditional fragmented agricultural waste in Sri Lanka is ~18-25%

/**
 * Food Waste & Sustainability Analytics Engine
 * Quantifies produce saved from post-harvest rot via prompt algorithmic matching and
 * transport carbon emissions avoided via multi-stop route optimization.
 */
export function calculateSustainabilityMetrics(
  scenarioId: ScenarioId,
  allocation: AllocationResponse,
  transportOptimization: TransportationOptimizationResponse,
): SustainabilityResponse {
  const totalAllocated = allocation.kpis.totalAllocatedKg;
  const unallocatedProduce = Math.max(0, allocation.kpis.totalSupplyKg - totalAllocated);

  // Avoided food waste: intelligent allocation matching prevents traditional shelf decay
  const estimatedSpoilageAvoided = round(totalAllocated * (BASELINE_SPOILAGE_RATE_PCT / 100), 1);
  const wasteAvoidancePct = round(BASELINE_SPOILAGE_RATE_PCT, 1);

  // Transportation and emissions
  const optimizedDistanceKm = transportOptimization.optimized.totalDistanceKm;
  const distanceSavedKm = transportOptimization.optimized.distanceSavedKm;

  const fuelLitersUsed = optimizedDistanceKm / KM_PER_LITER_DIESEL;
  const fuelLitersSaved = distanceSavedKm / KM_PER_LITER_DIESEL;

  const co2EmissionsKg = round(fuelLitersUsed * CO2_KG_PER_LITER_DIESEL, 1);
  const co2SavedKg = round(fuelLitersSaved * CO2_KG_PER_LITER_DIESEL, 1);

  return {
    scenarioId,
    metrics: {
      totalProduceAllocatedKg: round(totalAllocated, 1),
      unallocatedProduceKg: round(unallocatedProduce, 1),
      estimatedSpoilageAvoidedKg: estimatedSpoilageAvoided,
      wasteAvoidancePct,
      totalOptimizedDistanceKm: round(optimizedDistanceKm, 1),
      distanceSavedKm: round(distanceSavedKm, 1),
      estimatedCo2EmissionsKg: co2EmissionsKg,
      co2EmissionsSavedKg: co2SavedKg,
    },
    assumptions: {
      fuelEconomyKmPerL: KM_PER_LITER_DIESEL,
      co2KgPerLiterDiesel: CO2_KG_PER_LITER_DIESEL,
      baselineSpoilageRatePct: BASELINE_SPOILAGE_RATE_PCT,
    },
  };
}
