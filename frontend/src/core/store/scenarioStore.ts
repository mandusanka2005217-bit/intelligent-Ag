import { create } from 'zustand';
import type { ScenarioId, ShortagePolicy, StrategyId, WeightVector } from '@contracts/types';

/**
 * UI / scenario state only.
 *
 * All server data lives in TanStack Query. This store holds exactly the things
 * the user chooses in the interface: the active scenario, the scoring weights,
 * the allocation strategy and the shortage policy.
 */
export const DEFAULT_WEIGHTS: WeightVector = {
  price: 0.3,
  distance: 0.25,
  quantity: 0.2,
  quality: 0.15,
  availability: 0.1,
};

interface ScenarioState {
  scenarioId: ScenarioId;
  weights: WeightVector;
  strategy: StrategyId;
  shortagePolicy: ShortagePolicy;
  setScenario: (scenarioId: ScenarioId) => void;
  setWeight: (key: keyof WeightVector, value: number) => void;
  setWeights: (weights: WeightVector) => void;
  resetWeights: () => void;
  setStrategy: (strategy: StrategyId) => void;
  setShortagePolicy: (policy: ShortagePolicy) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarioId: 'A',
  weights: { ...DEFAULT_WEIGHTS },
  strategy: 'min-cost-flow',
  shortagePolicy: 'score-priority',
  setScenario: (scenarioId) => set({ scenarioId }),
  setWeight: (key, value) =>
    set((state) => ({ weights: { ...state.weights, [key]: value } })),
  setWeights: (weights) => set({ weights }),
  resetWeights: () => set({ weights: { ...DEFAULT_WEIGHTS } }),
  setStrategy: (strategy) => set({ strategy }),
  setShortagePolicy: (shortagePolicy) => set({ shortagePolicy }),
}));
