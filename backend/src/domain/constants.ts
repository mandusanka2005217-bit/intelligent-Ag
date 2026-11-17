import type { Product, QualityGrade, ScenarioId, StrategyId } from '@contracts/types';

/** Runtime mirrors of the shared contract unions (contracts stay type-only). */
export const PRODUCTS = [
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
] as const satisfies readonly Product[];

export const QUALITY_GRADES = ['A', 'B', 'C'] as const satisfies readonly QualityGrade[];

export const SCENARIO_IDS = ['A', 'B'] as const satisfies readonly ScenarioId[];

export const STRATEGIES = ['greedy', 'min-cost-flow', 'fairness'] as const satisfies readonly StrategyId[];

export const STRATEGY_LABELS: Record<StrategyId, string> = {
  greedy: 'Greedy by score',
  'min-cost-flow': 'Min-cost max-flow',
  fairness: 'Fairness-weighted',
};

export const STRATEGY_DESCRIPTIONS: Record<StrategyId, string> = {
  greedy: 'Takes the highest-scoring feasible pair first. Fast, but small buyers can be starved.',
  'min-cost-flow':
    'Maximises total kg allocated, then minimises score loss plus transport cost using successive shortest paths.',
  fairness:
    'Concave-welfare greedy that protects low-fill buyers; usually raises Jain fairness at a small score cost.',
};
