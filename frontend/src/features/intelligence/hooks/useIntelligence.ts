import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  DemandForecastingResponse,
  FreshnessIntelligenceResponse,
  PriceRecommendationResponse,
  ScenarioId,
  SimulationParameters,
  SimulationResult,
  SupplyRiskResponse,
  SustainabilityResponse,
  TransportationOptimizationResponse,
} from '@contracts/types';
import apiClient from '@/shared/services/api-client';
import { queryKeys } from '@/shared/services/query-keys';

export function useDemandForecasting(scenarioId: ScenarioId, horizon: number = 30) {
  return useQuery({
    queryKey: queryKeys.intelligence.forecasting(scenarioId, horizon),
    queryFn: async () => {
      const { data } = await apiClient.get<DemandForecastingResponse>('/intelligence/forecasting', {
        params: { scenarioId, horizon },
      });
      return data;
    },
  });
}

export function useTransportationOptimization(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.intelligence.transportation(scenarioId),
    queryFn: async () => {
      const { data } = await apiClient.get<TransportationOptimizationResponse>('/intelligence/transportation/optimize', {
        params: { scenarioId },
      });
      return data;
    },
  });
}

export function useFreshnessIntelligence(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.intelligence.freshness(scenarioId),
    queryFn: async () => {
      const { data } = await apiClient.get<FreshnessIntelligenceResponse>('/intelligence/freshness', {
        params: { scenarioId },
      });
      return data;
    },
  });
}

export function useSupplyRisk(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.intelligence.risk(scenarioId),
    queryFn: async () => {
      const { data } = await apiClient.get<SupplyRiskResponse>('/intelligence/risk', {
        params: { scenarioId },
      });
      return data;
    },
  });
}

export function usePriceRecommendations(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.intelligence.pricing(scenarioId),
    queryFn: async () => {
      const { data } = await apiClient.get<PriceRecommendationResponse>('/intelligence/pricing/recommendations', {
        params: { scenarioId },
      });
      return data;
    },
  });
}

export function useSustainabilityMetrics(scenarioId: ScenarioId) {
  return useQuery({
    queryKey: queryKeys.intelligence.sustainability(scenarioId),
    queryFn: async () => {
      const { data } = await apiClient.get<SustainabilityResponse>('/intelligence/sustainability', {
        params: { scenarioId },
      });
      return data;
    },
  });
}

export function useWhatIfSimulation(scenarioId: ScenarioId) {
  return useMutation({
    mutationFn: async (params: SimulationParameters) => {
      const { data } = await apiClient.post<SimulationResult>('/intelligence/simulation/run', params, {
        params: { scenarioId },
      });
      return data;
    },
  });
}
