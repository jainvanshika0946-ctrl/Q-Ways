"""
main.py
Wires the existing schemas + services together. Doesn't change graph_service,
optimization_service, qpso.py, fitness.py or problem.py - it only calls them.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas.optimization import (
    GraphBuildRequest, GraphBuildResponse,
    SnapRequest, SnapResponse,
    TrafficRequest, TrafficResponse,
    MatrixBuildRequest, MatrixBuildResponse,
    OptimizeRequest, OptimizeResponse,
    StopInfo,
)
from services import graph_service, optimization_service

app = FastAPI(title="QRoute Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/graph/build", response_model=GraphBuildResponse)
def build_graph(req: GraphBuildRequest):
    G = graph_service.ensure_graph(req.center_lat, req.center_lon, req.radius_m)
    return GraphBuildResponse(status="ok", num_nodes=G.number_of_nodes(),
                               num_edges=G.number_of_edges(), cache_path="city.graphml")


@app.post("/snap", response_model=SnapResponse)
def snap(req: SnapRequest):
    graph_service.ensure_graph()
    node_ids = graph_service.snap([(c.lat, c.lon) for c in req.coords])
    return SnapResponse(status="ok", node_ids=node_ids)


@app.post("/traffic/apply", response_model=TrafficResponse)
def traffic_apply(req: TrafficRequest):
    graph_service.ensure_graph()
    G, resolved = graph_service.apply_traffic_mode(req.mode, req.seed, req.gamma)
    all_cong = [d["congestion"] for _, _, d in G.edges(data=True)]
    return TrafficResponse(
        status="ok", mode_requested=req.mode, mode_applied=resolved,
        sample_congestion=all_cong[:5],
        avg_congestion=round(sum(all_cong) / len(all_cong), 3),
    )


@app.post("/matrix/build", response_model=MatrixBuildResponse)
def matrix_build(req: MatrixBuildRequest):
    graph_service.ensure_graph()
    _, resolved = graph_service.apply_traffic_mode(req.traffic_mode)
    coords = [(req.depot.lat, req.depot.lon)] + [(d.lat, d.lon) for d in req.deliveries]
    stop_ids = ["D"] + [d.id for d in req.deliveries]
    node_ids = graph_service.snap(coords)
    time_m, dist_m, _ = graph_service.matrices(node_ids)
    return MatrixBuildResponse(
        status="ok", traffic_mode_applied=resolved, stop_ids=stop_ids,
        node_ids=node_ids, time_matrix=time_m.tolist(), dist_matrix=dist_m.tolist(),
    )


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest):
    """
    THE endpoint the frontend's tap-to-add-stops flow calls.
    depot + deliveries (from map taps) -> snap -> matrix -> QPSO -> full response.
    """
    graph_service.ensure_graph()
    G, resolved_mode = graph_service.apply_traffic_mode(req.traffic_mode)

    coords = [(req.depot.lat, req.depot.lon)] + [(d.lat, d.lon) for d in req.deliveries]
    stop_ids = ["D"] + [d.id for d in req.deliveries]
    node_ids = graph_service.snap(coords)

    time_m, dist_m, paths = graph_service.matrices(node_ids)

    demands = [0.0] + [d.demand for d in req.deliveries]
    due_times = [None] + [
        (d.due_time_min * 60 if d.due_time_min is not None else None) for d in req.deliveries
    ]
    capacities = [v.capacity for v in req.vehicles]

    result = optimization_service.solve(
        time_matrix=time_m, dist_matrix=dist_m, paths=paths,
        stop_ids=stop_ids, node_ids=node_ids, demands=demands,
        capacities=capacities, num_vehicles=len(req.vehicles), G=G,
        algorithm=req.algorithm, due_times=due_times,
    )

    stops_out = []
    for i, sid in enumerate(stop_ids):
        lat, lon = coords[i]
        n = node_ids[i]
        stops_out.append(StopInfo(
            id=sid, lat=lat, lon=lon,
            snapped_lat=G.nodes[n]["y"], snapped_lon=G.nodes[n]["x"],
            is_depot=(i == 0),
        ))

    return OptimizeResponse(
        status="ok", algorithm=req.algorithm, traffic_mode_applied=resolved_mode,
        stops=stops_out, vehicles=result["vehicles"],
        total_distance_km=result["total_distance_km"], total_time_min=result["total_time_min"],
        fitness=result.get("fitness"), fitness_history=result.get("fitness_history"),
    )
