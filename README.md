Q-Ways

Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization

Smart India Hackathon 2026 — SIH26137

Q-Ways is a traffic-aware multi-vehicle route optimization system that models real road networks as graphs and uses Quantum-behaved Particle Swarm Optimization (QPSO) to find efficient vehicle routes while considering traffic, vehicle capacity, delivery demand, distance, travel time, and time windows.

1. Problem & Solution

Urban traffic conditions continuously change the cost of travelling between locations. A geographically short route may not be the fastest route when congestion is considered.

Q-Ways solves this by combining:

OpenStreetMap road-network data

Graph-based shortest-path routing

Dynamic traffic simulation

Multi-vehicle route optimization

Vehicle capacity and delivery constraints

QPSO metaheuristic optimization

Interactive map-based visualization

The overall objective is:

Minimize
    Travel Time
  + Time-Window Penalties
  + Capacity/Fleet Penalties
  + Unreachable-Route Penalties

2. System Architecture

flowchart TD
    A[User] --> B[React + TypeScript Frontend]
    B --> C[FastAPI Backend]

    C --> D[OSMnx]
    D --> E[OpenStreetMap Road Network]
    E --> F[NetworkX Graph]

    F --> G[Traffic Simulation]
    G --> H[Dijkstra Shortest Paths]
    H --> I[Time & Distance Matrices]

    I --> J[QPSO Optimizer]
    J --> K[Vehicle Routes]
    K --> L[ETA & Route Metrics]

    L --> C
    C --> B
    B --> M[Leaflet Interactive Map]
    B --> N[Charts & Results]

3. End-to-End Workflow

flowchart LR
    A[Depot + Delivery Stops] --> B[Build Road Graph]
    B --> C[Snap Coordinates]
    C --> D[Apply Traffic]
    D --> E[Dijkstra]
    E --> F[Time/Distance Matrices]
    F --> G[QPSO]
    G --> H[Decode Vehicle Routes]
    H --> I[Fitness Evaluation]
    I --> G
    H --> J[ETA + Metrics]
    J --> K[FastAPI]
    K --> L[React UI]
    L --> M[Map + Results]

4. Technology Stack

Layer

Technologies

Frontend

React, TypeScript, Vite

UI

Tailwind CSS, Lucide React

State

Zustand

Maps

Leaflet, OpenStreetMap

Charts

Recharts

Backend

Python, FastAPI, Uvicorn

Validation

Pydantic

Graph

NetworkX, OSMnx

Routing

Dijkstra

Optimization

QPSO, NumPy

Route Geometry

OSRM

Graph Cache

GraphML

5. Road Network & Traffic

Q-Ways obtains a drivable road network from OpenStreetMap through OSMnx and represents it using NetworkX.

OpenStreetMap
      ↓
    OSMnx
      ↓
 NetworkX Graph
      ↓
Traffic Weights
      ↓
 Dynamic Travel Time

User coordinates are snapped to the nearest road node before routing.

Traffic is currently simulated rather than obtained from a live traffic provider.

Supported traffic modes include:

Normal

Rush

Auto

Dynamic congestion updates

Incident spikes

Dynamic travel time is calculated using:

Dynamic Time = Base Time × (1 + γ × Congestion)

6. Routing & Optimization

After traffic weights are applied, Dijkstra is used to calculate fastest paths between important nodes.

This generates:

Travel-Time Matrix
Distance Matrix

These matrices are then supplied to the optimizer instead of repeatedly searching the entire road graph.

QPSO

Q-Ways uses Quantum-behaved Particle Swarm Optimization, a classical quantum-inspired metaheuristic.

Because vehicle routing is discrete while QPSO works with continuous particle positions, Q-Ways uses random-key encoding:

Particle:
[0.71, 0.12, 0.83, 0.35]

        ↓ argsort

Visit Order:
[2, 4, 1, 3]

The resulting order is decoded into vehicle routes according to vehicle capacity.

flowchart TD
    A[Particle Position] --> B[Random-Key Encoding]
    B --> C[Visit Order]
    C --> D[Vehicle Route Decoder]
    D --> E[Fitness]
    E --> F[Personal Best]
    E --> G[Global Best]
    F --> H[QPSO Update]
    G --> H
    H --> A

7. Constraints & Fitness

The optimizer considers:

Vehicle capacity

Number of vehicles

Delivery demand

Delivery time windows

Travel time

Road connectivity

