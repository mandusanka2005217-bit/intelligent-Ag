import { describe, expect, it } from 'vitest';
import type { AnomalyConfig, Product } from '../../contracts/types';
import { buildAnomalyInfo, computePriceSeries } from '../src/domain/anomaly';
import type { RawPricePoint } from '../src/data/loader';
import anomaliesFile from '../../config/constraints.json';

const config = (anomaliesFile as { anomaly: AnomalyConfig }).anomaly;

function series(prices: number[], product: Product = 'Tomato'): RawPricePoint[] {
  return prices.map((price, index) => {
    const date = new Date(Date.UTC(2026, 7, 1 + index)).toISOString().slice(0, 10);
    return { date, market: 'Test', product, price };
  });
}

describe('rolling price anomaly detection', () => {
  it('does not flag a stable series', () => {
    const points = series(Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 2));
    const computed = computePriceSeries(points, config);
    expect(computed.some((point) => point.flagged)).toBe(false);
    expect(computed.at(-1)!.zScore).not.toBeNull();
  });

  it('flags a clear last-day spike and excludes it from the next baseline', () => {
    const stable = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 2);
    const computed = computePriceSeries(series([...stable, 170]), config);
    const last = computed.at(-1)!;
    expect(last.flagged).toBe(true);
    expect(last.zScore).toBeGreaterThan(config.thresholdZ);
    expect(last.upper).not.toBeNull();
  });

  it('flags a two-day spike on both days, not just the first', () => {
    const stable = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 2);
    const computed = computePriceSeries(series([...stable, 170, 170]), config);
    expect(computed.at(-2)!.flagged).toBe(true);
    expect(computed.at(-1)!.flagged).toBe(true);
  });

  it('does not flag the first points before a full baseline exists', () => {
    const computed = computePriceSeries(series([10, 12, 11, 13]), config);
    expect(computed.slice(0, 3).every((point) => point.zScore === null)).toBe(true);
  });

  it('reports the 30-day median as the robust reference for a flagged product', () => {
    const stable = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i));
    const info = buildAnomalyInfo('Tomato', series([...stable, 175]), config, 175);
    expect(info.flagged).toBe(true);
    expect(info.warning).toMatch(/capped/i);
    expect(info.robustReference).toBeGreaterThan(95);
    expect(info.robustReference).toBeLessThan(105);
    expect(Math.abs(info.zScore ?? 0)).toBeGreaterThanOrEqual(config.thresholdZ);
  });

  it('uses the configured market price when nothing is flagged', () => {
    const stable = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i));
    const info = buildAnomalyInfo('Tomato', series(stable), config, 101);
    expect(info.flagged).toBe(false);
    expect(info.robustReference).toBe(101);
    expect(info.warning).toBeNull();
  });
});
