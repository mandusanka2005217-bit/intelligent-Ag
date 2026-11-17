import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { Allocation, AllocationFilters } from '../types';

// ---- API functions ----
const fetchAllocations = async (filters?: AllocationFilters): Promise<Allocation[]> => {
  const { data } = await apiClient.get<Allocation[]>('/allocations', { params: filters });
  return data;
};

const fetchAllocationById = async (id: number): Promise<Allocation> => {
  const { data } = await apiClient.get<Allocation>(`/allocations/${id}`);
  return data;
};

// ---- Hooks ----

/** List all allocations */
export function useAllocations(filters?: AllocationFilters) {
  return useQuery({
    queryKey: queryKeys.allocations.list(filters),
    queryFn: () => fetchAllocations(filters),
  });
}

/** Get a single allocation by ID */
export function useAllocation(id: number) {
  return useQuery({
    queryKey: queryKeys.allocations.detail(id),
    queryFn: () => fetchAllocationById(id),
    enabled: !!id,
  });
}
