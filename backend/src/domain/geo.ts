import type { BlockedCorridor, Town } from '@contracts/types';

export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates.
 * We use haversine because it is stable for short distances and needs no
 * external routing service. It is NOT a road network distance.
 */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, h)));
}

/**
 * Approximate road distance.
 * Sri Lankan hill-country and coastal roads are winding, so a documented
 * circuity factor of 1.3 is applied to the great-circle distance.
 */
export function roadDistanceKm(a: LatLon, b: LatLon, circuity: number): number {
  return haversineKm(a, b) * circuity;
}

/** Linear transport cost in Rs per kg for one leg. */
export function transportCostPerKg(distanceKm: number, ratePerKgKm: number): number {
  return distanceKm * ratePerKgKm;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Corridors are treated as bidirectional closures. */
export function isCorridorBlocked(
  from: string,
  to: string,
  corridors: BlockedCorridor[],
): boolean {
  const a = normalize(from);
  const b = normalize(to);
  return corridors.some((corridor) => {
    const c = normalize(corridor.from);
    const d = normalize(corridor.to);
    return (a === c && b === d) || (a === d && b === c);
  });
}

export function townIndex(towns: Town[]): Map<string, Town> {
  const map = new Map<string, Town>();
  for (const town of towns) map.set(normalize(town.name), town);
  return map;
}

export function findTown(towns: Town[], name: string): Town | undefined {
  return towns.find((town) => normalize(town.name) === normalize(name));
}
