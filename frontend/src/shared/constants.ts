import type { Product, QualityGrade } from '@contracts/types';

/** Products that exist in the simulated dataset. */
export const PRODUCTS: Product[] = [
  'Tomato',
  'Carrot',
  'Cabbage',
  'Beans',
  'Onion',
  'Potato',
  'Rice',
  'Maize',
  'Chili',
  'Coconut',
];

export const QUALITY_GRADES: QualityGrade[] = ['A', 'B', 'C'];

export const QUALITY_LABELS: Record<QualityGrade, string> = {
  A: 'A — premium',
  B: 'B — standard',
  C: 'C — processing',
};

export const SCENARIO_LABELS = {
  A: 'Normal season',
  B: 'Disrupted / shortage',
} as const;

/** The fixed "today" used by the simulated dataset. */
export const DEMO_TODAY = '2026-11-15';

export const STRATEGY_OPTIONS = [
  {
    id: 'greedy' as const,
    label: 'Greedy by score',
    short: 'Greedy',
    description: 'Highest-scoring feasible pair first. Fast, but small buyers can be starved.',
  },
  {
    id: 'min-cost-flow' as const,
    label: 'Min-cost max-flow',
    short: 'Min-cost flow',
    description: 'Maximises total kg, then minimises score loss plus transport cost.',
  },
  {
    id: 'fairness' as const,
    label: 'Fairness-weighted',
    short: 'Fairness',
    description: 'Concave welfare that protects low-fill buyers, usually raising Jain’s index.',
  },
];

export const PRODUCT_COLOURS: Record<string, string> = {
  Tomato: '#d64545',
  Carrot: '#e07b39',
  Cabbage: '#4f8f5b',
  Beans: '#3d7a5c',
  Onion: '#8a5a9b',
  Potato: '#a07a4f',
  Rice: '#c2a24a',
  Maize: '#d9b23c',
  Chili: '#c23b2e',
  Coconut: '#6b7f3a',
};

export function productColour(product: string): string {
  return PRODUCT_COLOURS[product] ?? '#2d6a4f';
}
