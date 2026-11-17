import { useQuery } from '@tanstack/react-query';
import type { ScenarioData, ScenarioId, ScenarioMeta } from '@contracts/types';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

async function fetchScenarios(): Promise<ScenarioMeta[]> {
  const { data } = await apiClient.get<ScenarioMeta[]>('/scenarios');
  return data;
}

async function fetchScenarioData(scenarioId: ScenarioId): Promise<ScenarioData> {
  const { data } = await apiClient.get<ScenarioData>(`/scenarios/${scenarioId}/data`);
  return data;
}

/** Both scenario descriptors (names, disruption, totals). */
export function useScenarios() {
  return useQuery({
    queryKey: queryKeys.scenarios.list(),
    queryFn: fetchScenarios,
    staleTime: 1000 * 60 * 10,
  });
}

/** Farmers, buyers, towns, prices and constraints for one scenario. */
export function useScenarioData(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.scenarios.data(scenarioId),
    queryFn: () => fetchScenarioData(scenarioId),
    staleTime: 1000 * 60 * 5,
  });
}

/** Town list for form selects; falls back to an empty list while loading. */
export function useTowns(scenarioId: ScenarioId): string[] {
  const { data } = useScenarioData(scenarioId);
  return (data?.locations ?? []).map((town) => town.name).sort((a, b) => a.localeCompare(b));
}
