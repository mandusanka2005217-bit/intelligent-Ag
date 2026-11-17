import type {
  AnomalyInfo,
  BlockedCorridor,
  Buyer,
  Constraints,
  Farmer,
  QualityGrade,
  ScoreComponents,
  Town,
  WeightVector,
} from '@contracts/types';
import { findTown, isCorridorBlocked, roadDistanceKm, transportCostPerKg } from './geo';
import { clamp01, round } from '../utils/math';

export type FeasibilityCode =
  | 'PRODUCT_MISMATCH'
  | 'PRICE_ABOVE_CEILING'
  | 'BELOW_FARMER_FLOOR'
  | 'QUANTITY_BELOW_MIN_LOT'
  | 'NO_SUPPLY'
  | 'DISTANCE_TOO_FAR'
  | 'TOO_LATE'
  | 'QUALITY_BELOW_MIN'
  | 'ROUTE_BLOCKED'
  | 'UNKNOWN_TOWN';

export interface FeasibilityIssue {
  code: FeasibilityCode;
  message: string;
}

export interface ScoringContext {
  towns: Town[];
  constraints: Constraints;
  marketPrices: Record<string, number>;
  anomalies: Record<string, AnomalyInfo>;
  blockedCorridors: BlockedCorridor[];
}

export interface PairScore {
  feasible: boolean;
  issues: FeasibilityIssue[];
  components: ScoreComponents | null;
  score: number;
  distanceKm: number;
  transportCostPerKg: number;
  marketPrice: number;
  marketReference: number;
  weights: WeightVector;
  anomaly: AnomalyInfo | null;
}

const QUALITY_RANK: Record<QualityGrade, number> = { A: 3, B: 2, C: 1 };

/** Normalise a (possibly partial) weight vector; throws on an all-zero vector. */
export function normalizeWeights(partial: Partial<WeightVector> | undefined, fallback: WeightVector): WeightVector {
  const merged: WeightVector = {
    price: partial?.price ?? fallback.price,
    distance: partial?.distance ?? fallback.distance,
    quantity: partial?.quantity ?? fallback.quantity,
    quality: partial?.quality ?? fallback.quality,
    availability: partial?.availability ?? fallback.availability,
  };
  const values = Object.values(merged);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('Weights must be finite and non-negative');
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error('At least one weight must be positive');
  return {
    price: merged.price / total,
    distance: merged.distance / total,
    quantity: merged.quantity / total,
    quality: merged.quality / total,
    availability: merged.availability / total,
  };
}

/**
 * Price component: anchored on the market reference.
 *   at market        -> 50
 *   20% below market -> 100
 *   20% above market -> 0
 * Linear in between and clamped to [0, 100].
 */
export function priceScore(price: number, marketReference: number): number {
  if (marketReference <= 0) return 50;
  return round(100 * clamp01(0.5 + (marketReference - price) / (0.4 * marketReference)), 2);
}

export function qualityScore(grade: QualityGrade, constraints: Constraints): number {
  return constraints.qualityScores[grade];
}

export function weightSum(weights: WeightVector): number {
  return weights.price + weights.distance + weights.quantity + weights.quality + weights.availability;
}

/**
 * Score one farmer-buyer pair and check every hard constraint.
 * All five components are 0-100; the weighted total is therefore also 0-100.
 */
