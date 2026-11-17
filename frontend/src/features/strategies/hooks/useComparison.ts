import { useQuery } from '@tanstack/react-query';
import type { CompareResponse, ShortagePolicy } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

/**
 * Run all three allocators on the identical instance. This is a POST because the
 * weight vector and policy are structured, but it is a pure computation, so it is
 * cached by TanStack Query.
 */
export function useComparison() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const weights = useScenarioStore((state) => state.weights);
  const shortagePolicy: ShortagePolicy = useScenarioStore((state) => state.shortagePolicy);

  const params = { scenarioId, weights, shortagePolicy };

  return useQuery({
    queryKey: queryKeys.compare.result(params),
    queryFn: async () => {
      const { data } = await apiClient.post<CompareResponse>('/compare', params);
      return data;
    },
    placeholderData: (previous) => previous,
  });
}
