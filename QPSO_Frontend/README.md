# Quantum-Inspired Intelligent Traffic Route Optimization (QPSO)

> **Smart India Hackathon Project**  
> *Metaheuristic Capacitated Vehicle Routing (CVRP) & Shortest Path Optimization for Metropolitan Transit Corridors*

---

## 1. Project Overview

This platform models metropolitan road networks as weighted directed graphs with dynamic congestion penalties and solves the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW) using **Quantum-Inspired Particle Swarm Optimization (QPSO)**. 

### Why QPSO?
Traditional metaheuristics (PSO, Genetic Algorithms, Ant Colony Optimization) and classical greedy algorithms frequently stagnate in premature local minima due to velocity clamping and inertia traps. QPSO models particles in a quantum state space governed by a Schrödinger wave function within a delta potential well. The quantum tunneling probability enables particles to escape prohibitive cost barriers and discover globally superior routes with faster convergence.

---

## 2. Platform Architecture & Folder Structure

```
src/
├── api/
│   ├── client.ts             # Unified API client (forwards to backend or mock)
│   ├── mock.ts               # Realistic mock solver & benchmark engine
│   └── types.ts              # Data contracts and TypeScript interfaces
├── components/
│   ├── charts/
│   │   ├── ConvergenceChart.tsx # Multi-algorithm cost vs iteration with overlays
│   │   └── ScalabilityChart.tsx # Logarithmic runtime vs network size (50-500 nodes)
│   ├── common/
│   │   ├── Badge.tsx         # Traffic status & algorithm pill badges
│   │   ├── Card.tsx          # Consistent 1px border container
│   │   ├── DataTable.tsx     # Sortable table with subtle best-value highlighting
│   │   ├── MathBlock.tsx     # KaTeX math renderer
│   │   ├── Modal.tsx         # Accessible dialog for edge & node weights
│   │   ├── ParamField.tsx    # Numeric, slider, and dropdown parameter controls
│   │   └── Stat.tsx          # Key metric display with tabular numbers
│   ├── layout/
│   │   ├── Header.tsx        # Top status bar & quick-run trigger
│   │   ├── Layout.tsx        # Primary app layout shell
│   │   └── Sidebar.tsx       # 6 core items + specifications + theme toggle
│   └── map/
│       ├── MapLegend.tsx     # Dynamic key for depot, stops, traffic levels
│       └── MapView.tsx       # Leaflet map container with animated route vectors
├── lib/
│   ├── cn.ts                 # ClassName merging utility
│   ├── exportUtils.ts        # Browser CSV & JSON file export generators
│   └── formatters.ts         # Human-readable units (km, min, ms, %)
├── pages/
│   ├── Overview.tsx          # Problem statement, 4 headline stats, live map preview
│   ├── Network.tsx           # Graph viewer, city presets, random generator, edge editor
│   ├── Optimizer.tsx         # Swarm solver controls & live route drawing
│   ├── Results.tsx           # Per-vehicle route sequences, loads, CSV/JSON export
│   ├── Convergence.tsx       # Multi-algorithm convergence curves & stop metrics
│   ├── Benchmark.tsx         # Sortable benchmark matrix & scalability scaling
│   ├── Formulation.tsx       # KaTeX mathematical formulation & QPSO theory
│   └── Deliverables.tsx      # SIH Deliverables compliance matrix
├── store/
│   ├── useBenchmarkStore.ts  # Benchmark runs and scalability metrics
│   ├── useNetworkStore.ts    # Graph nodes, edges, depot selection
│   ├── useOptimizerStore.ts  # Optimization parameters and live progress
│   └── useThemeStore.ts      # Light/Dark design theme toggle
├── styles/
│   └── globals.css           # Semantic theme variables, Leaflet & KaTeX styles
├── App.tsx                   # React Router routing configuration
└── main.tsx                  # React 19 entry point
```

---

## 3. Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### Installation
```bash
git clone <repo-url>
cd sih-2
npm install
```

