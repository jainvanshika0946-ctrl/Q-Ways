import { create } from 'zustand';
import { NetworkGraph, OptimizationResult, OptimizerParams, OptimizationConfig, AdvancedOptimizerParams, TimeExecutionFeedback } from '../api/types';
import { apiClient } from '../api/client';
import { solveOptimizationMock, createSampleGraph } from '../api/mock';

interface OptimizerState {
  params: OptimizerParams;
  config: OptimizationConfig;
  advancedParams: AdvancedOptimizerParams;
  timeFeedback: TimeExecutionFeedback | null;
  isRunning: boolean;
  progress: number; // 0 to 100
  currentIteration: number;
  result: OptimizationResult | null;
  error: string | null;

  // Actions
  setParams: (updates: Partial<OptimizerParams>) => void;
  setAdvancedParams: (updates: Partial<AdvancedOptimizerParams>) => void;
  setConfig: (updates: Partial<OptimizationConfig>) => void;
  setUserLocation: (lat: number, lng: number) => void;
  submitTimeFeedback: (actualTimeMin: number, costRatePerMin?: number, notes?: string) => void;
  runOptimization: (graph: NetworkGraph) => Promise<void>;
  stopOptimization: () => void;
  reset: () => void;
}

const defaultConfig: OptimizationConfig = {
  geographicArea: 'Bengaluru',
  userLocation: {
    lat: 12.9716,
    lng: 77.5946,
  },
  trafficMode: 'Normal',
  trafficWeight: 0.65,
  congestionSensitivity: 'Medium',
  timeWindow: {
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    preset: 'Business Hours',
  },
};

const defaultAdvancedParams: AdvancedOptimizerParams = {
  swarmSize: 50,
  maxIterations: 200,
  convergenceThreshold: 0.001,
  inertiaWeight: 0.72,
  cognitiveCoeff: 1.49,
  socialCoeff: 1.49,
  randomSeed: 42,
  dynamicTrafficAdaptation: true,
};

const defaultParams: OptimizerParams = {
  algorithm: 'QPSO',
  numVehicles: 4,
  vehicleCapacity: 150,
  swarmParticles: 40,
  iterations: 120,
  contractionExpansionCoeff: 0.75,
  trafficMode: 'simulated-live',
};

// Initial precomputed baseline for instant realistic rendering on load
const initialSampleGraph = createSampleGraph(24, 'Bengaluru Urban Grid');
const initialMockResult: OptimizationResult = solveOptimizationMock(initialSampleGraph, defaultParams);

export const useOptimizerStore = create<OptimizerState>((set, get) => {
  let abortController: boolean = false;

  return {
    params: defaultParams,
    config: defaultConfig,
    advancedParams: defaultAdvancedParams,
    timeFeedback: null,
    isRunning: false,
    progress: 100,
    currentIteration: 120,
    result: initialMockResult,
    error: null,

    setParams: (updates: Partial<OptimizerParams>) => {
      set((state) => ({
        params: { ...state.params, ...updates },
      }));
    },

    setAdvancedParams: (updates: Partial<AdvancedOptimizerParams>) => {
      set((state) => ({
        advancedParams: { ...state.advancedParams, ...updates },
      }));
    },

    setConfig: (updates: Partial<OptimizationConfig>) => {
      set((state) => ({
        config: { ...state.config, ...updates },
      }));
    },

    setUserLocation: (lat: number, lng: number) => {
      set((state) => ({
        config: {
          ...state.config,
          userLocation: { lat, lng },
        },
      }));
    },

    submitTimeFeedback: (actualTimeMin: number, costRatePerMin: number = 8.5, notes?: string) => {
      const { result } = get();
      const expectedTimeMin = result?.totalTime ? parseFloat(result.totalTime.toFixed(1)) : 136.0;
      const timeDiffMin = parseFloat((actualTimeMin - expectedTimeMin).toFixed(1));
      const costImpact = parseFloat((timeDiffMin * costRatePerMin).toFixed(2));
      const status: 'delayed' | 'saved' | 'on-time' =
        timeDiffMin > 0.5 ? 'delayed' : timeDiffMin < -0.5 ? 'saved' : 'on-time';

      const feedback: TimeExecutionFeedback = {
        expectedTimeMin,
        actualTimeMin,
        timeDiffMin,
        costImpact,
        status,
        submittedAt: new Date().toISOString(),
        notes,
      };

      set((state) => ({
        timeFeedback: feedback,
        config: {
          ...state.config,
          timeFeedback: feedback,
        },
      }));
    },

    runOptimization: async (graph: NetworkGraph) => {
      const { params } = get();
      abortController = false;

      set({
        isRunning: true,
        progress: 0,
        currentIteration: 0,
        error: null,
      });

      try {
        const totalIters = params.iterations;
        const stepSize = Math.max(1, Math.floor(totalIters / 20));

        // Animated progress tick
        for (let iter = 1; iter <= totalIters; iter += stepSize) {
          if (abortController) {
            set({ isRunning: false });
            return;
          }

          set({
            currentIteration: iter,
            progress: Math.min(100, Math.round((iter / totalIters) * 100)),
          });

          await new Promise((resolve) => setTimeout(resolve, 35));
        }

        const optimizationResult = await apiClient.optimize(graph, params);

        if (!abortController) {
          set({
            result: optimizationResult,
            isRunning: false,
            progress: 100,
            currentIteration: totalIters,
          });
        }
      } catch (err: unknown) {
        if (!abortController) {
          set({
            isRunning: false,
            error: err instanceof Error ? err.message : 'Optimization failed',
          });
        }
      }
    },

    stopOptimization: () => {
      abortController = true;
      set({ isRunning: false });
    },

    reset: () => {
      set({
        result: null,
        progress: 0,
        currentIteration: 0,
        isRunning: false,
      });
    },
  };
});
