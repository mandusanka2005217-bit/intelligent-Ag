import { describe, expect, it } from 'vitest';
import {
  findTown,
  haversineKm,
  isCorridorBlocked,
  roadDistanceKm,
  transportCostPerKg,
} from '../src/domain/geo';
import locations from '../../data/locations.json';

const towns = locations as Array<{ name: string; lat: number; lon: number }>;

describe('geo', () => {
  it('computes the great-circle distance symmetrically', () => {
    const colombo = { lat: 6.9271, lon: 79.8612 };
    const kandy = { lat: 7.2906, lon: 80.6337 };
    const forward = haversineKm(colombo, kandy);
    const backward = haversineKm(kandy, colombo);
    expect(forward).toBeCloseTo(backward, 6);
    // Colombo-Kandy is roughly 95-115 km in a straight line.
    expect(forward).toBeGreaterThan(85);
    expect(forward).toBeLessThan(120);
  });

  it('returns zero distance for identical coordinates', () => {
    const point = { lat: 7.4863, lon: 80.3623 };
    expect(haversineKm(point, point)).toBeCloseTo(0, 9);
  });

  it('applies the documented 1.3 road circuity factor', () => {
    const a = { lat: 6.9271, lon: 79.8612 };
    const b = { lat: 7.2906, lon: 80.6337 };
    const straight = haversineKm(a, b);
    expect(roadDistanceKm(a, b, 1.3)).toBeCloseTo(straight * 1.3, 6);
  });

  it('prices a leg linearly per kg-km', () => {
    expect(transportCostPerKg(100, 0.012)).toBeCloseTo(1.2, 6);
    expect(transportCostPerKg(0, 0.012)).toBe(0);
  });

  it('treats blocked corridors as bidirectional', () => {
    const corridors = [{ from: 'Badulla', to: 'Colombo', reason: 'test' }];
    expect(isCorridorBlocked('Badulla', 'Colombo', corridors)).toBe(true);
    expect(isCorridorBlocked('Colombo', 'Badulla', corridors)).toBe(true);
    expect(isCorridorBlocked('badulla', 'colombo', corridors)).toBe(true);
    expect(isCorridorBlocked('Badulla', 'Kandy', corridors)).toBe(false);
  });

  it('finds towns case-insensitively', () => {
    expect(findTown(towns as never, 'colombo')?.name).toBe('Colombo');
    expect(findTown(towns as never, 'Atlantis')).toBeUndefined();
  });
});
