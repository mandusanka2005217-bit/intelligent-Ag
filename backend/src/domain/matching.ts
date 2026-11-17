import type { Buyer, Farmer, Match, ScenarioId, WeightVector } from '@contracts/types';
import { buildExplanation, buildReasons } from './explain';
import { scorePair, type FeasibilityIssue, type PairScore, type ScoringContext } from './scoring';
import { round } from '../utils/math';

export interface FeasiblePair {
  farmer: Farmer;
  buyer: Buyer;
  pair: PairScore;
  rankPercentile: number;
  betterSupplies: number;
}

export interface MatchGenerationOptions {
  scenarioId: ScenarioId;
  farmers: Farmer[];
  buyers: Buyer[];
  context: ScoringContext;
  weights?: Partial<WeightVector>;
  defaultWeights: WeightVector;
  minScore?: number;
  limit?: number;
}

export interface MatchGenerationResult {
  matches: Match[];
  feasiblePairs: FeasiblePair[];
  buyerIssues: Record<string, FeasibilityIssue[]>;
  summary: {
    candidatePairs: number;
    feasiblePairs: number;
    blockedPairs: number;
    avgScore: number;
    maxScore: number;
  };
}

/**
 * Exhaustively score every farmer-buyer pair, keep the feasible ones and
 * rank each farmer per buyer. With 15 farmers and 8 buyers this is ~120
 * pairs, so exhaustive matching is both fast and exact.
 */
export function generateMatches(options: MatchGenerationOptions): MatchGenerationResult {
  const {
    scenarioId,
    farmers,
    buyers,
    context,
    weights,
    defaultWeights,
    minScore = 0,
    limit = 200,
  } = options;

  const feasiblePairs: FeasiblePair[] = [];
  const buyerIssues: Record<string, FeasibilityIssue[]> = {};
  let candidatePairs = 0;
  let blockedPairs = 0;

  for (const buyer of buyers) {
    for (const farmer of farmers) {
      candidatePairs += 1;
      const pair = scorePair(farmer, buyer, context, weights, defaultWeights);
      if (!pair.feasible) {
        blockedPairs += 1;
        const list = buyerIssues[buyer.id] ?? (buyerIssues[buyer.id] = []);
        list.push(...pair.issues);
        continue;
      }
      feasiblePairs.push({ farmer, buyer, pair, rankPercentile: 0, betterSupplies: 0 });
    }
  }

  // Rank within each buyer (not globally) so "best option for this buyer" is meaningful.
  const byBuyer = new Map<string, FeasiblePair[]>();
  for (const pair of feasiblePairs) {
    const list = byBuyer.get(pair.buyer.id) ?? [];
    list.push(pair);
    byBuyer.set(pair.buyer.id, list);
  }
  for (const list of byBuyer.values()) {
    list.sort((a, b) => b.pair.score - a.pair.score);
    list.forEach((pair, index) => {
      pair.betterSupplies = index;
      pair.rankPercentile =
        list.length === 1 ? 100 : round(100 * (1 - index / (list.length - 1)), 2);
    });
  }

  const matches: Match[] = feasiblePairs
    .filter((pair) => pair.pair.score >= minScore)
    .sort((a, b) => b.pair.score - a.pair.score)
    .slice(0, limit)
    .map((pair) => ({
      id: `${pair.farmer.id}->${pair.buyer.id}`,
      scenarioId,
      farmer: pair.farmer,
      buyer: pair.buyer,
      cropType: pair.farmer.cropType,
      suitabilityScore: pair.pair.score,
      components: pair.pair.components!,
      distanceKm: pair.pair.distanceKm,
      transportCostPerKg: pair.pair.transportCostPerKg,
      pricePerKg: pair.farmer.pricePerKg,
      marketPrice: pair.pair.marketReference,
      rankPercentile: pair.rankPercentile,
      reasons: buildReasons(pair.farmer, pair.buyer, pair.pair),
      explanation: buildExplanation(pair.farmer, pair.buyer, pair.pair, {
        betterSupplies: pair.betterSupplies,
      }),
      priceAnomaly: pair.pair.anomaly,
    }));

  const scores = feasiblePairs.map((pair) => pair.pair.score);
  const summary = {
    candidatePairs,
    feasiblePairs: feasiblePairs.length,
    blockedPairs,
    avgScore: scores.length
      ? round(scores.reduce((total, score) => total + score, 0) / scores.length, 2)
      : 0,
    maxScore: scores.length ? round(Math.max(...scores), 2) : 0,
  };

  return { matches, feasiblePairs, buyerIssues, summary };
}
