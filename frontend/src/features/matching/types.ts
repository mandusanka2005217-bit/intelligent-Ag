// Matching feature TypeScript type definitions
import type { Farmer } from '../farmers/types';
import type { Buyer } from '../buyers/types';

export interface Match {
  id: number;
  farmer: Farmer;
  buyer: Buyer;
  suitabilityScore: number;   // 0–100 overall score
  distanceScore: number;      // 0–100
  priceScore: number;         // 0–100
  cropScore: number;          // 0–100
  quantityScore: number;      // 0–100
  reasons: string[];          // Human-readable match reasons
  createdAt: string;          // ISO 8601 date string
}

export interface RunMatchingResult {
  matchesCreated: number;
  matches: Match[];
}

export interface MatchFilters {
  farmerId?: number;
  buyerId?: number;
  minScore?: number;
}
