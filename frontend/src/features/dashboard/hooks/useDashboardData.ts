import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

// ---- Dashboard data types ----
export interface DashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  totalMatches: number;
  avgSuitabilityScore: number;
  totalAllocatedKg: number;
  avgUtilizationPct: number;
}

export interface ScoreDistributionBucket {
  range: string;   // e.g. "0-10", "10-20", ...
  count: number;
}

export interface DistancePricePoint {
  farmerId: number;
  farmerName: string;
  distanceKm: number;
  pricePerKg: number;
  cropType: string;
}

export interface AllocationBreakdownItem {
  name: string;   // crop type or match label
  value: number;  // allocated kg
}

// ---- API functions ----
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
  return data;
};

const fetchScoreDistribution = async (): Promise<ScoreDistributionBucket[]> => {
  const { data } = await apiClient.get<ScoreDistributionBucket[]>('/dashboard/score-distribution');
  return data;
};

const fetchDistancePrice = async (): Promise<DistancePricePoint[]> => {
  const { data } = await apiClient.get<DistancePricePoint[]>('/dashboard/distance-price');
  return data;
};

const fetchAllocationBreakdown = async (): Promise<AllocationBreakdownItem[]> => {
  const { data } = await apiClient.get<AllocationBreakdownItem[]>('/dashboard/allocation-breakdown');
  return data;
};

// ---- Hooks ----

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
  });
}

export function useScoreDistribution() {
  return useQuery({
    queryKey: queryKeys.dashboard.scoreDistribution(),
    queryFn: fetchScoreDistribution,
  });
}

export function useDistancePriceData() {
  return useQuery({
    queryKey: queryKeys.dashboard.distancePrice(),
    queryFn: fetchDistancePrice,
  });
}

export function useAllocationBreakdown() {
  return useQuery({
    queryKey: queryKeys.dashboard.allocationBreakdown(),
    queryFn: fetchAllocationBreakdown,
  });
}
