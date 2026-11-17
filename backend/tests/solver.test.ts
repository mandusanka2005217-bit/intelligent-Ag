import { describe, expect, it } from 'vitest';
import solver from 'javascript-lp-solver';
import type { Buyer, Farmer } from '../../contracts/types';
import { minCostFlow } from '../src/allocation/minCostFlow';
import { demandMap, flowKey, type NetworkEdge } from '../src/allocation/shared';

/**
 * Independent verification of the hand-written min-cost max-flow solver.
 *
 * The same balanced transportation instance is given to `javascript-lp-solver`
 * as a linear program (equality supply/demand constraints, minimise cost). If
 * our SPFA solver is correct, both objectives must agree exactly.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function farmer(id: string, quantityKg: number): Farmer {
  return {
    id,
    name: id,
    cropType: 'Tomato',
    location: 'Dambulla',
    quantityKg,
    pricePerKg: 100,
    minPricePerKg: 80,
    qualityGrade: 'B',
    availableFrom: '2026-11-15',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

function buyer(id: string, requiredQuantityKg: number): Buyer {
  return {
    id,
    name: id,
    requiredCropType: 'Tomato',
    location: 'Colombo',
    requiredQuantityKg,
    maxPricePerKg: 200,
    minAcceptableQuantityKg: 1,
    minQualityGrade: 'C',
    requiredFrom: '2026-11-18',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

function splitTotal(random: () => number, total: number, parts: number): number[] {
  const cuts = Array.from({ length: parts - 1 }, () => Math.floor(random() * (total - 1)) + 1).sort(
    (a, b) => a - b,
  );
  const points = [0, ...cuts, total];
  return points.slice(1).map((point, index) => point - points[index]);
}

describe('min-cost max-flow vs LP solver', () => {
  for (let trial = 0; trial < 6; trial += 1) {
    it(`matches the LP optimum on random balanced instance #${trial + 1}`, () => {
      const random = mulberry32(1000 + trial);
      const totalSupply = 120 + Math.floor(random() * 240);
      const supplies = splitTotal(random, totalSupply, 4);
      const demands = splitTotal(random, totalSupply, 3);

      const farmers = supplies.map((quantity, index) => farmer(`F0${index + 1}`, quantity));
      const buyers = demands.map((quantity, index) => buyer(`B0${index + 1}`, quantity));

      const edges: NetworkEdge[] = [];
      for (const f of farmers) {
        for (const b of buyers) {
          edges.push({
            id: `${f.id}->${b.id}`,
            farmerId: f.id,
            buyerId: b.id,
            capacity: Math.min(f.quantityKg, b.requiredQuantityKg),
            cost: Math.floor(random() * 5000),
            score: Math.round(random() * 100),
            transportCostPerKg: 1,
          });
        }
      }

      // --- Independent LP formulation -------------------------------------
      const constraints: Record<string, { equal: number }> = {};
      for (const f of farmers) constraints[`farmer_${f.id}`] = { equal: f.quantityKg };
      for (const b of buyers) constraints[`buyer_${b.id}`] = { equal: b.requiredQuantityKg };

      const variables: Record<string, Record<string, number>> = {};
      for (const edge of edges) {
        variables[edge.id] = {
          cost: edge.cost,
          [`farmer_${edge.farmerId}`]: 1,
          [`buyer_${edge.buyerId}`]: 1,
        };
      }

      const lp = solver.Solve({ optimize: 'cost', opType: 'min', constraints, variables });
      expect(lp.feasible).toBe(true);

      // --- Hand-written solver --------------------------------------------
      const result = minCostFlow(edges, farmers, buyers, demandMap(buyers));
      const totalFlow = result.flows.reduce((total, flow) => total + flow.quantityKg, 0);
      expect(totalFlow).toBe(totalSupply);

      expect(result.totalEdgeCost).toBeCloseTo(lp.result, 6);

      // Flow conservation and edge capacities.
      const byFarmer = new Map<string, number>();
      const byBuyer = new Map<string, number>();
      for (const flow of result.flows) {
        const edge = edges.find((candidate) => candidate.id === flowKey(flow.farmerId, flow.buyerId));
        expect(edge).toBeDefined();
        expect(flow.quantityKg).toBeLessThanOrEqual(edge!.capacity);
        byFarmer.set(flow.farmerId, (byFarmer.get(flow.farmerId) ?? 0) + flow.quantityKg);
        byBuyer.set(flow.buyerId, (byBuyer.get(flow.buyerId) ?? 0) + flow.quantityKg);
      }
      for (const f of farmers) expect(byFarmer.get(f.id) ?? 0).toBe(f.quantityKg);
      for (const b of buyers) expect(byBuyer.get(b.id) ?? 0).toBe(b.requiredQuantityKg);
    });
  }

  it('pushes the full available supply when demand is higher', () => {
    const farmers = [farmer('F01', 70), farmer('F02', 30)];
    const buyers = [buyer('B01', 500), buyer('B02', 400)];
    const edges: NetworkEdge[] = [];
    for (const f of farmers) {
      for (const b of buyers) {
        edges.push({
          id: `${f.id}->${b.id}`,
          farmerId: f.id,
          buyerId: b.id,
          capacity: Math.min(f.quantityKg, b.requiredQuantityKg),
          cost: 100,
          score: 50,
          transportCostPerKg: 1,
        });
      }
    }
    const result = minCostFlow(edges, farmers, buyers, demandMap(buyers));
    expect(result.flows.reduce((total, flow) => total + flow.quantityKg, 0)).toBe(100);
  });

  it('returns no flow when there are no feasible edges', () => {
    const farmers = [farmer('F01', 100)];
    const buyers = [buyer('B01', 100)];
    const result = minCostFlow([], farmers, buyers, demandMap(buyers));
    expect(result.flows).toHaveLength(0);
    expect(result.totalEdgeCost).toBe(0);
  });
});
