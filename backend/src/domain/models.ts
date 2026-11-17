/**
 * Convenience re-exports for backend domain code. The single source of truth
 * is `contracts/types.ts`, which is shared with the frontend.
 */
export type {
  AllocationKpis,
  AllocationRow,
  AllocationResponse,
  AnomalyInfo,
  Buyer,
  BlockedCorridor,
  Constraints,
  Farmer,
  FarmerSurplus,
  Match,
  Product,
  QualityGrade,
  ScenarioData,
  ScenarioId,
  ScenarioMeta,
  ScoreComponents,
  StrategyId,
  StrategyMetrics,
  Town,
  UnmetDemand,
  WeightVector,
} from '@contracts/types';
