import type { Product, ScenarioId } from '@contracts/types';

/**
 * TanStack Query key factory. Every server request for scenario-dependent data
 * includes the scenario id, so switching scenarios never serves stale data.
 */
export const queryKeys = {
  scenarios: {
    all: ['scenarios'] as const,
    list: () => [...queryKeys.scenarios.all, 'list'] as const,
    data: (scenarioId: ScenarioId) =>
      [...queryKeys.scenarios.all, 'data', scenarioId] as const,
  },

  farmers: {
    all: ['farmers'] as const,
    list: (scenarioId: ScenarioId, filters?: object) =>
      [...queryKeys.farmers.all, 'list', scenarioId, filters ?? {}] as const,
    detail: (scenarioId: ScenarioId, id: string) =>
      [...queryKeys.farmers.all, 'detail', scenarioId, id] as const,
  },

  buyers: {
    all: ['buyers'] as const,
    list: (scenarioId: ScenarioId, filters?: object) =>
      [...queryKeys.buyers.all, 'list', scenarioId, filters ?? {}] as const,
    detail: (scenarioId: ScenarioId, id: string) =>
      [...queryKeys.buyers.all, 'detail', scenarioId, id] as const,
  },

  matches: {
    all: ['matches'] as const,
    list: (params: object) =>
      [...queryKeys.matches.all, 'list', params] as const,
  },

  allocations: {
    all: ['allocations'] as const,
    compute: (params: object) =>
      [...queryKeys.allocations.all, 'compute', params] as const,
  },

  compare: {
    all: ['compare'] as const,
    result: (params: object) =>
      [...queryKeys.compare.all, 'result', params] as const,
  },

  prices: {
    all: ['prices'] as const,
    anomaly: (scenarioId: ScenarioId, product: Product) =>
      [...queryKeys.prices.all, 'anomaly', scenarioId, product] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (filters?: object) => [...queryKeys.orders.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    stats: (scenarioId: ScenarioId) =>
      [...queryKeys.dashboard.all, 'stats', scenarioId] as const,
    scoreDistribution: (scenarioId: ScenarioId) =>
      [...queryKeys.dashboard.all, 'score-distribution', scenarioId] as const,
    distancePrice: (scenarioId: ScenarioId) =>
      [...queryKeys.dashboard.all, 'distance-price', scenarioId] as const,
    allocationBreakdown: (scenarioId: ScenarioId) =>
      [...queryKeys.dashboard.all, 'allocation-breakdown', scenarioId] as const,
  },
} as const;
