// Allocation feature TypeScript type definitions
import type { Match } from '../matching/types';

export interface Allocation {
  id: number;
  matchId: number;
  match?: Match; // populated on detailed responses
  allocatedQuantityKg: number;
  utilizationPct: number; // 0–1 (e.g. 0.85 = 85%)
}

export interface AllocationSummary {
  totalAllocations: number;
  totalAllocatedKg: number;
  avgUtilizationPct: number;
  fullyAllocated: number;
  partiallyAllocated: number;
}

export interface AllocationFilters {
  matchId?: number;
  minUtilization?: number;
}
