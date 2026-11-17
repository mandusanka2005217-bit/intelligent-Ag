import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { Match, MatchFilters, RunMatchingResult } from '../types';

// ---- API functions ----
const fetchMatches = async (filters?: MatchFilters): Promise<Match[]> => {
  const { data } = await apiClient.get<Match[]>('/matches', { params: filters });
  return data;
};

const runMatchingApi = async (): Promise<RunMatchingResult> => {
  const { data } = await apiClient.post<RunMatchingResult>('/matches/run');
  return data;
};

// ---- Hooks ----

/** List all existing matches */
export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: queryKeys.matches.list(filters),
    queryFn: () => fetchMatches(filters),
  });
}

/** Trigger the matching algorithm on the backend */
export function useRunMatching() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runMatchingApi,
    onSuccess: () => {
      // Invalidate matches and dashboard stats after a new run
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
