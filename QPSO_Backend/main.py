"""
main.py
Aditi's backend: request -> road graph -> traffic -> matrices -> optimization -> response.

Endpoints, in the order you should test them:
    GET  /health          - is the server up at all
    POST /graph/build     - stage 1: download/load the road graph
    POST /snap            - stage 2: turn lat/lon into road-node ids
    POST /traffic/apply   - stage 3: put congestion + dyn_time on the graph
    POST /matrix/build    - stage 4: full graph pipeline -> time/distance matrices
    POST /optimize        - stage 5: matrices -> OptimizationProblem -> solver -> routes

Run with:
    uvicorn main:app --reload

Then open http://127.0.0.1:8000/docs for the interactive Swagger UI, which
lets you fire every endpoint below by hand and see the exact JSON it returns.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from schemas.optimization import (
    GraphBuildRequest, GraphBuildResponse,
    SnapRequest, SnapResponse,
    TrafficRequest, TrafficResponse,
    MatrixBuildRequest, MatrixBuildResponse,
    OptimizeRequest, OptimizeResponse,
)
from services import graph_service
from services.optimization_service import solve

app = FastAPI(title="Traffic Route Optimization Backend")

# Lets the browser frontend (map page) call this API from a different origin.
# For a hackathon "*" is fine; in production list your real frontend URL(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# STAGE 1 - load the road graph
# ---------------------------------------------------------------------------
@app.post("/graph/build", response_model=GraphBuildResponse)
def graph_build(req: GraphBuildRequest):
    """
    First real test of Vanshika's code. First call downloads from OSM and
    caches to city.graphml (needs internet); later calls load the cache
    instantly.
    Check: num_nodes/num_edges should be in the thousands for a 2.5km radius
    around central Chennai.
    """
    try:
        G = graph_service.ensure_graph(req.center_lat, req.center_lon, req.radius_m)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph load failed: {e}")
    return GraphBuildResponse(
        status="ok",
        num_nodes=G.number_of_nodes(),
        num_edges=G.number_of_edges(),
        cache_path="city.graphml",
    )


# ---------------------------------------------------------------------------
# STAGE 2 - snap lat/lon to road nodes
# ---------------------------------------------------------------------------
@app.post("/snap", response_model=SnapResponse)
def snap(req: SnapRequest):
    """
    Check: you should get back one integer node id per input coordinate,
    with no errors, and roughly-nearby coordinates should snap to nearby
    (but not identical) node ids.
    """
    if graph_service.state.G is None:
        raise HTTPException(status_code=400, detail="Call /graph/build first.")
    coords = [(c.lat, c.lon) for c in req.coords]
    try:
        node_ids = graph_service.snap(coords)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Snap failed: {e}")
    return SnapResponse(status="ok", node_ids=node_ids)


# ---------------------------------------------------------------------------
# STAGE 3 - apply traffic
# ---------------------------------------------------------------------------
@app.post("/traffic/apply", response_model=TrafficResponse)
def traffic_apply(req: TrafficRequest):
    """
    Check: avg_congestion should be noticeably higher for mode="rush" than
    mode="normal" (BASE_CONGESTION table says roughly 3x higher).
    """
    if graph_service.state.G is None:
        raise HTTPException(status_code=400, detail="Call /graph/build first.")
    try:
        G, resolved_mode = graph_service.apply_traffic_mode(mode=req.mode, seed=req.seed, gamma=req.gamma)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Traffic apply failed: {e}")
    congestions = [d["congestion"] for _, _, d in G.edges(data=True)]
    return TrafficResponse(
        status="ok",
        mode_requested=req.mode,
        mode_applied=resolved_mode,
        sample_congestion=congestions[:10],
        avg_congestion=round(sum(congestions) / len(congestions), 4),
    )


# ---------------------------------------------------------------------------
# STAGE 4 - build time/distance matrices
# ---------------------------------------------------------------------------
@app.post("/matrix/build", response_model=MatrixBuildResponse)
def matrix_build(req: MatrixBuildRequest):
    """
    This is the big handoff point in the project guide: coordinates in,
    time_matrix + dist_matrix out. Runs graph load (if needed) -> snap ->
    traffic -> build_matrices, all in one call so you can sanity-check the
    numbers before wiring in the optimizer.
    Check: matrix[i][i] should be 0 for every i, and matrix[i][j] should
    roughly match matrix[j][i] on a mostly-two-way road network.
    """
    graph_service.ensure_graph()
    coords = [(req.depot.lat, req.depot.lon)] + [(d.lat, d.lon) for d in req.deliveries]
    stop_ids = ["D"] + [d.id for d in req.deliveries]
    try:
        node_ids = graph_service.snap(coords)
        _, resolved_mode = graph_service.apply_traffic_mode(mode=req.traffic_mode)
        time_m, dist_m, _ = graph_service.matrices(node_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matrix build failed: {e}")
    return MatrixBuildResponse(
        status="ok",
        traffic_mode_applied=resolved_mode,
        stop_ids=stop_ids,
        node_ids=node_ids,
        time_matrix=time_m.tolist(),
        dist_matrix=dist_m.tolist(),
    )


# ---------------------------------------------------------------------------
# STAGE 5 - full pipeline: matrices -> OptimizationProblem -> solver -> routes
# ---------------------------------------------------------------------------
@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest):
    """
    The full flow from the project guide:
    request -> graph -> snap -> traffic -> matrices -> OptimizationProblem
    -> solver -> route geometry -> response.

    algorithm="nearest_neighbor" works today (single vehicle placeholder).
    algorithm="QPSO" is wired up to fail loudly with NotImplementedError
    until Aniruddha's optimization/qpso.py exists - that's intentional, so
    you can tell at a glance whether you're looking at a real optimized
    route or the placeholder.
    """
    graph_service.ensure_graph()
    coords = [(req.depot.lat, req.depot.lon)] + [(d.lat, d.lon) for d in req.deliveries]
    stop_ids = ["D"] + [d.id for d in req.deliveries]
    demands = [0] + [d.demand for d in req.deliveries]
    capacities = [v.capacity for v in req.vehicles]
    # due_time_min (minutes) -> seconds, matching time_matrix's units. No
    # deadline given -> inf, meaning "never late" (time_window_penalty skips it).
    due_times = [float("inf")] + [
        (d.due_time_min * 60.0) if d.due_time_min is not None else float("inf")
        for d in req.deliveries
    ]

    try:
        node_ids = graph_service.snap(coords)
        _, resolved_mode = graph_service.apply_traffic_mode(mode=req.traffic_mode)
        time_m, dist_m, paths = graph_service.matrices(node_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed before optimization: {e}")

    if np.any(time_m >= 1e9):
        raise HTTPException(
            status_code=422,
            detail="One or more stops are unreachable from another on this road graph.",
        )

    try:
        result = solve(
            time_matrix=time_m,
            dist_matrix=dist_m,
            paths=paths,
            stop_ids=stop_ids,
            node_ids=node_ids,
            demands=demands,
            capacities=capacities,
            num_vehicles=len(req.vehicles),
            G=graph_service.state.G,
            algorithm=req.algorithm,
            due_times=due_times,
        )
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")

    # Marker data for the map: original position + where it snapped on the road.
    G = graph_service.state.G
    stops_out = []
    for i, (sid, (lat, lon), nid) in enumerate(zip(stop_ids, coords, node_ids)):
        stops_out.append({
            "id": sid, "lat": lat, "lon": lon,
            "snapped_lat": G.nodes[nid]["y"], "snapped_lon": G.nodes[nid]["x"],
            "is_depot": i == 0,
        })

    return OptimizeResponse(
        status="success",
        algorithm=req.algorithm,
        traffic_mode_applied=resolved_mode,
        stops=stops_out,
        vehicles=result["vehicles"],
        total_distance_km=result["total_distance_km"],
        total_time_min=result["total_time_min"],
        fitness=result["fitness"],
        fitness_history=result["fitness_history"],
    )
from optimization.compare import run_benchmark
from optimization.problem import OptimizationProblem

class CompareRequest(OptimizeRequest):
    runs: int = 10

@app.post("/compare")
def compare(req: CompareRequest):
    graph_service.ensure_graph()
    coords = [(req.depot.lat, req.depot.lon)] + [(d.lat, d.lon) for d in req.deliveries]
    demands = [0] + [d.demand for d in req.deliveries]
    due = [float("inf")] + [(d.due_time_min * 60.0) if d.due_time_min is not None
                            else float("inf") for d in req.deliveries]
    node_ids = graph_service.snap(coords)
    _, mode = graph_service.apply_traffic_mode(mode=req.traffic_mode)
    time_m, dist_m, paths = graph_service.matrices(node_ids)
    problem = OptimizationProblem(time_m, dist_m, paths, demands,
                                  [v.capacity for v in req.vehicles],
                                  len(req.vehicles), due_times=due)
    return {"traffic_mode_applied": mode, **run_benchmark(problem, runs=req.runs)}