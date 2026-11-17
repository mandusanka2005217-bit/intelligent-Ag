// Match feature types. The single source of truth is contracts/types.ts.
export type {
  Match,
  MatchesResponse,
  MatchRequest,
  ScoreComponents,
  AnomalyInfo,
  WeightVector,
} from '@contracts/types';

export interface MatchFilters {
  minScore?: number;
  limit?: number;
}

/** Kept for compatibility with the original stub. */
export interface RunMatchingResult {
  matchesCreated: number;
  matches: import('@contracts/types').Match[];
}
