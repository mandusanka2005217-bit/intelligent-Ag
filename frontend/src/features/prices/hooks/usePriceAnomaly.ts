import { useQuery } from '@tanstack/react-query';
import type { PriceAnomalyResponse, Product } from '@contracts/types';
import { useScenarioStore } from '@core/store/scenarioStore';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

/** Rolling price series, anomaly flag and simple forecast for one product. */
export function usePriceAnomaly(product: Product) {
  const scenarioId = useScenarioStore((state) => state.scenarioId);

  return useQuery({
    queryKey: queryKeys.prices.anomaly(scenarioId, product),
    queryFn: async () => {
      const { data } = await apiClient.get<PriceAnomalyResponse>(
        `/prices/${encodeURIComponent(product)}/anomalies`,
        { params: { scenarioId } },
      );
      return data;
    },
    placeholderData: (previous) => previous,
    staleTime: 1000 * 60 * 5,
  });
}
