import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MatchesResponse, WeightVector } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

interface MatchParams {
  scenarioId: string;
  weights: WeightVector;
  minScore: number;
  limit: number;
}

async function fetchMatches(params: MatchParams): Promise<MatchesResponse> {
  const { data } = await apiClient.post<MatchesResponse>('/matches', params);
  return data;
}

/**
 * Scored candidate pairs for the active scenario. This is a POST because the
 * weight vector is a structured body, but it is still a pure read request, so
 * TanStack Query caches it like any other query.
 */
export function useMatches(filters?: { minScore?: number; limit?: number }) {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const weights = useScenarioStore((state) => state.weights);
  const params: MatchParams = {
    scenarioId,
    weights,
    minScore: filters?.minScore ?? 0,
    limit: filters?.limit ?? 200,
  };

  return useQuery({
    queryKey: queryKeys.matches.list(params),
    queryFn: () => fetchMatches(params),
    placeholderData: (previous) => previous,
  });
}

export function useRunMatching(filters?: { minScore?: number; limit?: number }) {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const weights = useScenarioStore((state) => state.weights);
  const queryClient = useQueryClient();
  const params: MatchParams = {
    scenarioId,
    weights,
    minScore: filters?.minScore ?? 0,
    limit: filters?.limit ?? 200,
  };

  return useMutation({
    mutationFn: () => fetchMatches(params),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.matches.list(params), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.compare.all });
    },
  });
}
