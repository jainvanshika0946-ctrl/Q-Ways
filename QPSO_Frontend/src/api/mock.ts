import {
  AlgorithmType,
  BenchmarkRequest,
  BenchmarkResponse,
  BenchmarkRow,
  ConvergencePoint,
  GraphEdge,
  GraphNode,
  NetworkGraph,
  OptimizationResult,
  OptimizerParams,
  RouteStop,
  ScalabilityPoint,
  TrafficLevel,
  VehicleRoute,
} from './types';

// Preset Indian Metropolitan Junctions for realistic urban topology
const BENGALURU_JUNCTIONS = [
  { name: 'Koramangala 4th Block Depot', lat: 12.9352, lng: 77.6245, isDepot: true, demand: 0 },
  { name: 'Indiranagar 100ft Road', lat: 12.9716, lng: 77.6412, demand: 28 },
  { name: 'MG Road Trinity Circle', lat: 12.9738, lng: 77.6186, demand: 34 },
  { name: 'Domlur Flyover Junction', lat: 12.9609, lng: 77.6387, demand: 22 },
  { name: 'HSR Layout Sector 1', lat: 12.9116, lng: 77.6389, demand: 42 },
  { name: 'BTM Layout Water Tank', lat: 12.9166, lng: 77.6101, demand: 31 },
  { name: 'Jayanagar 4th Block Cross', lat: 12.9299, lng: 77.5824, demand: 25 },
  { name: 'Richmond Circle Flyover', lat: 12.9667, lng: 77.5992, demand: 18 },
  { name: 'Shivajinagar Bus Terminus', lat: 12.9866, lng: 77.6033, demand: 36 },
  { name: 'Ulsoor Lake Promenade', lat: 12.9822, lng: 77.6244, demand: 19 },
  { name: 'Electronic City Toll Plaza', lat: 12.8452, lng: 77.6602, demand: 45 },
  { name: 'Bellandur Central Hub', lat: 12.9304, lng: 77.6784, demand: 38 },
  { name: 'Marathahalli Multiplex Junc', lat: 12.9553, lng: 77.7011, demand: 29 },
  { name: 'Whitefield ITPL Main Gate', lat: 12.9863, lng: 77.7337, demand: 40 },
  { name: 'Hebbal Interchange Lake', lat: 13.0358, lng: 77.5970, demand: 35 },
  { name: 'Yeshwanthpur Industrial Area', lat: 13.0238, lng: 77.5529, demand: 24 },
  { name: 'Rajajinagar 1st Block', lat: 12.9982, lng: 77.5530, demand: 21 },
  { name: 'Malleswaram 8th Cross', lat: 12.9988, lng: 77.5714, demand: 26 },
  { name: 'Majestic City Railway Stn', lat: 12.9772, lng: 77.5708, demand: 30 },
  { name: 'Basavanagudi Gandhi Bazaar', lat: 12.9421, lng: 77.5746, demand: 16 },
  { name: 'JP Nagar 6th Phase Ring Rd', lat: 12.9063, lng: 77.5855, demand: 32 },
  { name: 'Bannerghatta Vega City', lat: 12.8984, lng: 77.5997, demand: 27 },
  { name: 'Kalyan Nagar HRBR Layout', lat: 13.0182, lng: 77.6433, demand: 23 },
  { name: 'Banashankari BDA Complex', lat: 12.9255, lng: 77.5468, demand: 33 },
];

export const VEHICLE_PALETTE = [
  '#0F766E', // 1: Deep Teal
  '#D97706', // 2: Amber Ochre
  '#2563EB', // 3: Sapphire Blue
  '#7C3AED', // 4: Royal Violet
  '#DC2626', // 5: Crimson Red
  '#059669', // 6: Emerald
  '#DB2777', // 7: Deep Rose
  '#EA580C', // 8: Burnt Orange
];

/**
 * Calculates Euclidean / Haversine approximate distance in kilometers between two geo points
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Generates sample city graph or procedural random graph
 */
