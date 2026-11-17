import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Buyer, BuyerFilters, CreateBuyerDto, UpdateBuyerDto } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import { invalidateScenarioDependents } from '@/shared/services/invalidate';

async function fetchBuyers(scenarioId: string, filters?: BuyerFilters): Promise<Buyer[]> {
  const { data } = await apiClient.get<Buyer[]>('/buyers', {
    params: { scenarioId, ...filters },
  });
  return data;
}

async function createBuyer(scenarioId: string, dto: CreateBuyerDto): Promise<Buyer> {
  const { data } = await apiClient.post<Buyer>('/buyers', { scenarioId, ...dto });
  return data;
}

async function updateBuyer(
  scenarioId: string,
  id: string,
  dto: UpdateBuyerDto,
): Promise<Buyer> {
  const { data } = await apiClient.patch<Buyer>(`/buyers/${id}`, dto, {
    params: { scenarioId },
  });
  return data;
}

async function deleteBuyer(scenarioId: string, id: string): Promise<void> {
  await apiClient.delete(`/buyers/${id}`, { params: { scenarioId } });
}

export function useBuyers(filters?: BuyerFilters) {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  return useQuery({
    queryKey: queryKeys.buyers.list(scenarioId, filters),
    queryFn: () => fetchBuyers(scenarioId, filters),
    placeholderData: (previous) => previous,
  });
}

export function useCreateBuyer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBuyerDto) => createBuyer(scenarioId, dto),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}

export function useUpdateBuyer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBuyerDto }) =>
      updateBuyer(scenarioId, id, dto),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}

export function useDeleteBuyer() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBuyer(scenarioId, id),
    onSuccess: () => invalidateScenarioDependents(queryClient, scenarioId),
  });
}
