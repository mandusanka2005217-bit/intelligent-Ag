// Allocation feature types. The single source of truth is contracts/types.ts.
export type {
  AllocationRow,
  AllocationResponse,
  AllocationKpis,
  UnmetDemand,
  FarmerSurplus,
  StrategyId,
  ShortagePolicy,
  ScoreComponents,
} from '@contracts/types';

/** Alias retained for the original stub's imports. */
export type { AllocationRow as Allocation } from '@contracts/types';

export interface AllocationFilters {
  strategy?: import('@contracts/types').StrategyId;
  shortagePolicy?: import('@contracts/types').ShortagePolicy;
}