export function createSampleGraph(nodeCount: number = 24, cityName: string = 'Bengaluru Urban Grid'): NetworkGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const count = Math.min(Math.max(nodeCount, 8), 60);

  for (let i = 0; i < count; i++) {
    if (i < BENGALURU_JUNCTIONS.length) {
      const junc = BENGALURU_JUNCTIONS[i];
      nodes.push({
        id: `node-${i + 1}`,
        name: junc.name,
        lat: junc.lat,
        lng: junc.lng,
        demand: junc.demand,
        isDepot: i === 0,
        timeWindow: { start: 10 + (i % 6) * 15, end: 90 + (i % 6) * 20 },
      });
    } else {
      // Procedurally generate around city center
      const angle = (i / count) * 2 * Math.PI;
      const radius = 0.04 + Math.random() * 0.08;
      const lat = 12.95 + radius * Math.cos(angle);
      const lng = 77.62 + radius * Math.sin(angle) * 1.2;
      nodes.push({
        id: `node-${i + 1}`,
        name: `Urban Corridor Sector ${i + 1}`,
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        demand: 15 + Math.floor(Math.random() * 25),
        isDepot: false,
        timeWindow: { start: 15, end: 120 },
      });
    }
  }

  const depotId = nodes[0].id;

  // Create realistic planar road connections (k-nearest neighbors)
  let edgeIdCounter = 1;
  const connectedPairs = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const src = nodes[i];
    // Find closest 3-4 nodes
    const distances = nodes
      .map((target, idx) => ({
        target,
        idx,
        dist: calculateDistanceKm(src.lat, src.lng, target.lat, target.lng),
      }))
      .filter((d) => d.idx !== i)
      .sort((a, b) => a.dist - b.dist);

    const neighborsToConnect = distances.slice(0, 3 + (i % 2));

    for (const neighbor of neighborsToConnect) {
      const pairKey = [src.id, neighbor.target.id].sort().join('--');
      if (!connectedPairs.has(pairKey)) {
        connectedPairs.add(pairKey);
        
        // Assign realistic traffic profile
        const trafficRand = Math.random();
        let trafficLevel: TrafficLevel = 'low';
        let congestionFactor = 1.0;

        if (trafficRand > 0.82) {
          trafficLevel = 'jammed';
          congestionFactor = 2.8;
        } else if (trafficRand > 0.60) {
          trafficLevel = 'heavy';
          congestionFactor = 1.9;
        } else if (trafficRand > 0.35) {
          trafficLevel = 'moderate';
          congestionFactor = 1.4;
        }

        const distanceKm = Math.max(neighbor.dist, 0.8);
        const avgSpeedKmH = 32; // urban average
        const baseTimeMin = Math.round((distanceKm / avgSpeedKmH) * 60 * 10) / 10;

        edges.push({
          id: `edge-${edgeIdCounter++}`,
          source: src.id,
          target: neighbor.target.id,
          distanceKm,
          baseTimeMin,
          trafficLevel,
          congestionFactor,
        });
      }
    }
  }

  return {
    name: cityName,
    nodes,
    edges,
    depotId,
  };
}

/**
 * Realistic Mock Solver for POST /api/optimize
 */
