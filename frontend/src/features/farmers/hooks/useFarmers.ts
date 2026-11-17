import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFarmerDto, Farmer, FarmerFilters, UpdateFarmerDto } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import { invalidateScenarioDependents } from '@/shared/services/invalidate';

async function fetchFarmers(
  scenarioId: string,
  filters?: FarmerFilters,
): Promise<Farmer[]> {
  const { data } = await apiClient.get<Farmer[]>('/farmers', {
    params: { scenarioId, ...filters },
  });
  return data;
}

async function createFarmer(scenarioId: string, dto: CreateFarmerDto): Promise<Farmer> {
  const { data } = await apiClient.post<Farmer>('/farmers', { scenarioId, ...dto });
  return data;
}

async function updateFarmer(
  scenarioId: string,
  id: string,
  dto: UpdateFarmerDto,
): Promise<Farmer> {
  const { data } = await apiClient.patch<Farmer>(`/farmers/${id}`, dto, {
    params: { scenarioId },
  });
  return data;
}

async function deleteFarmer(scenarioId: string, id: string): Promise<void> {
  await apiClient.delete(`/farmers/${id}`, { params: { scenarioId } });
}

/** List farmers for the active scenario with optional filters. */
export function useFarmers(filters?: FarmerFilters) {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.farmers.list(scenarioId, filters),
    queryFn: () => fetchFarmers(scenarioId, filters),
    placeholderData: (previous) => previous,
  });
}

export function useCreateFarmer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFarmerDto) => createFarmer(scenarioId, dto),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}

export function useUpdateFarmer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFarmerDto }) =>
      updateFarmer(scenarioId, id, dto),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}

export function useDeleteFarmer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFarmer(scenarioId, id),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}
