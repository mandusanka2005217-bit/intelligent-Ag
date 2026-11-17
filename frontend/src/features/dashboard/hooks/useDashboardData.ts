import { useQuery } from '@tanstack/react-query';
import type {
  AllocationBreakdownItem,
  DashboardStats,
  DistancePricePoint,
  ScoreDistributionBucket,
} from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

async function fetchDashboard<T>(path: string, scenarioId: string): Promise<T> {
  const { data } = await apiClient.get<T>(path, { params: { scenarioId } });
  return data;
}

/** Headline scenario KPIs. */
export function useDashboardStats() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.dashboard.stats(scenarioId),
    queryFn: () => fetchDashboard<DashboardStats>('/dashboard/stats', scenarioId),
    placeholderData: (previous) => previous,
  });
}

export function useScoreDistribution() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.dashboard.scoreDistribution(scenarioId),
    queryFn: () => fetchDashboard<ScoreDistributionBucket[]>('/dashboard/score-distribution', scenarioId),
    placeholderData: (previous) => previous,
  });
}

export function useDistancePriceData() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.dashboard.distancePrice(scenarioId),
    queryFn: () => fetchDashboard<DistancePricePoint[]>('/dashboard/distance-price', scenarioId),
    placeholderData: (previous) => previous,
  });
}

export function useAllocationBreakdown() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.dashboard.allocationBreakdown(scenarioId),
    queryFn: () =>
      fetchDashboard<AllocationBreakdownItem[]>('/dashboard/allocation-breakdown', scenarioId),
    placeholderData: (previous) => previous,
  });
}
