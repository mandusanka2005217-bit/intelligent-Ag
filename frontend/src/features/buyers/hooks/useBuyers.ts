import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import type { Buyer, CreateBuyerDto, UpdateBuyerDto, BuyerFilters } from '../types';

// ---- API functions ----
const fetchBuyers = async (filters?: BuyerFilters): Promise<Buyer[]> => {
  const { data } = await apiClient.get<Buyer[]>('/buyers', { params: filters });
  return data;
};

const fetchBuyerById = async (id: number): Promise<Buyer> => {
  const { data } = await apiClient.get<Buyer>(`/buyers/${id}`);
  return data;
};

const createBuyerApi = async (dto: CreateBuyerDto): Promise<Buyer> => {
  const { data } = await apiClient.post<Buyer>('/buyers', dto);
  return data;
};

const updateBuyerApi = async ({ id, dto }: { id: number; dto: UpdateBuyerDto }): Promise<Buyer> => {
  const { data } = await apiClient.patch<Buyer>(`/buyers/${id}`, dto);
  return data;
};

const deleteBuyerApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/buyers/${id}`);
};

// ---- Hooks ----

/** List all buyers with optional filters */
export function useBuyers(filters?: BuyerFilters) {
  return useQuery({
    queryKey: queryKeys.buyers.list(filters),
    queryFn: () => fetchBuyers(filters),
  });
}

/** Fetch a single buyer by ID */
export function useBuyer(id: number) {
  return useQuery({
    queryKey: queryKeys.buyers.detail(id),
    queryFn: () => fetchBuyerById(id),
    enabled: !!id,
  });
}

/** Create a new buyer */
export function useCreateBuyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBuyerDto) => createBuyerApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buyers.all });
    },
  });
}

/** Update an existing buyer */
export function useUpdateBuyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateBuyerDto }) =>
      updateBuyerApi({ id, dto }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buyers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buyers.detail(id) });
    },
  });
}

/** Delete a buyer */
export function useDeleteBuyer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBuyerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buyers.all });
    },
  });
}
