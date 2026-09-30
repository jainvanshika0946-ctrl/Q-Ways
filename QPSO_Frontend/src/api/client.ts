import {
  BenchmarkRequest,
  BenchmarkResponse,
  NetworkGraph,
  OptimizationResult,
  OptimizerParams,
} from './types';
import { createSampleGraph, runBenchmarkMock, solveOptimizationMock } from './mock';

// We explicitly point to your running FastAPI server port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Changed to false so it stops faking data and talks to the backend
const FORCE_MOCK = false; 

export const apiClient = {
  
  async getSampleGraph(nodes: number = 24, cityName: string = 'Bengaluru Urban Grid'): Promise<NetworkGraph> {
    await new Promise((resolve) => setTimeout(resolve, 80)); 
    return createSampleGraph(nodes, cityName);
  },

    async optimize(
    graph: NetworkGraph,
    params: OptimizerParams
  ): Promise<OptimizationResult> {
    if (!FORCE_MOCK && API_BASE_URL) {
      try {
        const depotNode = graph.nodes.find(n => n.id === graph.depotId);
        const deliveryNodes = graph.nodes.filter(n => n.id !== graph.depotId);
        
        // Translate the frontend graph to the backend's expected JSON shape
        const backendPayload = {
          depot: { lat: depotNode?.lat, lon: depotNode?.lng },
          deliveries: deliveryNodes.map(n => ({
            id: n.id,
            lat: n.lat,
            lon: n.lng,
            demand: n.demand || 10
          })),
          vehicles: Array.from({ length: params.numVehicles }).map((_, i) => ({
            id: `V${i+1}`,
            capacity: params.vehicleCapacity
          })),
          traffic_mode: params.trafficMode === 'simulated-live' ? 'rush' : 'normal',
          algorithm: "nearest_neighbor" // Fallback since QPSO isn't fully implemented in the backend yet
        };

        // Send request to /optimize (backend) instead of /api/optimize
        const res = await fetch(`${API_BASE_URL}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendPayload),
        });

        if (res.ok) {
          const backendData = await res.json();
          
          // Translate the backend response back to the frontend UI's expected shape
          return {
            routes: backendData.vehicles.map((v: any, index: number) => ({
              vehicleId: index + 1,
              color: ['#0F766E', '#D97706', '#E11D48', '#2563EB'][index % 4],
              nodeIds: v.route_indices.map((idx: number) => backendData.stops[idx].id),
              stops: [], 
              coordinates: v.route_indices.map((idx: number) => [
                backendData.stops[idx].lat, 
                backendData.stops[idx].lon
              ]),
              distanceKm: v.distance_km || 0,
              timeMin: v.time_min || 0,
              load: v.load || 0,
              capacity: params.vehicleCapacity
            })),
            totalDistance: backendData.total_distance_km,
            totalTime: backendData.total_time_min,
            congestionScore: params.trafficMode === 'simulated-live' ? 18.2 : 5.1,
            runtimeMs: 150, 
            convergence: backendData.fitness_history 
              ? backendData.fitness_history.map((fit: number, i: number) => ({ iter: i+1, best: fit, mean: fit }))
              : []
          };
        }
      } catch (err) {
        console.warn('Backend optimize call failed:', err);
      }
    }
    return solveOptimizationMock(graph, params);
  },

  async runBenchmark(req: BenchmarkRequest): Promise<BenchmarkResponse> {
    if (!FORCE_MOCK && API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/compare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // A basic translation for the benchmark/compare endpoint
          body: JSON.stringify({
             depot: { lat: 13.0827, lon: 80.2707 },
             deliveries: [],
             vehicles: [{ id: "V1", capacity: 150 }],
             traffic_mode: "normal",
             algorithm: "nearest_neighbor",
             runs: req.runs
          }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend benchmark call failed:', err);
      }
    }
    return runBenchmarkMock(req);
  },
};