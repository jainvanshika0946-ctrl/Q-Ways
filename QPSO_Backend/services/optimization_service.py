"""
services/optimization_service.py
Turns matrices into an OptimizationProblem, runs a solver, and turns the
result back into the vehicle_id / stops / coordinates shape the frontend
wants - including a per-stop ETA so time-window performance is visible and
comparable across algorithms.

`nearest_neighbor_solve()` is a deliberately dumb placeholder - single
vehicle, greedy nearest-unvisited-stop, depot-to-depot. It exists so you can
prove the WHOLE pipeline (request -> graph -> matrices -> problem -> solver
-> routes -> geometry -> response) works independently of QPSO, and gives
you a baseline to benchmark QPSO against.
"""
from optimization.problem import OptimizationProblem
from optimization.fitness import route_time, route_distance, compute_etas, evaluate_routes
from graph.route_geometry import path_to_latlon
from services import graph_service


def nearest_neighbor_solve(problem: OptimizationProblem):
    """
    Single-vehicle greedy placeholder solver.
    Index 0 in every matrix is the depot; indices 1..n-1 are deliveries.
    Ignores capacity and time windows while building the route (it's a
    plumbing/baseline check, not a real routing algorithm) but is scored
    with the same fitness.evaluate_routes() every other solver uses, so
    its reported fitness is still comparable.
    """
    n = problem.time_matrix.shape[0]
    unvisited = set(range(1, n))
    route = [0]
    current = 0
    while unvisited:
        nxt = min(unvisited, key=lambda j: problem.time_matrix[current][j])
        route.append(nxt)
        unvisited.remove(nxt)
        current = nxt
    route.append(0)

    fitness, _ = evaluate_routes([route], problem.time_matrix, problem.due_times)
    return {"routes": [route], "fitness": fitness, "fitness_history": [fitness]}


def solve(time_matrix, dist_matrix, paths, stop_ids, node_ids, demands, capacities,
          num_vehicles, G, algorithm="nearest_neighbor", due_times=None):
    """
    Full stage 3+ of the pipeline: build OptimizationProblem -> run a solver
    -> stitch paths -> return the same vehicle-by-vehicle shape /optimize returns,
    including each stop's ETA (and how late it is, if a due_time was missed).
    """
    problem = OptimizationProblem(
        time_matrix=time_matrix,
        distance_matrix=dist_matrix,
        paths=paths,
        demands=demands,
        vehicle_capacities=capacities,
        num_vehicles=num_vehicles,
        due_times=due_times,
    )

    if algorithm == "QPSO":
        from optimization import qpso
        result = qpso.optimize(problem)
    else:
        result = nearest_neighbor_solve(problem)

    vehicles_out = []
    total_distance = 0.0
    total_time = 0.0
    for v_idx, route in enumerate(result["routes"]):
        v_time = route_time(route, time_matrix)
        v_dist = route_distance(route, dist_matrix)

        # per-stop ETA (seconds from depot departure) and lateness against due_times
        etas = compute_etas(route, time_matrix)
        stop_etas = []
        for stop_idx, eta_sec in etas:
            due = due_times[stop_idx] if due_times is not None else None
            has_due = due is not None and due != float("inf")
            late_by_min = round(max(0.0, eta_sec - due) / 60.0, 2) if has_due else 0.0
            stop_etas.append({
                "id": stop_ids[stop_idx],
                "eta_min": round(eta_sec / 60.0, 2),
                "due_min": round(due / 60.0, 2) if has_due else None,
                "late_by_min": late_by_min,
            })

        # stitch the pairwise graph-node paths into one continuous road path
        full_node_path = []
        for i in range(len(route) - 1):
            seg = paths[(route[i], route[i + 1])]
            full_node_path.extend(seg if not full_node_path else seg[1:])
        coords = path_to_latlon(G, full_node_path)

        vehicles_out.append({
            "vehicle_id": f"V{v_idx + 1}",
            "stops": [stop_ids[i] for i in route],
            "distance_km": round(v_dist / 1000.0, 3),
            "travel_time_min": round(v_time / 60.0, 2),
            "route_coordinates": coords,
            "stop_etas": stop_etas,
        })
        total_distance += v_dist
        total_time += v_time

    return {
        "vehicles": vehicles_out,
        "total_distance_km": round(total_distance / 1000.0, 3),
        "total_time_min": round(total_time / 60.0, 2),
        "fitness": result.get("fitness"),
        "fitness_history": result.get("fitness_history"),
    }