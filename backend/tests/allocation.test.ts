import { describe, expect, it } from 'vitest';
import type { Buyer, Constraints, Farmer } from '../../contracts/types';
import type { FeasiblePair } from '../src/domain/matching';
import { fairnessAllocate } from '../src/allocation/fair';
import { greedyAllocate } from '../src/allocation/greedy';
import { minCostFlowAllocate } from '../src/allocation/minCostFlow';
import {
  buildEdges,
  repairMinLots,
  summarizeFlows,
  type Flow,
} from '../src/allocation/shared';
import { jainsFairnessIndex } from '../src/utils/math';
import constraintsFile from '../../config/constraints.json';

const constraints = constraintsFile as unknown as Constraints;

function farmer(id: string, quantityKg: number, overrides: Partial<Farmer> = {}): Farmer {
  return {
    id,
    name: `Farmer ${id}`,
    cropType: 'Tomato',
    location: 'Dambulla',
    quantityKg,
    pricePerKg: 100,
    minPricePerKg: 85,
    qualityGrade: 'B',
    availableFrom: '2026-11-15',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function buyer(id: string, requiredQuantityKg: number, overrides: Partial<Buyer> = {}): Buyer {
  return {
    id,
    name: `Buyer ${id}`,
    requiredCropType: 'Tomato',
    location: 'Colombo',
    requiredQuantityKg,
    maxPricePerKg: 130,
    minAcceptableQuantityKg: 1,
    minQualityGrade: 'B',
    requiredFrom: '2026-11-18',
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function feasible(f: Farmer, b: Buyer, score = 80, transportCostPerKg = 1): FeasiblePair {
  return {
    farmer: f,
    buyer: b,
    pair: {
      feasible: true,
      issues: [],
      components: {
        price: score,
        distance: score,
        quantity: score,
        quality: score,
        availability: score,
      },
      score,
      distanceKm: 100,
      transportCostPerKg,
      marketPrice: 110,
      marketReference: 110,
      weights: { price: 0.3, distance: 0.25, quantity: 0.2, quality: 0.15, availability: 0.1 },
      anomaly: null,
    },
    rankPercentile: 100,
    betterSupplies: 0,
  };
}

function totals(flows: Flow[]): { buyers: Map<string, number>; farmers: Map<string, number> } {
  const buyers = new Map<string, number>();
  const farmers = new Map<string, number>();
  for (const flow of flows) {
    buyers.set(flow.buyerId, (buyers.get(flow.buyerId) ?? 0) + flow.quantityKg);
    farmers.set(flow.farmerId, (farmers.get(flow.farmerId) ?? 0) + flow.quantityKg);
  }
  return { buyers, farmers };
}

function expectInvariants(flows: Flow[], farmers: Farmer[], buyers: Buyer[]): void {
  const { buyers: byBuyer, farmers: byFarmer } = totals(flows);
  for (const f of farmers) {
    expect(byFarmer.get(f.id) ?? 0).toBeLessThanOrEqual(f.quantityKg);
  }
  for (const b of buyers) {
    expect(byBuyer.get(b.id) ?? 0).toBeLessThanOrEqual(b.requiredQuantityKg);
  }
  for (const flow of flows) {
    expect(flow.quantityKg).toBeGreaterThan(0);
  }
}

describe('greedy allocation', () => {
  const farmers = [farmer('F01', 100), farmer('F02', 100)];
  const buyers = [buyer('B01', 150), buyer('B02', 50)];
  const feasiblePairs = [
    feasible(farmers[0], buyers[0], 90),
    feasible(farmers[0], buyers[1], 85),
    feasible(farmers[1], buyers[0], 80),
    feasible(farmers[1], buyers[1], 75),
  ];
  const edges = buildEdges(feasiblePairs, constraints);

  it('maximises total kg under score-priority without breaking capacities', () => {
    const flows = greedyAllocate(edges, farmers, buyers, 'score-priority');
    expect(flows.reduce((total, flow) => total + flow.quantityKg, 0)).toBe(200);
    expectInvariants(flows, farmers, buyers);
  });

  it('splits supply proportionally first when the proportional policy is used', () => {
    const scarceBuyers = [buyer('B01', 200), buyer('B02', 200)];
    const scarceFarmers = [farmer('F01', 100)];
    const singleEdge = [
      feasible(scarceFarmers[0], scarceBuyers[0], 90),
      feasible(scarceFarmers[0], scarceBuyers[1], 90),
    ];
    const proportional = greedyAllocate(
      buildEdges(singleEdge, constraints),
      scarceFarmers,
      scarceBuyers,
      'proportional',
    );
    const { buyers: byBuyer } = totals(proportional);
    expect(byBuyer.get('B01')).toBe(50);
    expect(byBuyer.get('B02')).toBe(50);
  });

  it('reports higher Jain fairness for the fairness strategy on a starved instance', () => {
    const starvedBuyers = [buyer('B01', 100), buyer('B02', 100), buyer('B03', 100)];
    const starvedFarmers = [farmer('F01', 150)];
    const starvedEdges = buildEdges(
      starvedBuyers.map((b) => feasible(starvedFarmers[0], b, 80, 1)),
      constraints,
    );

    const greedy = greedyAllocate(starvedEdges, starvedFarmers, starvedBuyers, 'score-priority');
    const fair = fairnessAllocate(starvedEdges, starvedFarmers, starvedBuyers);

    const greedyJain = jainsFairnessIndex(
      starvedBuyers.map((b) => (totals(greedy).buyers.get(b.id) ?? 0) / b.requiredQuantityKg),
    );
    const fairJain = jainsFairnessIndex(
      starvedBuyers.map((b) => (totals(fair).buyers.get(b.id) ?? 0) / b.requiredQuantityKg),
    );

    expect(fairJain).toBeGreaterThan(greedyJain);
    expectInvariants(fair, starvedFarmers, starvedBuyers);
  });
});

describe('min-cost max-flow allocation', () => {
  it('matches the greedy maximum flow but never exceeds capacities', () => {
    const farmers = [farmer('F01', 120), farmer('F02', 80)];
    const buyers = [buyer('B01', 150), buyer('B02', 100)];
    const pairs = [
      feasible(farmers[0], buyers[0], 95, 0.5),
      feasible(farmers[0], buyers[1], 60, 3),
      feasible(farmers[1], buyers[0], 70, 2),
      feasible(farmers[1], buyers[1], 90, 1),
    ];
    const edges = buildEdges(pairs, constraints);
    const result = minCostFlowAllocate(edges, farmers, buyers, 'score-priority');
    expect(result.flows.reduce((total, flow) => total + flow.quantityKg, 0)).toBe(200);
    expect(result.augmentations).toBeGreaterThan(0);
    expectInvariants(result.flows, farmers, buyers);
  });
});

describe('minimum-lot repair', () => {
  it('drops a sub-lot delivery and reallocates the kg where a full lot fits', () => {
    const small = buyer('B01', 400, { minAcceptableQuantityKg: 300 });
    const large = buyer('B02', 200, { minAcceptableQuantityKg: 100 });
    const f = farmer('F01', 400);
    const edges = buildEdges([feasible(f, small, 90), feasible(f, large, 50)], constraints);
    const flows: Flow[] = [
      { farmerId: 'F01', buyerId: 'B01', quantityKg: 100 },
      { farmerId: 'F01', buyerId: 'B02', quantityKg: 100 },
    ];
    const repaired = repairMinLots(flows, [f], [small, large], edges);
    expect(repaired.minLotRepairs).toBeGreaterThanOrEqual(1);
    expect(repaired.flows.some((flow) => flow.buyerId === 'B01')).toBe(false);
    const totalKg = repaired.flows.reduce((total, flow) => total + flow.quantityKg, 0);
    expect(totalKg).toBeLessThanOrEqual(400);
  });
});

describe('summarizeFlows', () => {
  it('computes fill rate, suitability, transport cost and buyer buckets', () => {
    const f = farmer('F01', 100);
    const b = buyer('B01', 200);
    const pair = feasible(f, b, 80, 2);
    const edge = buildEdges([pair], constraints)[0];
    const summary = summarizeFlows(
      [{ farmerId: 'F01', buyerId: 'B01', quantityKg: 100 }],
      [b],
      new Map([[`${edge.farmerId}->${edge.buyerId}`, edge]]),
    );
    expect(summary.totalAllocatedKg).toBe(100);
    expect(summary.fillRate).toBe(0.5);
    expect(summary.avgSuitability).toBe(80);
    expect(summary.totalTransportCostRs).toBe(200);
    expect(summary.partiallyServedBuyers).toBe(1);
    expect(summary.fullyServedBuyers).toBe(0);
  });

  it('returns perfect fairness for a single participant', () => {
    expect(jainsFairnessIndex([1])).toBe(1);
    expect(jainsFairnessIndex([])).toBe(1);
    expect(jainsFairnessIndex([0, 0])).toBe(1);
  });
});
