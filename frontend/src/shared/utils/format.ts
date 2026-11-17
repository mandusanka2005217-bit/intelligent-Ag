/**
 * Utility formatting functions for the Agricultural Supply app.
 */

// ---- Currency ----
export function formatCurrency(
  value: number,
  currency = 'LKR',
  locale = 'en-LK',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ---- Distance ----
/**
 * Formats a distance value in kilometres.
 * @param km - Distance in kilometres
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ---- Date / Time ----
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
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, options).format(date);
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

// ---- Score ----
/**
 * Formats a 0–100 score to one decimal place with a suffix.
 */
export function formatScore(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return `${clamped.toFixed(1)} / 100`;
}

/**
 * Returns a human-readable label for a score range.
 */
export function scoreLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ---- Weight / Quantity ----
export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toLocaleString()} kg`;
}

// ---- Percentage ----
export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