export function solveOptimizationMock(
  graph: NetworkGraph,
  params: OptimizerParams
): OptimizationResult {
  const { algorithm, numVehicles, vehicleCapacity, iterations } = params;
  const depotNode = graph.nodes.find((n) => n.id === graph.depotId) || graph.nodes[0];
  const customerNodes = graph.nodes.filter((n) => n.id !== depotNode.id);

  // Partition customer nodes across vehicles using geographic angular sort
  const sortedCustomers = [...customerNodes].sort((a, b) => {
    const angleA = Math.atan2(a.lat - depotNode.lat, a.lng - depotNode.lng);
    const angleB = Math.atan2(b.lat - depotNode.lat, b.lng - depotNode.lng);
    return angleA - angleB;
  });

  const routes: VehicleRoute[] = [];
  const nodesPerVehicle = Math.ceil(sortedCustomers.length / numVehicles);

  let cumulativeTotalDistance = 0;
  let cumulativeTotalTime = 0;

  for (let v = 0; v < numVehicles; v++) {
    const assignedCustomers = sortedCustomers.slice(v * nodesPerVehicle, (v + 1) * nodesPerVehicle);
    if (assignedCustomers.length === 0) continue;

    // Order nodes: Depot -> C1 -> C2 ... -> Depot
    const stops: RouteStop[] = [];
    const coordinates: [number, number][] = [[depotNode.lat, depotNode.lng]];
    const nodeIds: string[] = [depotNode.id];

    stops.push({
      nodeId: depotNode.id,
      nodeName: depotNode.name,
      arrivalMin: 0,
      cumulativeDistanceKm: 0,
      cumulativeLoad: 0,
    });

    let currentLat = depotNode.lat;
    let currentLng = depotNode.lng;
    let routeDistance = 0;
    let routeTime = 0;
    let routeLoad = 0;

    assignedCustomers.forEach((cust, idx) => {
      const legDist = calculateDistanceKm(currentLat, currentLng, cust.lat, cust.lng);
      // Look up edge congestion if exists
      const edge = graph.edges.find(
        (e) =>
          (e.source === stops[stops.length - 1].nodeId && e.target === cust.id) ||
          (e.target === stops[stops.length - 1].nodeId && e.source === cust.id)
      );
      const cong = edge ? edge.congestionFactor : 1.2;
      const legTime = (legDist / 30) * 60 * cong;

      routeDistance += legDist;
      routeTime += legTime;
      routeLoad += cust.demand;
      currentLat = cust.lat;
      currentLng = cust.lng;

      nodeIds.push(cust.id);
      coordinates.push([cust.lat, cust.lng]);
      stops.push({
        nodeId: cust.id,
        nodeName: cust.name,
        arrivalMin: Math.round(routeTime),
        cumulativeDistanceKm: Math.round(routeDistance * 10) / 10,
        cumulativeLoad: Math.min(routeLoad, vehicleCapacity),
      });
    });

    // Return to depot
    const returnDist = calculateDistanceKm(currentLat, currentLng, depotNode.lat, depotNode.lng);
    const returnTime = (returnDist / 32) * 60 * 1.1;
    routeDistance += returnDist;
    routeTime += returnTime;
    nodeIds.push(depotNode.id);
    coordinates.push([depotNode.lat, depotNode.lng]);

    // Apply algorithm penalty / advantage factors
    let algoQualityMultiplier = 1.0;
    if (algorithm === 'QPSO') algoQualityMultiplier = 0.88; // Best route discovery
    else if (algorithm === 'OR-Tools') algoQualityMultiplier = 0.90;
    else if (algorithm === 'PSO') algoQualityMultiplier = 0.96;
    else if (algorithm === 'ACO') algoQualityMultiplier = 0.94;
    else if (algorithm === 'GA') algoQualityMultiplier = 0.98;
    else if (algorithm === 'Dijkstra') algoQualityMultiplier = 1.14; // Sub-optimal for multi-vehicle TSP

    const finalDistance = Math.round(routeDistance * algoQualityMultiplier * 10) / 10;
    const finalTime = Math.round(routeTime * algoQualityMultiplier * 10) / 10;

    cumulativeTotalDistance += finalDistance;
    cumulativeTotalTime += finalTime;

    routes.push({
      vehicleId: v + 1,
      color: VEHICLE_PALETTE[v % VEHICLE_PALETTE.length],
      nodeIds,
      stops,
      coordinates,
      distanceKm: finalDistance,
      timeMin: finalTime,
      load: Math.min(routeLoad, vehicleCapacity),
      capacity: vehicleCapacity,
    });
  }

  // Generate realistic convergence trajectory based on algorithm
  const convergence: ConvergencePoint[] = [];
  const baseCost = cumulativeTotalTime * 1.35;
  const targetCost = cumulativeTotalTime;
  const iters = Math.max(iterations, 20);

  for (let i = 1; i <= iters; i++) {
    const progress = i / iters;
    let decay = 0;

    if (algorithm === 'QPSO') {
      // Quantum tunneling allows steep descent with rapid convergence
      decay = 1 - Math.exp(-progress * 6.5);
    } else if (algorithm === 'PSO') {
      // Classical PSO: fast initial, then flattens due to velocity limitation
      decay = 1 - Math.exp(-progress * 3.8);
    } else if (algorithm === 'GA') {
      // Genetic Algorithm: stepwise stair-like improvements
      const step = Math.floor(progress * 5) / 5;
      decay = 1 - Math.exp(-step * 4.0);
    } else if (algorithm === 'ACO') {
      // ACO: pheromone reinforcement gradual curve
      decay = Math.pow(progress, 1.8);
    } else {
      decay = 1 - Math.exp(-progress * 2.5);
    }

    const currentBest = baseCost - (baseCost - targetCost) * decay;
    const jitter = (Math.random() - 0.5) * (baseCost * 0.015) * (1 - progress);
    const best = Math.round((currentBest + jitter) * 10) / 10;
    const mean = Math.round((best * (1 + 0.15 * (1 - progress))) * 10) / 10;

    convergence.push({ iter: i, best, mean });
  }

  // Runtime calculation
  let runtimeMs = 145;
  if (algorithm === 'QPSO') runtimeMs = 168;
  else if (algorithm === 'PSO') runtimeMs = 185;
  else if (algorithm === 'GA') runtimeMs = 342;
  else if (algorithm === 'ACO') runtimeMs = 490;
  else if (algorithm === 'Dijkstra') runtimeMs = 42;
  else if (algorithm === 'OR-Tools') runtimeMs = 780;

  const congestionScore = algorithm === 'QPSO' ? 18.2 : algorithm === 'ACO' ? 22.4 : 29.5;

  return {
    routes,
    totalDistance: Math.round(cumulativeTotalDistance * 10) / 10,
    totalTime: Math.round(cumulativeTotalTime * 10) / 10,
    congestionScore,
    runtimeMs,
    convergence,
    baselineDistance: Math.round(cumulativeTotalDistance * 1.22 * 10) / 10,
    baselineTime: Math.round(cumulativeTotalTime * 1.32 * 10) / 10,
  };
}

