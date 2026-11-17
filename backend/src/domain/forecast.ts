import type { RawPricePoint } from '../data/loader';
import { mean, round } from '../utils/math';

/**
 * Optional, deliberately simple demand/price forecast.
 * A 7-day moving average is honest for a demo: it is cheap, explainable and
 * does not pretend to model weather or seasonality beyond recent momentum.
 */
export function forecastNextPrice(
  points: RawPricePoint[],
  windowDays = 7,
): { nextPrice: number; method: string; windowDays: number } | null {
  if (points.length === 0) return null;
  const window = points.slice(-windowDays).map((point) => point.price);
  return {
    nextPrice: round(mean(window), 2),
    method: `${window.length}-day moving average`,
    windowDays: window.length,
  };
}
