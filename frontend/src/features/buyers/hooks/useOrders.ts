import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderDto, Order, OrderStatus, UpdateOrderStatusDto } from '@contracts/types';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';
import { invalidateScenarioDependents } from '@/shared/services/invalidate';
import { useScenarioStore } from '@/core/store/scenarioStore';

async function fetchOrders(filters?: { buyerId?: string; farmerId?: string; status?: OrderStatus }): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders', { params: filters });
  return data;
}

async function createOrder(scenarioId: string, dto: CreateOrderDto): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', dto, { params: { scenarioId } });
  return data;
}

async function updateOrderStatus(
  scenarioId: string,
  orderId: string,
  dto: UpdateOrderStatusDto,
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${orderId}/status`, dto, {
    params: { scenarioId },
  });
  return data;
}

export function useOrders(filters?: { buyerId?: string; farmerId?: string; status?: OrderStatus }) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => fetchOrders(filters),
  });
}

export function useCreateOrder() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderDto) => createOrder(scenarioId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      invalidateScenarioDependents(queryClient, scenarioId);
    },
  });
}

export function useUpdateOrderStatus() {
  const scenarioId = useScenarioStore((state) => state.scenarioId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: UpdateOrderStatusDto }) =>
      updateOrderStatus(scenarioId, orderId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      invalidateScenarioDependents(queryClient, scenarioId);
    },
  });
}