/**
 * Realistic Mock for POST /api/benchmark
 */
export function runBenchmarkMock(req: BenchmarkRequest): BenchmarkResponse {
  const { instanceSize, algorithms, runs } = req;

  const baseCosts: Record<AlgorithmType, { cost: number; runtime: number; stdDev: number; iter: number }> = {
    'QPSO': { cost: 142.6, runtime: 182, stdDev: 3.12, iter: 48 },
    'PSO': { cost: 164.2, runtime: 215, stdDev: 8.45, iter: 74 },
    'GA': { cost: 158.8, runtime: 380, stdDev: 6.90, iter: 95 },
    'ACO': { cost: 151.3, runtime: 540, stdDev: 5.20, iter: 110 },
    'Dijkstra': { cost: 198.4, runtime: 38, stdDev: 0.00, iter: 1 },
    'OR-Tools': { cost: 141.2, runtime: 1250, stdDev: 0.00, iter: 140 },
  };

  const scaleFactor = instanceSize / 50;

  const rows: BenchmarkRow[] = algorithms.map((algo) => {
    const meta = baseCosts[algo] || { cost: 160, runtime: 200, stdDev: 5, iter: 60 };
    const scaledCost = Math.round(meta.cost * scaleFactor * 10) / 10;
    const scaledRuntime = Math.round(meta.runtime * Math.pow(scaleFactor, algo === 'OR-Tools' ? 2.4 : 1.2));
    const noise = (Math.random() - 0.5) * 2;

    return {
      algorithm: algo,
      bestCost: Math.round((scaledCost - meta.stdDev * 0.8 + noise) * 10) / 10,
      avgCost: Math.round((scaledCost + noise) * 10) / 10,
      stdDev: Math.round((meta.stdDev * Math.sqrt(scaleFactor)) * 100) / 100,
      runtimeMs: scaledRuntime,
      iterToConverge: meta.iter,
    };
  });

  return {
    rows,
    instanceSize,
    runs,
  };
}

/**
 * Scalability comparison data for Benchmark view
 */
export const SCALABILITY_DATA: ScalabilityPoint[] = [
  { nodes: 50, QPSO: 168, PSO: 210, GA: 380, ACO: 520, Dijkstra: 38, ORTools: 420 },
  { nodes: 100, QPSO: 310, PSO: 440, GA: 820, ACO: 1240, Dijkstra: 76, ORTools: 1850 },
  { nodes: 200, QPSO: 690, PSO: 1120, GA: 2150, ACO: 3800, Dijkstra: 164, ORTools: 8400 },
  { nodes: 500, QPSO: 1780, PSO: 3200, GA: 6400, ACO: 11200, Dijkstra: 480, ORTools: 34500 },
];
