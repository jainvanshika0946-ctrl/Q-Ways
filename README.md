Q-Ways — Quantum-Inspired Route Optimization

Q-Ways is a logistics route optimization platform that uses Quantum-behaved Particle Swarm Optimization (QPSO) to find efficient delivery routes while considering road networks, traffic, fleet constraints and delivery orders.

Features

🚚 Multi-vehicle route optimization

⚛️ QPSO-based optimization

🗺️ Interactive Leaflet map

📍 Location and delivery management

📦 Bulk order management with CSV import/export

🚦 Traffic and congestion simulation

⏱️ Expected vs actual travel-time feedback

💰 Time-based cost impact

⚙️ Advanced optimization parameters

📊 Convergence and benchmark analysis

🔌 FastAPI backend with Swagger API

Tech Stack

Frontend

React + TypeScript + Vite

Leaflet / React Leaflet

Zustand

Tailwind CSS

Recharts

Backend

Python

FastAPI + Uvicorn

NetworkX

OSMnx

NumPy

Pydantic

Optimization

Quantum-behaved Particle Swarm Optimization (QPSO)

Nearest-neighbor baseline

Project Structure

Q-Ways/
├── QPSO_Frontend/   # React frontend
└── QPSO_Backend/    # FastAPI backend

Run Locally

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

Current Network

The frontend currently uses a Bengaluru synthetic/mock road network by default. Its junction data is stored in:

QPSO_Frontend/src/api/mock.ts

The interactive map is rendered using Leaflet in:

QPSO_Frontend/src/components/map/MapView.tsx

Workflow

Road Network + Orders
        ↓
Traffic & Constraints
        ↓
Route Optimization
        ↓
Optimized Routes
        ↓
Map + Results + Feedback

Status

🚧 Under active development

The frontend and backend are being integrated for a complete QPSO-powered logistics optimization system.

License

Developed for educational, research, and project-development purposes.
