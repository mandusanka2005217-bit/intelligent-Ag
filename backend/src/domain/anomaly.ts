import type { AnomalyConfig, AnomalyInfo, PricePoint, Product } from '@contracts/types';
import type { RawPricePoint } from '../data/loader';
import { mean, median, round, stdDev } from '../utils/math';

/**
 * Rolling z-score anomaly detection.
 *
 * For each day t we look ONLY at the previous `windowDays` prices, so the
 * detector can run in real time without peeking at the future.
 *
 * The baseline deliberately includes earlier flagged observations. Dropping
 * them looks attractive (it stops a two-day spike from masking itself), but it
 * also shrinks the window after a false positive, lowers the standard
 * deviation, and triggers a cascade of further false positives. With a 14-day
 * window a single spike moves the mean by only a fraction of its size, so the
 * standard rolling window is the more stable choice.
 *
 * z_t = (price_t - mean(window)) / std(window)
 * flag when |z_t| >= threshold.
 */
export function computePriceSeries(points: RawPricePoint[], config: AnomalyConfig): PricePoint[] {
  const series: PricePoint[] = [];
  const minimumBaseline = Math.min(config.windowDays, 7);

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const window = points
      .slice(Math.max(0, i - config.windowDays), i)
      .map((candidate) => candidate.price);

    let rollingMean: number | null = null;
    let rollingStd: number | null = null;
    let zScore: number | null = null;
    let flagged = false;
    let upper: number | null = null;
    let lower: number | null = null;

    if (window.length >= minimumBaseline) {
      rollingMean = mean(window);
      rollingStd = stdDev(window);
      zScore = rollingStd > 1e-6 ? (point.price - rollingMean) / rollingStd : 0;
      flagged = Math.abs(zScore) >= config.thresholdZ;
      upper = rollingMean + config.thresholdZ * rollingStd;
      lower = rollingMean - config.thresholdZ * rollingStd;
    }

    series.push({
      date: point.date,
      price: round(point.price, 2),
      rollingMean: rollingMean === null ? null : round(rollingMean, 2),
      rollingStd: rollingStd === null ? null : round(rollingStd, 2),
      zScore: zScore === null ? null : round(zScore, 2),
      flagged,
      upper: upper === null ? null : round(upper, 2),
      lower: lower === null ? null : round(lower, 2),
    });
  }

  return series;
}

/**
 * Build the anomaly context used by scoring for one product.
 * When flagged, the 30-day median of clean prices becomes the robust market
 * reference and the price component's weight is capped by the caller.
 */
export function buildAnomalyInfo(
  product: Product,
  points: RawPricePoint[],
  config: AnomalyConfig,
  configuredPrice: number,
): AnomalyInfo {
  const series = computePriceSeries(points, config);
  const current = series[series.length - 1];
  const flagged = current?.flagged ?? false;

  const cleanPrices = points
    .slice(-config.robustWindowDays)
    .filter((point, index) => {
      const seriesPoint = series[series.length - Math.min(points.length, config.robustWindowDays) + index];
      return !seriesPoint?.flagged;
    })
    .map((point) => point.price);

  const robustReference = flagged
    ? round(median(cleanPrices.length > 0 ? cleanPrices : points.map((p) => p.price)), 2)
    : configuredPrice;

  const warning = flagged
    ? `${product} price Rs ${round(current.price, 2)}/kg is ${Math.abs(
        current.zScore ?? 0,
      )} standard deviations from its ${config.windowDays}-day average. Its influence on scoring is capped and the ${config.robustWindowDays}-day median (Rs ${robustReference}/kg) is used as the reference.`
    : null;

  return {
    product,
    flagged,
    currentPrice: round(current?.price ?? configuredPrice, 2),
    zScore: current?.zScore ?? null,
    rollingMean: current?.rollingMean ?? null,
    rollingStd: current?.rollingStd ?? null,
    robustReference,
    warning,
  };
}

/** Build anomaly contexts for every product that has price history. */
export function buildAnomalyMap(
  priceHistory: Record<string, RawPricePoint[]>,
  config: AnomalyConfig,
  marketPrices: Record<string, number>,
): Record<string, AnomalyInfo> {
  const map: Record<string, AnomalyInfo> = {};
  for (const [product, points] of Object.entries(priceHistory)) {
    if (points.length === 0) continue;
    map[product] = buildAnomalyInfo(
      product as Product,
      points,
      config,
      marketPrices[product] ?? points[points.length - 1].price,
    );
  }
  return map;
}