### Running Locally (Development Mode)
```bash
npm run dev
```
Open your browser at `http://localhost:5173`. The application runs out of the box with the realistic mock engine pre-seeded with Bengaluru and Indian metropolitan network topologies.

### Production Build
```bash
npm run build
npm run preview
```

---

## 4. Swapping Mock Data for Real Backend

All communication between the frontend and backend is routed strictly through `src/api/client.ts`. 

### Step 1: Set Environment Variable
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### Step 2: Toggle `FORCE_MOCK` in `src/api/client.ts`
In `src/api/client.ts`, change:
```typescript
const FORCE_MOCK = false; // Switch to false when backend is running
```
When `FORCE_MOCK` is set to `false`, `apiClient` sends live `fetch()` requests to your backend server. If the backend server is unreachable or offline, it gracefully falls back to the simulated mock engine with a console warning.

### Step 3: Implement Backend Endpoints
Your backend (Python / FastAPI, Flask, Node.js, or Go) must implement the following three endpoints:

#### 1. `POST /api/optimize`
- **Request Body:**
  ```json
  {
    "graph": {
      "name": "Bengaluru Urban Grid",
      "nodes": [{ "id": "node-1", "name": "...", "lat": 12.93, "lng": 77.62, "demand": 25 }],
      "edges": [{ "id": "edge-1", "source": "node-1", "target": "node-2", "distanceKm": 3.4, "trafficLevel": "moderate", "congestionFactor": 1.4 }],
      "depotId": "node-1"
    },
    "vehicles": 4,
    "depot": "node-1",
    "algorithm": "QPSO",
    "params": {
      "numVehicles": 4,
      "vehicleCapacity": 150,
      "swarmParticles": 40,
      "iterations": 120,
      "contractionExpansionCoeff": 0.75,
      "trafficMode": "simulated-live"
    }
  }
  ```
- **Response Format:**
  ```json
  {
    "routes": [
      {
        "vehicleId": 1,
        "color": "#0F766E",
        "nodeIds": ["node-1", "node-4", "node-2", "node-1"],
        "stops": [{ "nodeId": "node-1", "nodeName": "Depot", "arrivalMin": 0, "cumulativeDistanceKm": 0, "cumulativeLoad": 0 }],
        "coordinates": [[12.93, 77.62], [12.96, 77.63]],
        "distanceKm": 24.8,
        "timeMin": 36.2,
        "load": 128,
        "capacity": 150
      }
    ],
    "totalDistance": 98.4,
    "totalTime": 142.8,
    "congestionScore": 18.2,
    "runtimeMs": 168,
    "convergence": [
      { "iter": 1, "best": 224.5, "mean": 248.1 },
      { "iter": 120, "best": 142.8, "mean": 143.1 }
    ]
  }
  ```

#### 2. `POST /api/benchmark`
- **Request Body:**
  ```json
  {
    "instanceSize": 50,
    "algorithms": ["QPSO", "PSO", "GA", "ACO", "Dijkstra", "OR-Tools"],
    "runs": 10
  }
  ```
- **Response Format:**
  ```json
  {
    "instanceSize": 50,
    "runs": 10,
    "rows": [
      {
        "algorithm": "QPSO",
        "bestCost": 142.6,
        "avgCost": 144.2,
        "stdDev": 3.12,
        "runtimeMs": 182,
        "iterToConverge": 48
      }
    ]
  }
  ```

#### 3. `GET /api/graph/sample?nodes=50`
- **Response Format:**
  Returns a `NetworkGraph` JSON object with `name`, `nodes`, `edges`, and `depotId`.

---

## 5. Design Principles & Theme Customization

- **Palette**: Calm, warm off-white background (`#FAF8F5`) or deep obsidian dark slate (`#0B0E14`), near-black text, single deep teal accent (`#0F766E` / `#14B8A6`), and muted semantic traffic indicators (emerald, amber, orange, red).
- **Typography**: DM Sans / Inter for UI copy, JetBrains Mono for coordinates, parameters, and tabular figures.
- **Theme Toggle**: Located at the bottom of the left sidebar.
