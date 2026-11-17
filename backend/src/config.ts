import fs from 'node:fs';
import path from 'node:path';

/** Walk up from the current working directory until the data folder is found. */
function findRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..'), path.resolve(process.cwd(), '../..')];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'data', 'locations.json'))) return candidate;
  }
  return process.cwd();
}

export const REPO_ROOT = findRepoRoot();
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(REPO_ROOT, 'data');
export const CONFIG_DIR = path.join(REPO_ROOT, 'config');
export const FRONTEND_DIST = path.join(REPO_ROOT, 'frontend', 'dist');

export const PORT = Number(process.env.PORT ?? 8000);
export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
export const NODE_ENV = process.env.NODE_ENV ?? 'development';

/** The simulated "today" used by scenario data and availability scoring. */
export const DEMO_TODAY = '2026-11-15';
export const SIMULATED = true as const;

/** Simple in-process cache TTL for identical requests. */
export const CACHE_TTL_MS = 60_000;
