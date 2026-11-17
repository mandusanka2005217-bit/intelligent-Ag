import type { QueryClient } from '@tanstack/react-query';
import type { ScenarioId } from '@contracts/types';
import { queryKeys } from './query-keys';

/**
 * Anything that touches farmers, buyers or prices invalidates the scenario
 * snapshot plus every derived result (matches, allocations, comparison,
 * dashboard). Keeping this in one place prevents stale numbers after edits.
 */
export function invalidateScenarioDependents(queryClient: QueryClient, scenarioId: ScenarioId): void {
  void scenarioId;
  void queryClient.invalidateQueries({ queryKey: queryKeys.scenarios.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.farmers.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.buyers.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.compare.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.prices.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}
