import type { Buyer, Farmer } from '@contracts/types';
import type { FeasibilityIssue, PairScore } from './scoring';

function num(value: number, decimals = 1): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.0+$/, '');
}

export function formatRs(value: number): string {
  return `Rs ${num(value, 2)}`;
}

/** Component chips shown under a match / allocation row. */
export function buildReasons(farmer: Farmer, buyer: Buyer, pair: PairScore): string[] {
  const reasons: string[] = [];
  if (!pair.components) return reasons;

  const fillPct = Math.min(100, (farmer.quantityKg / buyer.requiredQuantityKg) * 100);
  reasons.push(`${num(pair.distanceKm)} km road (${pair.components.distance}/100 distance)`);
  reasons.push(
    `${formatRs(farmer.pricePerKg)}/kg (${priceGapText(farmer.pricePerKg, pair.marketReference)})`,
  );
  reasons.push(`Grade ${farmer.qualityGrade}`);
  reasons.push(`Fills ${num(fillPct)}% of demand`);

  const delayDays = delayFromAvailability(farmer, buyer);
  reasons.push(delayDays <= 0 ? 'Available on time' : `${delayDays} day(s) late`);

  if (pair.anomaly?.flagged) {
    reasons.push(
      `${pair.anomaly.product} price flagged as anomalous — reference capped at ${formatRs(
        pair.anomaly.robustReference,
      )}/kg`,
    );
  }
  return reasons;
}

/** "7.1% below the Rs 127 market" / "at the Rs 127 market". */
function priceGapText(price: number, market: number): string {
  if (market <= 0) return 'no market reference';
  const gap = ((market - price) / market) * 100;
  if (Math.abs(gap) < 0.05) return `at the ${formatRs(market)} market`;
  return gap > 0
    ? `${num(gap)}% below the ${formatRs(market)} market`
    : `${num(Math.abs(gap))}% above the ${formatRs(market)} market`;
}

function delayFromAvailability(farmer: Farmer, buyer: Buyer): number {
  const available = new Date(`${farmer.availableFrom}T00:00:00Z`).getTime();
  const required = new Date(`${buyer.requiredFrom}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((available - required) / 86_400_000));
}

/**
 * Plain-English sentence used by the explain drawer and the match list.
 * This is generated from the same numbers returned by the API, so it can never
 * drift from the displayed scores.
 */
export function buildExplanation(
  farmer: Farmer,
  buyer: Buyer,
  pair: PairScore,
  options: { verb?: 'chosen' | 'matched'; betterSupplies?: number } = {},
): string {
  if (!pair.components) return '';
  const verb = options.verb ?? 'matched';
  const fillPct = Math.min(100, (farmer.quantityKg / buyer.requiredQuantityKg) * 100);
  const delay = delayFromAvailability(farmer, buyer);
  const parts = [
    `${num(pair.distanceKm)} km road distance (${pair.components.distance}/100)`,
    `${formatRs(farmer.pricePerKg)}/kg (${priceGapText(farmer.pricePerKg, pair.marketReference)})`,
    `grade ${farmer.qualityGrade}`,
    `fills ${num(fillPct)}% of demand`,
    delay <= 0 ? 'available on time' : `${delay} day(s) late`,
  ];

  const better =
    options.betterSupplies && options.betterSupplies > 0
      ? ` It outranked ${options.betterSupplies} other feasible supplier(s) for this buyer.`
      : '';

  return `Farmer ${farmer.id} was ${verb} for Buyer ${buyer.id} because: ${parts.join(', ')}.${better}`;
}

/** Human-readable aggregation of why a buyer could not be fully served. */
export function summarizeUnmetIssues(issues: FeasibilityIssue[]): string[] {
  const counts = new Map<string, { message: string; count: number }>();
  for (const issue of issues) {
    const existing = counts.get(issue.code);
    if (existing) existing.count += 1;
    else counts.set(issue.code, { message: issue.message, count: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(({ message, count }) => (count > 1 ? `${message} (${count} suppliers)` : message));
}
