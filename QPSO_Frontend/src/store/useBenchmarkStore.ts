import { create } from 'zustand';
import { AlgorithmType, BenchmarkResponse, BenchmarkRow, ScalabilityPoint } from '../api/types';
import { runBenchmarkMock, SCALABILITY_DATA } from '../api/mock';
import { apiClient } from '../api/client';

interface BenchmarkState {
  instanceSize: number;
  algorithms: AlgorithmType[];
  runs: number;
  results: BenchmarkResponse;
  isRunning: boolean;
  sortColumn: keyof BenchmarkRow;
  sortDirection: 'asc' | 'desc';
  scalabilityData: ScalabilityPoint[];

  // Actions
  setInstanceSize: (size: number) => void;
  toggleAlgorithm: (algo: AlgorithmType) => void;
  setRuns: (runs: number) => void;
  runBenchmark: () => Promise<void>;
  setSorting: (col: keyof BenchmarkRow) => void;
}

const defaultAlgorithms: AlgorithmType[] = ['QPSO', 'PSO', 'GA', 'ACO', 'Dijkstra', 'OR-Tools'];

const initialBenchmarkResponse: BenchmarkResponse = runBenchmarkMock({
  instanceSize: 50,
  algorithms: defaultAlgorithms,
  runs: 10,
});

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  instanceSize: 50,
  algorithms: defaultAlgorithms,
  runs: 10,
  results: initialBenchmarkResponse,
  isRunning: false,
  sortColumn: 'bestCost',
  sortDirection: 'asc',
  scalabilityData: SCALABILITY_DATA,

  setInstanceSize: (instanceSize: number) => {
    set({ instanceSize });
  },

  toggleAlgorithm: (algo: AlgorithmType) => {
    const { algorithms } = get();
    if (algorithms.includes(algo)) {
      if (algorithms.length > 1) {
        set({ algorithms: algorithms.filter((a) => a !== algo) });
      }
    } else {
      set({ algorithms: [...algorithms, algo] });
    }
  },

  setRuns: (runs: number) => {
    set({ runs });
  },

  runBenchmark: async () => {
    const { instanceSize, algorithms, runs } = get();
    set({ isRunning: true });

    try {
      const response = await apiClient.runBenchmark({
        instanceSize,
        algorithms,
        runs,
      });

      set({
        results: response,
        isRunning: false,
      });
    } catch (e) {
      console.error('Benchmark failed:', e);
      set({ isRunning: false });
    }
  },

  setSorting: (col: keyof BenchmarkRow) => {
    const { sortColumn, sortDirection } = get();
    if (sortColumn === col) {
      set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortColumn: col, sortDirection: 'asc' });
    }
  },
}));
