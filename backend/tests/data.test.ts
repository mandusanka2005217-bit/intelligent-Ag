import { describe, expect, it } from 'vitest';
import { loadData } from '../src/data/loader';
import { DataStore } from '../src/data/store';
import { ValidationError } from '../src/errors';

describe('data loader', () => {
  const loaded = loadData();

  it('loads both scenarios with the expected simulated entities', () => {
    expect(Object.keys(loaded.descriptors).sort()).toEqual(['A', 'B']);
    expect(loaded.farmers.A).toHaveLength(15);
    expect(loaded.farmers.B).toHaveLength(15);
    expect(loaded.buyers.A).toHaveLength(8);
    expect(loaded.buyers.B).toHaveLength(8);
    expect(loaded.locations.length).toBeGreaterThanOrEqual(20);
  });

  it('cuts scenario B supply and washes out F07', () => {
    const supplyA = loaded.farmers.A.reduce((total, farmer) => total + farmer.quantityKg, 0);
    const supplyB = loaded.farmers.B.reduce((total, farmer) => total + farmer.quantityKg, 0);
    expect(supplyA).toBe(16900);
    expect(supplyB).toBe(9600);
    expect(loaded.farmers.B.find((farmer) => farmer.id === 'F07')?.quantityKg).toBe(0);
  });

  it('declares the blocked Badulla-Colombo corridor and a tomato spike in B', () => {
    const disruption = loaded.descriptors.B.disruption;
    expect(disruption.blockedCorridors).toEqual(
      expect.arrayContaining([expect.objectContaining({ from: 'Badulla', to: 'Colombo' })]),
    );
    expect(disruption.priceSpike?.product).toBe('Tomato');
    expect(disruption.priceSpike?.pct).toBeCloseTo(0.45, 5);
    expect(loaded.marketPrices.B.Tomato).toBeGreaterThan(loaded.marketPrices.A.Tomato);
  });

  it('loads 90 days of price history for every priced product', () => {
    for (const scenario of ['A', 'B'] as const) {
      const products = Object.keys(loaded.priceHistory[scenario]);
      expect(products.length).toBeGreaterThanOrEqual(6);
      for (const product of products) {
        expect(loaded.priceHistory[scenario][product].length).toBe(90);
      }
    }
  });

  it('keeps weights normalisable and constraints coherent', () => {
    const total = Object.values(loaded.defaultWeights).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 6);
    expect(loaded.constraints.maxDistanceKm).toBe(250);
    expect(loaded.constraints.roadCircuity).toBe(1.3);
  });
});

describe('DataStore', () => {
  it('adds a farmer with sensible defaults and bumps the revision', () => {
    const store = new DataStore(loadData());
    const before = store.revision;
    const created = store.addFarmer('A', {
      name: 'New Farmer',
      location: 'Dambulla',
      cropType: 'Tomato',
      quantityKg: 500,
      pricePerKg: 100,
    });
    expect(created.id).toBe('F16');
    expect(created.minPricePerKg).toBe(85);
    expect(created.qualityGrade).toBe('B');
    expect(store.revision).toBe(before + 1);
    expect(store.getFarmers('A')).toHaveLength(16);
    expect(store.getFarmers('B')).toHaveLength(15);
  });

  it('rejects unknown towns', () => {
    const store = new DataStore(loadData());
    expect(() =>
      store.addFarmer('A', {
        name: 'Lost Farmer',
        location: 'Atlantis',
        cropType: 'Tomato',
        quantityKg: 500,
        pricePerKg: 100,
      }),
    ).toThrow(ValidationError);
  });

  it('updates and deletes without touching the other scenario', () => {
    const store = new DataStore(loadData());
    store.updateFarmer('A', 'F01', { pricePerKg: 120, minPricePerKg: 100 });
    expect(store.getFarmer('A', 'F01').pricePerKg).toBe(120);
    expect(store.getFarmer('B', 'F01').pricePerKg).toBe(112);

    store.deleteBuyer('B', 'B08');
    expect(store.getBuyers('B')).toHaveLength(7);
    expect(store.getBuyers('A')).toHaveLength(8);
  });

  it('refuses an update that breaks the minimum price rule', () => {
    const store = new DataStore(loadData());
    expect(() => store.updateFarmer('A', 'F01', { minPricePerKg: 200 })).toThrow(ValidationError);
  });
});
