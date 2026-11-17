/**
 * TanStack Query key factory for all features.
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.farmers.list(filters) })
 *   useQuery({ queryKey: queryKeys.farmers.detail(id) })
 */

export const queryKeys = {
  farmers: {
    all: ['farmers'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.farmers.all, 'list', filters ?? {}] as const,
    detail: (id: string | number) =>
      [...queryKeys.farmers.all, 'detail', id] as const,
  },

  buyers: {
    all: ['buyers'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.buyers.all, 'list', filters ?? {}] as const,
    detail: (id: string | number) =>
      [...queryKeys.buyers.all, 'detail', id] as const,
  },

  matches: {
    all: ['matches'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.matches.all, 'list', filters ?? {}] as const,
    detail: (id: string | number) =>
      [...queryKeys.matches.all, 'detail', id] as const,
  },

  allocations: {
    all: ['allocations'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.allocations.all, 'list', filters ?? {}] as const,
    detail: (id: string | number) =>
      [...queryKeys.allocations.all, 'detail', id] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    scoreDistribution: () => [...queryKeys.dashboard.all, 'score-distribution'] as const,
    distancePrice: () => [...queryKeys.dashboard.all, 'distance-price'] as const,
    allocationBreakdown: () => [...queryKeys.dashboard.all, 'allocation-breakdown'] as const,
  },
} as const;