export function scorePair(
  farmer: Farmer,
  buyer: Buyer,
  context: ScoringContext,
  requestedWeights: Partial<WeightVector> | undefined,
  defaultWeights: WeightVector,
): PairScore {
  const { constraints } = context;
  const issues: FeasibilityIssue[] = [];

  const farmerTown = findTown(context.towns, farmer.location);
  const buyerTown = findTown(context.towns, buyer.location);

  if (farmer.cropType !== buyer.requiredCropType) {
    issues.push({
      code: 'PRODUCT_MISMATCH',
      message: `Produces ${farmer.cropType}, buyer needs ${buyer.requiredCropType}`,
    });
  }

  if (farmer.quantityKg <= 0) {
    issues.push({ code: 'NO_SUPPLY', message: 'No supply left at harvest' });
  } else if (farmer.quantityKg < buyer.minAcceptableQuantityKg) {
    issues.push({
      code: 'QUANTITY_BELOW_MIN_LOT',
      message: `Offers ${farmer.quantityKg} kg, below the buyer's ${buyer.minAcceptableQuantityKg} kg minimum lot`,
    });
  }

  if (farmer.pricePerKg > buyer.maxPricePerKg) {
    issues.push({
      code: 'PRICE_ABOVE_CEILING',
      message: `Asks Rs ${farmer.pricePerKg}/kg, above the buyer's Rs ${buyer.maxPricePerKg}/kg ceiling`,
    });
  }
  if (farmer.minPricePerKg > buyer.maxPricePerKg) {
    issues.push({
      code: 'BELOW_FARMER_FLOOR',
      message: `Farmer floor Rs ${farmer.minPricePerKg}/kg exceeds the buyer ceiling`,
    });
  }

  if (QUALITY_RANK[farmer.qualityGrade] < QUALITY_RANK[buyer.minQualityGrade]) {
    issues.push({
      code: 'QUALITY_BELOW_MIN',
      message: `Grade ${farmer.qualityGrade} is below the buyer's minimum grade ${buyer.minQualityGrade}`,
    });
  }

  const availableFrom = new Date(`${farmer.availableFrom}T00:00:00Z`).getTime();
  const requiredFrom = new Date(`${buyer.requiredFrom}T00:00:00Z`).getTime();
  const delayDays = Math.max(0, Math.round((availableFrom - requiredFrom) / 86_400_000));
  if (delayDays > constraints.maxDeliveryDelayDays) {
    issues.push({
      code: 'TOO_LATE',
      message: `Available ${delayDays} days after the buyer needs it (limit ${constraints.maxDeliveryDelayDays})`,
    });
  }

  if (!farmerTown || !buyerTown) {
    issues.push({ code: 'UNKNOWN_TOWN', message: 'One of the locations is not in the town dataset' });
  }

  let distanceKm = Number.POSITIVE_INFINITY;
  if (farmerTown && buyerTown) {
    distanceKm = round(
      roadDistanceKm(farmerTown, buyerTown, constraints.roadCircuity),
      2,
    );
    if (distanceKm > constraints.maxDistanceKm) {
      issues.push({
        code: 'DISTANCE_TOO_FAR',
        message: `${distanceKm} km exceeds the ${constraints.maxDistanceKm} km limit`,
      });
    }
    if (isCorridorBlocked(farmer.location, buyer.location, context.blockedCorridors)) {
      issues.push({
        code: 'ROUTE_BLOCKED',
        message: `Route ${farmer.location} -> ${buyer.location} is blocked`,
      });
    }
  }

  const anomaly = context.anomalies[farmer.cropType] ?? null;
  const configuredMarketPrice = context.marketPrices[farmer.cropType] ?? farmer.pricePerKg;
  const marketReference =
    anomaly?.flagged && anomaly.robustReference > 0 ? anomaly.robustReference : configuredMarketPrice;

  // Capped price influence when the product's market price is anomalous.
  const baseWeights = normalizeWeights(requestedWeights, defaultWeights);
  let weights = baseWeights;
  if (anomaly?.flagged) {
    const capped = {
      ...baseWeights,
      price: baseWeights.price * constraints.anomaly.priceWeightCap,
    };
    weights = normalizeWeights(capped, defaultWeights);
  }

  if (issues.length > 0) {
    return {
      feasible: false,
      issues,
      components: null,
      score: 0,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
      transportCostPerKg: 0,
      marketPrice: configuredMarketPrice,
      marketReference,
      weights,
      anomaly,
    };
  }

  const components: ScoreComponents = {
    price: priceScore(farmer.pricePerKg, marketReference),
    distance: round(100 * clamp01(1 - distanceKm / constraints.maxDistanceKm), 2),
    quantity: round(100 * clamp01(farmer.quantityKg / buyer.requiredQuantityKg), 2),
    quality: qualityScore(farmer.qualityGrade, constraints),
    availability: round(100 * clamp01(1 - delayDays / constraints.maxDeliveryDelayDays), 2),
  };

  const score = round(
    components.price * weights.price +
      components.distance * weights.distance +
      components.quantity * weights.quantity +
      components.quality * weights.quality +
      components.availability * weights.availability,
    2,
  );

  return {
    feasible: true,
    issues: [],
    components,
    score,
    distanceKm,
    transportCostPerKg: round(transportCostPerKg(distanceKm, constraints.transportRatePerKgKm), 4),
    marketPrice: configuredMarketPrice,
    marketReference,
    weights,
    anomaly,
  };
}