Depot return

The fitness function is based primarily on total travel time with penalties for constraint violations.

Fitness =
    Total Travel Time
  + Time-Window Penalty
  + Capacity/Fleet Penalties
  + Unreachable-Route Penalty

Late deliveries receive a time-window penalty, while capacity and fleet violations receive larger penalties.

8. Frontend

The React frontend provides:

Network configuration

Bulk order input

Traffic configuration

Vehicle configuration

QPSO configuration

Interactive road-network map

Optimized vehicle routes

ETA information

Route statistics

Convergence charts

Benchmark results

Mathematical formulation

Frontend Flow

flowchart LR
    A[Configuration] --> B[API Request]
    B --> C[FastAPI]
    C --> D[Optimization]
    D --> E[JSON Response]
    E --> F[Results Page]
    F --> G[Leaflet Map]
    F --> H[Charts]
    F --> I[Route Tables]

9. Backend API

Method

Endpoint

Purpose

GET

/health

Health check

POST

/graph/build

Build/load road graph

POST

/snap

Snap coordinates to road nodes

POST

/traffic/apply

Apply traffic model

POST

/matrix/build

Generate routing matrices

POST

/optimize

Run route optimization

POST

/compare

Run benchmark comparison

FastAPI documentation:

http://127.0.0.1:8000/docs

10. Project Structure

Q-Ways/
│
├── QPSO_Backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── graph/
│   │   ├── road_network.py
│   │   ├── distance_matrix.py
│   │   ├── route_geometry.py
│   │   └── traffic.py
│   ├── optimization/
│   │   ├── problem.py
│   │   ├── fitness.py
│   │   ├── qpso.py
│   │   └── compare.py
│   ├── schemas/
│   └── services/
│
└── QPSO_Frontend/
    ├── package.json
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        └── lib/

11. Installation & Running

Backend

cd QPSO_Backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload

Backend:

http://127.0.0.1:8000

Frontend

Open another terminal:

cd QPSO_Frontend

npm install
npm run dev

Open the URL shown by Vite.

12. Complete Data Flow

flowchart TD
    A[OpenStreetMap] --> B[OSMnx]
    B --> C[NetworkX Road Graph]
    C --> D[Traffic Model]
    D --> E[Dijkstra]
    E --> F[Time / Distance Matrices]

    F --> G[QPSO]
    G --> H[Optimized Vehicle Routes]
    H --> I[ETA + Distance + Travel Time]

    I --> J[FastAPI]
    J --> K[React]
    K --> L[Leaflet Map]
    K --> M[Charts]
    K --> N[Route Results]

13. Team

Member

Role

Udit Raghuwnashi

Team Leader, Database Manager & Frontend UI

Aniruddha Sharma

ML Lead & Frontend

Aditi Dhakad

Backend Pipelines

Vanshika Jain

Graph Analysis & Backend Integration

Alafiya Naaz

Research & PPT Work

Aditiya Tiwari

Research & PPT Work

Responsibilities

Udit Raghuwnashi: Team coordination, frontend UI, data management and integration.

Aniruddha Sharma: QPSO/ML implementation and frontend development.

Aditi Dhakad: FastAPI backend and processing pipelines.

Vanshika Jain: Road graphs, NetworkX/OSMnx processing and backend integration.

Alafiya Naaz & Aditiya Tiwari: Research, documentation and presentation work.

14. Key Features

Real-world road networks from OpenStreetMap

Graph-based transportation modelling

Traffic-aware routing

Dijkstra shortest-path computation

Distance and travel-time matrices

QPSO-based route optimization

Multi-vehicle routing

Vehicle capacity handling

Delivery time-window penalties

ETA calculation

Interactive Leaflet map

Route and convergence visualization

Benchmarking support

FastAPI + React architecture

15. Project Pipeline

User Input
    ↓
OpenStreetMap Road Network
    ↓
OSMnx + NetworkX
    ↓
Coordinate Snapping
    ↓
Traffic Simulation
    ↓
Dijkstra Routing
    ↓
Time / Distance Matrices
    ↓
QPSO Optimization
    ↓
Vehicle Route Generation
    ↓
Fitness + ETA Calculation
    ↓
FastAPI
    ↓
React + Leaflet
    ↓
Optimized Routes & Visualization

Q-Ways

Quantum-Inspired Intelligent Traffic Route Optimization

Smart India Hackathon 2026 — SIH26137
