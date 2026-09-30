# Backend & Integration — Aditi

Wires Vanshika's four files into a FastAPI pipeline, one endpoint per stage,
so you can check each step's output before trusting the next one.

```
backend/
├── main.py                        # all endpoints
├── requirements.txt
├── schemas/optimization.py        # every request/response shape
├── graph/                         # Vanshika's files, untouched
│   ├── road_network.py
│   ├── traffic.py
│   ├── distance_matrix.py
│   └── route_geometry.py
├── services/
│   ├── graph_service.py           # caches the loaded graph, calls Vanshika's fns
│   └── optimization_service.py    # builds OptimizationProblem, runs a solver
└── optimization/
    └── problem.py                 # the OptimizationProblem contract for QPSO
```

## Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000/docs** — this is a Swagger UI where you can call
every endpoint below by hand and see the exact JSON response, no curl needed.
(`curl` examples are given too, for outside the browser.)

Graph downloads need internet the first time only; after that `city.graphml`
is cached in the folder you ran uvicorn from, so restarts are instant.

## Testing order

Go through these in order — each stage depends on the graph state set up by
the one before it (within the same running server process).

### 1. `GET /health`
Confirms the server is up.
```bash
curl http://127.0.0.1:8000/health
# {"status": "ok"}
```

### 2. `POST /graph/build`
Loads (or downloads) the road graph.
```bash
curl -X POST http://127.0.0.1:8000/graph/build -H "Content-Type: application/json" -d '{}'
```
**Check:** `num_nodes` / `num_edges` should be in the thousands for the
default 2.5 km radius around central Chennai (Vanshika's guide mentions
~3,554 nodes / ~9,019 edges at that radius). If this fails, it's almost
always a network issue reaching OpenStreetMap servers — nothing to do with
your code.

### 3. `POST /snap`
Turns lat/lon into road-node ids. Depot first, then stops.
```bash
curl -X POST http://127.0.0.1:8000/snap -H "Content-Type: application/json" -d '{
  "coords": [
    {"lat": 13.0827, "lon": 80.2707},
    {"lat": 13.087, "lon": 80.278},
    {"lat": 13.075, "lon": 80.285}
  ]
}'
```
**Check:** one integer node id per coordinate, no duplicates unless two
inputs really are on the same intersection.

### 4. `POST /traffic/apply`
Applies congestion to every road on the currently loaded graph.
```bash
curl -X POST http://127.0.0.1:8000/traffic/apply -H "Content-Type: application/json" -d '{"mode": "rush"}'
```
**Check:** run it once with `"mode": "normal"` and once with `"mode": "rush"`
— `avg_congestion` for rush should be roughly 2-3x higher (matches
`BASE_CONGESTION` in `traffic.py`).

### 5. `POST /matrix/build`
The big handoff point: coordinates in, `time_matrix` + `dist_matrix` out.
Runs snap → traffic → `build_matrices` in one call.
```bash
curl -X POST http://127.0.0.1:8000/matrix/build -H "Content-Type: application/json" -d '{
  "depot": {"lat": 13.0827, "lon": 80.2707},
  "deliveries": [
    {"id": "A", "lat": 13.087, "lon": 80.278, "demand": 5},
    {"id": "B", "lat": 13.075, "lon": 80.285, "demand": 3},
    {"id": "C", "lat": 13.090, "lon": 80.265, "demand": 4}
  ],
  "traffic_mode": "normal"
}'
```
**Check:**
- the diagonal (`time_matrix[i][i]`) should be `0` for every stop
- `time_matrix[i][j]` and `[j][i]` should be close on ordinary two-way
  streets (not identical — one-ways and turn restrictions make them differ)
- no value should be `1000000000.0` (that's `UNREACHABLE` — means a stop got
  snapped onto a disconnected part of the graph)
- re-run with `"traffic_mode": "rush"` and confirm the times go up

### 6. `POST /optimize`
The full pipeline end to end: request → graph → matrices →
`OptimizationProblem` → solver → route geometry → response.

`"algorithm": "nearest_neighbor"` is a placeholder single-vehicle greedy
solver — it exists purely to prove the whole plumbing works before QPSO is
ready. `"algorithm": "QPSO"` will return HTTP 501 until Aniruddha's
`optimization/qpso.py` exists; that's intentional, so you always know
whether you're looking at a real optimized route.

```bash
curl -X POST http://127.0.0.1:8000/optimize -H "Content-Type: application/json" -d '{
  "depot": {"lat": 13.0827, "lon": 80.2707},
  "deliveries": [
    {"id": "A", "lat": 13.087, "lon": 80.278, "demand": 5},
    {"id": "B", "lat": 13.075, "lon": 80.285, "demand": 3},
    {"id": "C", "lat": 13.090, "lon": 80.265, "demand": 4}
  ],
  "vehicles": [{"id": "V1", "capacity": 12}],
  "traffic_mode": "normal",
  "algorithm": "nearest_neighbor"
}'
```
**Check:**
- `vehicles[0].stops` should start and end with `"D"` and include every
  delivery id exactly once
- `route_coordinates` should be a list of `[lat, lon]` pairs you could paste
  straight into a Leaflet polyline
- `total_time_min` should roughly equal `fitness / 60`
- swap `traffic_mode` to `"rush"` and re-run — the route or its time should
  change, since QPSO's whole selling point is reacting to that

## Plugging in QPSO later

When Aniruddha's module is ready, the only change needed is inside
`services/optimization_service.py::solve()` — replace the `NotImplementedError`
branch with:
```python
from optimization import qpso
result = qpso.optimize(problem)
```
`qpso.optimize()` must return the same shape `nearest_neighbor_solve()`
already returns: `{"routes": [[0, 2, 1, 0], ...], "fitness": ..., "fitness_history": [...]}`
where each route is a list of **matrix indices** (0 = depot), one list per
vehicle. Nothing else in `main.py` or `optimization_service.py` needs to
change — that's the whole point of the `OptimizationProblem` contract.

## Known limitations of this version

- `GraphState` is a single global — fine for one developer testing locally,
  not safe for multiple concurrent users. If you deploy for real, key it by
  a session/request id instead of storing one graph in module state.
- The nearest-neighbor solver is single-vehicle and ignores capacity
  entirely — it's a plumbing check, not a routing algorithm.
- `/optimize` currently 422s if any stop is unreachable rather than trying
  to work around it — good enough for now; revisit if your delivery points
  end up outside the loaded graph's radius.
