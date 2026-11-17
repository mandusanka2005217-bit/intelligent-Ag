/**
 * Formatting helpers shared across features. All money values are Sri Lankan
 * rupees (Rs) because the simulated dataset is set in Sri Lanka.
 */

export function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `Rs ${safe.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRsPerKg(value: number): string {
  return `${formatCurrency(value)}/kg`;
}

export function formatNumber(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString('en-LK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Weight in kg, switching to tonnes above 1,000 kg. */
export function formatWeight(kg: number): string {
  const safe = Number.isFinite(kg) ? kg : 0;
  if (Math.abs(safe) >= 1000) return `${(safe / 1000).toFixed(2)} t`;
  return `${safe.toLocaleString('en-LK')} kg`;
}

/** Short weight for dense tables: 1.2t / 850kg. */
export function formatWeightShort(kg: number): string {
  const safe = Number.isFinite(kg) ? kg : 0;
  if (Math.abs(safe) >= 1000) return `${(safe / 1000).toFixed(1)}t`;
  return `${Math.round(safe)}kg`;
}

export function formatDistance(km: number): string {
  const safe = Number.isFinite(km) ? km : 0;
  if (safe < 1) return `${Math.round(safe * 1000)} m`;
  return `${safe.toFixed(1)} km`;
}

export function formatPct(value: number, decimals = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${(safe * 100).toFixed(decimals)}%`;
}

export function formatScore(score: number): string {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  return `${clamped.toFixed(1)} / 100`;
}

export function scoreLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export function formatDate(
  dateStr: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale = 'en-LK',
): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateShort(dateStr: string | Date): string {
  return formatDate(dateStr, { month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr: string | Date): string {
  return formatDate(dateStr, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function signed(value: number, decimals = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe >= 0 ? '+' : ''}${safe.toFixed(decimals)}`;
}

/** Ordinal form of an integer: 1 → "1st", 22 → "22nd", 100 → "100th". */
export function formatOrdinal(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  const mod100 = Math.abs(n) % 100;
  const mod10 = Math.abs(n) % 10;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/**
 * Buyer-relative rank label. 100 means the strongest feasible match for that
 * buyer, 0 the weakest; the extremes get plain language instead of "0th pct".
 */
export function formatBuyerRank(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  if (n >= 100) return 'best for buyer';
  if (n <= 0) return 'weakest fit';
  return `${formatOrdinal(n)} pct`;
}
