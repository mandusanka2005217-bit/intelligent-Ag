import { useQuery } from '@tanstack/react-query';
import type { AllocationResponse } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

/**
 * The allocation request is a read-only computation; it lives in TanStack Query
 * so switching tabs or components reuses the same cached response.
 */
export function useAllocation() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const weights = useScenarioStore((state) => state.weights);
  const strategy = useScenarioStore((state) => state.strategy);
  const shortagePolicy = useScenarioStore((state) => state.shortagePolicy);

  const params = { scenarioId, weights, strategy, shortagePolicy };

  return useQuery({
    queryKey: queryKeys.allocations.compute(params),
    queryFn: async () => {
      const { data } = await apiClient.post<AllocationResponse>('/allocate', params);
      return data;
    },
    placeholderData: (previous) => previous,
  });
}
