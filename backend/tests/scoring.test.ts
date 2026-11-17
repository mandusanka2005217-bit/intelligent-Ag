import { describe, expect, it } from 'vitest';
import type { Buyer, Constraints, Farmer, Town, WeightVector } from '../../contracts/types';
import {
  normalizeWeights,
  priceScore,
  scorePair,
  type ScoringContext,
} from '../src/domain/scoring';
import buildings from '../../config/constraints.json';
import locations from '../../data/locations.json';

const constraints = buildings as Constraints;
const towns = locations as Town[];

const defaultWeights: WeightVector = {
  price: 0.3,
  distance: 0.25,
  quantity: 0.2,
  quality: 0.15,
  availability: 0.1,
};

function farmer(overrides: Partial<Farmer> = {}): Farmer {
  return {
    id: 'F01',
    name: 'Test Farmer',
    cropType: 'Tomato',
    location: 'Dambulla',
    quantityKg: 900,
    pricePerKg: 112,
    minPricePerKg: 98,
    qualityGrade: 'B',
    availableFrom: '2026-11-14',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function buyer(overrides: Partial<Buyer> = {}): Buyer {
  return {
    id: 'B01',
    name: 'Test Buyer',
    requiredCropType: 'Tomato',
    location: 'Colombo',
    requiredQuantityKg: 2000,
    maxPricePerKg: 130,
    minAcceptableQuantityKg: 200,
    minQualityGrade: 'B',
    requiredFrom: '2026-11-18',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function context(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return {
    towns,
    constraints,
    marketPrices: { Tomato: 127 },
    anomalies: {},
    blockedCorridors: [],
    ...overrides,
  };
}

describe('normalizeWeights', () => {
  it('normalises a partial weight vector to sum to one', () => {
    const weights = normalizeWeights({ price: 2, distance: 1 }, defaultWeights);
    const total =
      weights.price + weights.distance + weights.quantity + weights.quality + weights.availability;
    expect(total).toBeCloseTo(1, 9);
    expect(weights.price).toBeGreaterThan(weights.distance);
  });

  it('throws when every weight is zero', () => {
    expect(() =>
      normalizeWeights(
        { price: 0, distance: 0, quantity: 0, quality: 0, availability: 0 },
        defaultWeights,
      ),
    ).toThrow(/at least one weight/i);
  });

  it('throws on negative weights', () => {
    expect(() => normalizeWeights({ price: -1 }, defaultWeights)).toThrow(/finite and non-negative/i);
  });
});

describe('priceScore', () => {
  it('anchors at market, -20% and +20%', () => {
    expect(priceScore(100, 100)).toBe(50);
    expect(priceScore(80, 100)).toBe(100);
    expect(priceScore(120, 100)).toBe(0);
  });

  it('clamps outside the +/-20% band', () => {
    expect(priceScore(40, 100)).toBe(100);
    expect(priceScore(400, 100)).toBe(0);
  });

  it('returns neutral 50 when the market reference is invalid', () => {
    expect(priceScore(100, 0)).toBe(50);
  });
});

describe('scorePair', () => {
  it('scores a feasible pair between 0 and 100 and normalises weights', () => {
    const result = scorePair(farmer(), buyer(), context(), undefined, defaultWeights);
    expect(result.feasible).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).not.toBeNull();
    expect(result.distanceKm).toBeGreaterThan(100);
    expect(result.transportCostPerKg).toBeGreaterThan(0);
    expect(result.components!.quality).toBe(75);
  });

  it('rejects a product mismatch', () => {
    const result = scorePair(farmer({ cropType: 'Carrot' }), buyer(), context(), undefined, defaultWeights);
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('PRODUCT_MISMATCH');
  });

  it('rejects an asking price above the buyer ceiling', () => {
    const result = scorePair(farmer({ pricePerKg: 200, minPricePerKg: 190 }), buyer(), context(), undefined, defaultWeights);
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('PRICE_ABOVE_CEILING');
  });

  it('rejects a consignment below the minimum lot', () => {
    const result = scorePair(
      farmer({ quantityKg: 100 }),
      buyer({ minAcceptableQuantityKg: 200 }),
      context(),
      undefined,
      defaultWeights,
    );
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('QUANTITY_BELOW_MIN_LOT');
  });

  it('rejects quality below the buyer minimum', () => {
    const result = scorePair(farmer({ qualityGrade: 'C' }), buyer({ minQualityGrade: 'A' }), context(), undefined, defaultWeights);
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('QUALITY_BELOW_MIN');
  });

  it('rejects a blocked corridor', () => {
    const result = scorePair(farmer(), buyer(), context({ blockedCorridors: [{ from: 'Dambulla', to: 'Colombo', reason: 'test' }] }), undefined, defaultWeights);
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('ROUTE_BLOCKED');
  });

  it('rejects deliveries beyond the delay limit', () => {
    const result = scorePair(
      farmer({ availableFrom: '2026-12-30' }),
      buyer(),
      context(),
      undefined,
      defaultWeights,
    );
    expect(result.feasible).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('TOO_LATE');
  });

  it('uses the robust reference and caps price influence for a flagged anomaly', () => {
    const result = scorePair(
      farmer({ pricePerKg: 170, minPricePerKg: 150 }),
      buyer({ maxPricePerKg: 200 }),
      context({
        marketPrices: { Tomato: 184 },
        anomalies: {
          Tomato: {
            product: 'Tomato',
            flagged: true,
            currentPrice: 184,
            zScore: 3.1,
            rollingMean: 127,
            rollingStd: 18,
            robustReference: 126,
            warning: 'spike',
          },
        },
      }),
      undefined,
      defaultWeights,
    );
    expect(result.feasible).toBe(true);
    expect(result.marketReference).toBe(126);
    // Price weight is halved then re-normalised, so it must stay below the base 0.30.
    expect(result.weights.price).toBeLessThan(defaultWeights.price);
  });

  it('is deterministic for identical inputs', () => {
    const first = scorePair(farmer(), buyer(), context(), undefined, defaultWeights);
    const second = scorePair(farmer(), buyer(), context(), undefined, defaultWeights);
    expect(second).toEqual(first);
  });
});
