import { CACHE_TTL_MS } from '../config';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 200;

/**
 * Return a cached result for an identical request, or compute and store it.
 * The key must already include the store revision so mutations invalidate it.
 */
export function cached<T>(key: string, compute: () => T, ttlMs = CACHE_TTL_MS): T {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  const value = compute();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function clearCache(): void {
  cache.clear();
}

export function cacheSize(): number {
  return cache.size;
}
