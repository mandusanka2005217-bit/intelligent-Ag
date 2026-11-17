import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { Farmer, CreateFarmerDto, UpdateFarmerDto, FarmerFilters } from '../types';

// ---- API functions ----
const fetchFarmers = async (filters?: FarmerFilters): Promise<Farmer[]> => {
  const { data } = await apiClient.get<Farmer[]>('/farmers', { params: filters });
  return data;
};

const fetchFarmerById = async (id: number): Promise<Farmer> => {
  const { data } = await apiClient.get<Farmer>(`/farmers/${id}`);
  return data;
};

const createFarmerApi = async (dto: CreateFarmerDto): Promise<Farmer> => {
  const { data } = await apiClient.post<Farmer>('/farmers', dto);
  return data;
};

const updateFarmerApi = async ({ id, dto }: { id: number; dto: UpdateFarmerDto }): Promise<Farmer> => {
  const { data } = await apiClient.patch<Farmer>(`/farmers/${id}`, dto);
  return data;
};

const deleteFarmerApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/farmers/${id}`);
};

// ---- Hooks ----

/** List all farmers with optional filters */
export function useFarmers(filters?: FarmerFilters) {
  return useQuery({
    queryKey: queryKeys.farmers.list(filters),
    queryFn: () => fetchFarmers(filters),
  });
}

/** Fetch a single farmer by ID */
export function useFarmer(id: number) {
  return useQuery({
    queryKey: queryKeys.farmers.detail(id),
    queryFn: () => fetchFarmerById(id),
    enabled: !!id,
  });
}

/** Create a new farmer */
export function useCreateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFarmerDto) => createFarmerApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farmers.all });
    },
  });
}

/** Update an existing farmer */
export function useUpdateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateFarmerDto }) =>
      updateFarmerApi({ id, dto }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farmers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.farmers.detail(id) });
    },
  });
}

/** Delete a farmer */
export function useDeleteFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFarmerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farmers.all });
    },
  });
}
