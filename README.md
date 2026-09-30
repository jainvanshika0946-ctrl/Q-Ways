<h1 align="center">Q-Ways</h1>

<h2 align="center">Quantum-Inspired Route Optimization for Smart Logistics</h2>

<p align="center">
  <strong>Optimize routes. Adapt to traffic. Improve delivery efficiency.</strong>
</p>

<p align="center">
  A logistics optimization platform powered by
  <strong>Quantum-behaved Particle Swarm Optimization (QPSO)</strong>.
</p>

Overview

Q-Ways is an intelligent logistics route optimization system designed to generate efficient delivery routes across a road network.

It combines QPSO optimization, traffic conditions, fleet constraints, bulk delivery orders, and real-world travel-time feedback to support smarter route planning.

The project consists of a React frontend and a FastAPI backend.

Key Features

⚛️ QPSO Optimization — Quantum-inspired route optimization

🚚 Fleet Management — Vehicle count and capacity constraints

📦 Bulk Orders — Create and manage multiple delivery orders

🗺️ Interactive Map — Visualize networks, routes and locations

🚦 Traffic Simulation — Account for traffic and congestion

⏱️ Time Feedback — Compare expected and actual travel time

💰 Cost Impact — Analyze delay and time-saved effects

⚙️ Advanced Optimization — Configure QPSO parameters

📊 Analytics — View optimization and convergence results

📁 CSV Support — Import/export orders and network data

Tech Stack

<strong>Frontend</strong>

React

TypeScript

Vite

Tailwind CSS

Leaflet / React Leaflet

Zustand

Recharts

<strong>Backend</strong>

Python

FastAPI

Uvicorn

NetworkX

OSMnx

NumPy

Pydantic

Optimization

Quantum-behaved Particle Swarm Optimization (QPSO)

Nearest-neighbor baseline

### Architecture

```text
        Q-WAYS
          |
  |---------------|
  |               |
React Frontend  FastAPI Backend
  |               |
  ├─ Map & Routes ├─ QPSO Engine
  ├─ Orders       ├─ Network Processing
  ├─ Traffic      ├─ Constraints
  ├─ Optimizer    └─ Results
  └─ Analytics
```

### Project Structure

```text
Q-Ways/
|
├─ QPSO_Frontend/
|  ├─ src/
|  ├─ public/
|  └─ package.json
|
├─ QPSO_Backend/
|  ├─ graph/
|  ├─ optimization/
|  ├─ schemas/
|  ├─ services/
|  ├─ main.py
|  └─ requirements.txt
|
└─ README.md
```


Getting Started

Backend

cd QPSO_Backend
pip install -r requirements.txt
uvicorn main:app --reload

Backend: http://127.0.0.1:8000
API Docs: http://127.0.0.1:8000/docs

Frontend

Open another terminal:

cd QPSO_Frontend
npm install
npm run dev

Frontend: http://localhost:5173

Optimization Flow

Road Network + Delivery Orders
              ↓
       Traffic Conditions
              ↓
       Fleet Constraints
              ↓
          QPSO Engine
              ↓
       Optimized Routes
              ↓
      Map & Analytics
              ↓
    Actual-Time Feedback

Map & Network

The frontend currently uses a Bengaluru synthetic/mock network for the default visualization.

Network data:

QPSO_Frontend/src/api/mock.ts

Map component:

QPSO_Frontend/src/components/map/MapView.tsx

The map is rendered using Leaflet with OpenStreetMap tiles.

Status

🚧 Active Development

Q-Ways is being developed toward a complete end-to-end logistics optimization platform with frontend-backend integration and future re-optimization capabilities.

<p align="center">
  <strong>Q-Ways — Smarter Routes. Better Logistics.</strong>
</p>
