export type TrafficLevel = 'low' | 'moderate' | 'heavy' | 'jammed';

export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  demand: number; // in units (e.g., kg or parcels)
  isDepot?: boolean;
  timeWindow?: {
    start: number; // min from departure
    end: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  baseTimeMin: number;
  trafficLevel: TrafficLevel;
  congestionFactor: number; // multiplier: low=1.0, mod=1.4, heavy=1.9, jammed=2.8
}

export interface NetworkGraph {
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  depotId: string;
}

export type AlgorithmType = 'QPSO' | 'PSO' | 'GA' | 'ACO' | 'Dijkstra' | 'OR-Tools';

export type TrafficModeOption = 'Normal' | 'Peak Hours' | 'Low Traffic' | 'Real-Time Traffic';
export type CongestionSensitivity = 'Low' | 'Medium' | 'High';

export type TimeWindowPreset = 'Morning' | 'Business Hours' | 'Evening' | 'Custom';

export interface TimeWindowConfig {
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "06:00 PM"
  preset: TimeWindowPreset;
}

export interface TimeExecutionFeedback {
  expectedTimeMin: number;
  actualTimeMin: number;
  timeDiffMin: number; // actual - expected
  costImpact: number;  // financial impact (cost rate variance)
  status: 'delayed' | 'saved' | 'on-time';
  submittedAt: string;
  notes?: string;
}

export interface BulkOrderGeneratorParams {
  orderCount: number;
  geographicArea: string;
  quantityRange: [number, number];
  weightRangeKg: [number, number];
  priority: 'Mixed' | OrderPriority;
  timeWindow: string;
}

export interface OptimizationConfig {
  geographicArea: string;
  userLocation: {
    lat: number;
    lng: number;
  };
  trafficMode: TrafficModeOption;
  trafficWeight: number; // e.g. 0.0 to 1.0 (or 0% to 100%)
  congestionSensitivity: CongestionSensitivity;
  timeWindow?: TimeWindowConfig;
  timeFeedback?: TimeExecutionFeedback;
}

export interface AdvancedOptimizerParams {
  swarmSize: number;
  maxIterations: number;
  convergenceThreshold: number;
  inertiaWeight: number;
  cognitiveCoeff: number;
  socialCoeff: number;
  randomSeed: number;
  dynamicTrafficAdaptation: boolean;
}

export type OrderPriority = 'High' | 'Medium' | 'Low';

export interface BulkOrder {
  id: string;
  customerName: string;
  location: string;
  lat: number;
  lng: number;
  quantity: number;
  weightKg: number;
  priority: OrderPriority;
  timeWindow: string;
  status?: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered';
}

export interface OptimizerParams {
  algorithm: AlgorithmType;
  numVehicles: number;
  vehicleCapacity: number;
  swarmParticles: number;
  iterations: number;
  contractionExpansionCoeff: number; // alpha for QPSO
  trafficMode: 'static' | 'simulated-live';
}

export interface RouteStop {
  nodeId: string;
  nodeName: string;
  arrivalMin: number;
  cumulativeDistanceKm: number;
  cumulativeLoad: number;
}

export interface VehicleRoute {
  vehicleId: number;
  color: string;
  nodeIds: string[];
  stops: RouteStop[];
  coordinates: [number, number][];
  distanceKm: number;
  timeMin: number;
  load: number;
  capacity: number;
}

export interface ConvergencePoint {
  iter: number;
  best: number;
  mean: number;
}

export interface OptimizationResult {
  routes: VehicleRoute[];
  totalDistance: number;
  totalTime: number;
  congestionScore: number; // 0 to 100 index
  runtimeMs: number;
  convergence: ConvergencePoint[];
  baselineDistance?: number;
  baselineTime?: number;
}

export interface BenchmarkRequest {
  instanceSize: number;
  algorithms: AlgorithmType[];
  runs: number;
}

export interface BenchmarkRow {
  algorithm: AlgorithmType;
  bestCost: number;
  avgCost: number;
  stdDev: number;
  runtimeMs: number;
  iterToConverge: number;
}

export interface BenchmarkResponse {
  rows: BenchmarkRow[];
  instanceSize: number;
  runs: number;
}

export interface ScalabilityPoint {
  nodes: number;
  QPSO: number;
  PSO: number;
  GA: number;
  ACO: number;
  Dijkstra: number;
  ORTools: number;
}
