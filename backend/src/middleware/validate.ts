import type { z } from 'zod';
import { ValidationError } from '../errors';

/** Parse with zod and convert failures into the API's uniform validation error. */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label = 'Request'): T {
  const result = schema.safeParse(value ?? {});
  if (result.success) return result.data;
  throw new ValidationError(
    `${label} validation failed`,
    result.error.issues.map((issue) => ({
      path: issue.path.join('.') || '(root)',
      message: issue.message,
    })),
  );
}

/** Deterministic JSON stringification for cache keys. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);
  return `{${entries.join(',')}}`;
}
