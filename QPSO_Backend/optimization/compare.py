"""
optimization/compare.py
Runs QPSO, OR-Tools, ACO, GA, PSO and a Dijkstra-based greedy baseline on the
SAME OptimizationProblem and produces the comparison table
(best cost, mean cost, std dev, runtime, convergence iteration).

FAIRNESS RULES (so the table is defensible in front of judges)
1. One scorer. Every algorithm's routes are scored by
   qpso.fitness_of_order / fitness.evaluate_routes -> travel time +
   soft time-window penalty + capacity/fleet penalties. OR-Tools is
   re-scored by the same rules (score_routes) instead of trusting its
   internal objective.
2. Equal budget. PSO, GA, ACO and QPSO all get POP x ITERS evaluations.
3. Repeated runs. Stochastic algorithms run `runs` times with different
   seeds; best/mean/std come from those runs. OR-Tools and the Dijkstra
   baseline are deterministic, so they run once (std = 0).

COST UNIT
Costs are fitness / 60, i.e. "minutes-equivalent": travel minutes plus
penalty terms. If no stop is late and no capacity is violated, cost is just
total travel minutes.

Dijkstra note: Dijkstra is a shortest-PATH algorithm, not a multi-stop
optimizer. The time matrix is already built from Dijkstra shortest paths, so
the "Dijkstra" row is greedy nearest-neighbour over those Dijkstra times
(split into vehicles by capacity). Label it that way in your report.
"""
import time
import numpy as np

from optimization.qpso import QPSOConfig, fitness_of_order
from optimization import qpso
from optimization.fitness import evaluate_routes, CAPACITY_VIOLATION_PENALTY, \
    EXTRA_VEHICLE_PENALTY, TIME_WINDOW_PENALTY_PER_MIN

POP = 30       # particles / chromosomes / ants
ITERS = 150    # iterations / generations
CONVERGENCE_TOL = 1e-3   # "converged" = within 0.1% of the final best cost


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _n(problem):
    return problem.time_matrix.shape[0] - 1


def order_from_keys(keys):
    return [int(i) for i in (np.argsort(keys) + 1)]


def score_routes(routes, vehicle_ids, problem):
    """Score routes that were NOT built by decode() (used for OR-Tools).
    vehicle_ids[k] = which vehicle (index into capacities) drives routes[k]."""
    fit, _ = evaluate_routes(routes, problem.time_matrix, problem.due_times)
    for r, v in zip(routes, vehicle_ids):
        load = sum(problem.demands[s] for s in r)
        cap = problem.vehicle_capacities[v] if v < len(problem.vehicle_capacities) else 0.0
        fit += CAPACITY_VIOLATION_PENALTY * max(0.0, load - cap)
    if len(routes) > problem.num_vehicles:
        fit += EXTRA_VEHICLE_PENALTY * (len(routes) - problem.num_vehicles)
    return fit


# ---------------------------------------------------------------------------
# algorithms - each returns {"routes", "fitness", "fitness_history"}
# ---------------------------------------------------------------------------
def run_qpso(problem, seed):
    cfg = QPSOConfig(num_particles=POP, num_iterations=ITERS, seed=seed)
    return qpso.optimize(problem, cfg)


def run_pso(problem, seed, w=0.7, c1=1.5, c2=1.5):
    """Classic PSO on the same random-key encoding QPSO uses."""
    rng = np.random.default_rng(seed)
    D = _n(problem)
    x = rng.uniform(0, 1, (POP, D))
    v = np.zeros((POP, D))
    pbest = x.copy()
    pfit = np.zeros(POP)
    for i in range(POP):
        pfit[i], routes = fitness_of_order(order_from_keys(x[i]), problem)
    g = int(pfit.argmin())
    gpos, gfit = pbest[g].copy(), pfit[g]
    _, groutes = fitness_of_order(order_from_keys(gpos), problem)
    hist = [float(gfit)]
    for _ in range(ITERS):
        for i in range(POP):
            r1, r2 = rng.random(D), rng.random(D)
            v[i] = w * v[i] + c1 * r1 * (pbest[i] - x[i]) + c2 * r2 * (gpos - x[i])
            x[i] = x[i] + v[i]
            fit, routes = fitness_of_order(order_from_keys(x[i]), problem)
            if fit < pfit[i]:
                pfit[i], pbest[i] = fit, x[i].copy()
            if fit < gfit:
                gfit, gpos, groutes = fit, x[i].copy(), routes
        hist.append(float(gfit))
    return {"routes": groutes, "fitness": float(gfit), "fitness_history": hist}


def _ox(p1, p2, rng):
    """Order crossover: keep a slice of p1, fill the rest in p2's order."""
    n = len(p1)
    a, b = sorted(rng.choice(n + 1, 2, replace=False))
    child = [None] * n
    child[a:b] = p1[a:b]
    used = set(p1[a:b])
    fill = [g for g in p2 if g not in used]
    for i, g in zip([i for i in range(n) if child[i] is None], fill):
        child[i] = g
    return child


def run_ga(problem, seed, tournament=3, mut_rate=0.2, elite=2):
    """Genetic algorithm on permutations: tournament + OX + swap mutation."""
    rng = np.random.default_rng(seed)
    n = _n(problem)
    pop = [list(rng.permutation(n) + 1) for _ in range(POP)]
    pop = [[int(g) for g in ind] for ind in pop]

    def evaluate(population):
        out = [fitness_of_order(ind, problem) for ind in population]
        return [o[0] for o in out], [o[1] for o in out]

    fits, routes = evaluate(pop)
    b = int(np.argmin(fits))
    gfit, groutes = fits[b], routes[b]
    hist = [float(gfit)]
    for _ in range(ITERS):
        ranked = np.argsort(fits)
        new_pop = [pop[i][:] for i in ranked[:elite]]
        while len(new_pop) < POP:
            def pick():
                cand = rng.choice(POP, tournament, replace=False)
                return pop[int(min(cand, key=lambda c: fits[c]))]
            child = _ox(pick(), pick(), rng)
            if n > 1 and rng.random() < mut_rate:
                i, j = rng.choice(n, 2, replace=False)
                child[i], child[j] = child[j], child[i]
            new_pop.append(child)
        pop = new_pop
        fits, routes = evaluate(pop)
        b = int(np.argmin(fits))
        if fits[b] < gfit:
            gfit, groutes = fits[b], routes[b]
        hist.append(float(gfit))
    return {"routes": groutes, "fitness": float(gfit), "fitness_history": hist}


def run_aco(problem, seed, alpha=1.0, beta=3.0, rho=0.1):
    """Ant colony: ants build a delivery order using pheromone x closeness."""
    rng = np.random.default_rng(seed)
    n = _n(problem)
    tm = np.asarray(problem.time_matrix, dtype=float)
    eta = 1.0 / (tm + 1.0)
    tau = np.ones_like(tm)
    gfit, groutes, gorder = np.inf, None, None
    hist = []
    Q = None
    for _ in range(ITERS):
        ants = []
        for _a in range(POP):
            cur, unvisited, order = 0, list(range(1, n + 1)), []
            while unvisited:
                w = (tau[cur, unvisited] ** alpha) * (eta[cur, unvisited] ** beta)
                nxt = unvisited[int(rng.choice(len(unvisited), p=w / w.sum()))]
                order.append(nxt)
                unvisited.remove(nxt)
                cur = nxt
            fit, routes = fitness_of_order(order, problem)
            ants.append((fit, order, routes))
            if fit < gfit:
                gfit, groutes, gorder = fit, routes, order
        best_fit, best_order, _ = min(ants, key=lambda a: a[0])
        if Q is None:
            Q = best_fit                       # normalises deposits to ~1
        tau *= (1.0 - rho)
        for fit, order in ((best_fit, best_order), (gfit, gorder)):   # iteration-best + elitist
            path = [0] + order + [0]
            for a_, b_ in zip(path[:-1], path[1:]):
                tau[a_, b_] += Q / fit
        tau = np.maximum(tau, 1e-6)
        hist.append(float(gfit))
    return {"routes": groutes, "fitness": float(gfit), "fitness_history": hist}


def run_dijkstra_greedy(problem, seed=0):
    """Greedy nearest-neighbour over Dijkstra shortest-path times, split into
    vehicles by capacity. Deterministic baseline - no search at all."""
    tm = problem.time_matrix
    unvisited, cur, order = set(range(1, _n(problem) + 1)), 0, []
    while unvisited:
        nxt = min(unvisited, key=lambda j: tm[cur][j])
        order.append(nxt)
        unvisited.remove(nxt)
        cur = nxt
    fit, routes = fitness_of_order(order, problem)
    return {"routes": routes, "fitness": float(fit), "fitness_history": [float(fit)]}


def run_ortools(problem, seed=0, time_limit_s=5):
    """Google OR-Tools routing solver (exact-ish industry baseline).
    Needs `pip install ortools`. Returns None if not installed / no solution."""
    try:
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2
    except ImportError:
        return None

    tm = np.asarray(problem.time_matrix, dtype=float)
    N = tm.shape[0]
    V = len(problem.vehicle_capacities)
    manager = pywrapcp.RoutingIndexManager(N, V, 0)
    routing = pywrapcp.RoutingModel(manager)

    # Arc cost is scaled x60 so a "cost per late minute" of 50 can be expressed
    # as an integer cost-per-late-second of 50 (same ratio as fitness.py).
    def cost_cb(i, j):
        return int(tm[manager.IndexToNode(i)][manager.IndexToNode(j)] * 60)

    def time_cb(i, j):
        return int(tm[manager.IndexToNode(i)][manager.IndexToNode(j)])

    def demand_cb(i):
        return int(round(problem.demands[manager.IndexToNode(i)]))

    routing.SetArcCostEvaluatorOfAllVehicles(routing.RegisterTransitCallback(cost_cb))
    time_idx = routing.RegisterTransitCallback(time_cb)
    routing.AddDimension(time_idx, 10 ** 7, 10 ** 9, True, "Time")
    time_dim = routing.GetDimensionOrDie("Time")
    for node in range(1, N):
        due = problem.due_times[node] if problem.due_times is not None else None
        if due is not None and due != float("inf"):
            time_dim.SetCumulVarSoftUpperBound(
                manager.NodeToIndex(node), int(due), int(TIME_WINDOW_PENALTY_PER_MIN))
    cap_idx = routing.RegisterUnaryTransitCallback(demand_cb)
    routing.AddDimensionWithVehicleCapacity(
        cap_idx, 0, [int(c) for c in problem.vehicle_capacities], True, "Cap")

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.FromSeconds(int(time_limit_s))
    sol = routing.SolveWithParameters(params)
    if sol is None:
        return None

    routes, vids = [], []
    for v in range(V):
        idx, route = routing.Start(v), [0]
        while not routing.IsEnd(idx):
            idx = sol.Value(routing.NextVar(idx))
            route.append(manager.IndexToNode(idx))
        if len(route) > 2:                 # skip unused vehicles
            routes.append(route)
            vids.append(v)
    fit = score_routes(routes, vids, problem)   # re-scored by OUR rules
    return {"routes": routes, "fitness": float(fit), "fitness_history": [float(fit)]}


# name -> (function, is_stochastic)
ALGORITHMS = {
    "QPSO": (run_qpso, True),
    "OR-Tools": (run_ortools, False),
    "ACO": (run_aco, True),
    "GA": (run_ga, True),
    "PSO": (run_pso, True),
    "Dijkstra": (run_dijkstra_greedy, False),
}


# ---------------------------------------------------------------------------
# benchmark runner
# ---------------------------------------------------------------------------
def convergence_iter(history):
    """First iteration whose best cost is within 0.1% of the final best."""
    final = history[-1]
    for i, h in enumerate(history):
        if h <= final * (1 + CONVERGENCE_TOL) + 1e-9:
            return i
    return len(history) - 1


def run_benchmark(problem, runs=10, seed=0, include=None, ortools_time_limit_s=5):
    """
    Returns {"rows": [...], "best": {...}, "skipped": [...]}.
    rows: one dict per algorithm with the screenshot's columns, plus
          best_routes and best_history (for route maps / convergence charts).
    best: which algorithm wins each metric (ties included).
    """
    names = include or list(ALGORITHMS)
    rows, skipped = [], []
    for name in names:
        fn, stochastic = ALGORITHMS[name]
        n_runs = runs if stochastic else 1
        costs, times, convs, results = [], [], [], []
        for r in range(n_runs):
            t0 = time.perf_counter()
            res = (fn(problem, seed + r, ortools_time_limit_s) if name == "OR-Tools"
                   else fn(problem, seed + r))
            dt = (time.perf_counter() - t0) * 1000.0
            if res is None:
                break
            costs.append(res["fitness"] / 60.0)
            times.append(dt)
            convs.append(convergence_iter(res["fitness_history"]))
            results.append(res)
        if not results:
            skipped.append(name)
            continue
        b = int(np.argmin(costs))
        rows.append({
            "algorithm": name,
            "best_cost": round(float(min(costs)), 2),
            "mean_cost": round(float(np.mean(costs)), 2),
            "std_dev": round(float(np.std(costs, ddof=1)) if len(costs) > 1 else 0.0, 2),
            "runtime_ms": round(float(np.mean(times)), 1),
            "convergence_iter": int(round(float(np.mean(convs)))),
            "runs": len(costs),
            "best_routes": results[b]["routes"],
            "best_history": results[b]["fitness_history"],
        })

    best = {}
    for metric in ("best_cost", "mean_cost", "std_dev", "runtime_ms", "convergence_iter"):
        if rows:
            m = min(r[metric] for r in rows)
            best[metric] = [r["algorithm"] for r in rows if r[metric] == m]
    return {"rows": rows, "best": best, "skipped": skipped, "runs": runs}


# ---------------------------------------------------------------------------
# synthetic problem + CLI, so you can benchmark without the OSM graph
# ---------------------------------------------------------------------------
def make_synthetic_problem(n=50, num_vehicles=6, seed=0, deadline_share=0.4):
    from optimization.problem import OptimizationProblem
    rng = np.random.default_rng(seed)
    pts = rng.uniform(0, 10000, (n + 1, 2))                       # metres
    dist = np.linalg.norm(pts[:, None] - pts[None], axis=2)
    time_m = dist / (30 / 3.6)                                    # 30 km/h, seconds
    demands = [0] + [int(x) for x in rng.integers(1, 6, n)]
    cap = max(max(demands), int(np.ceil(sum(demands) * 1.3 / num_vehicles)))
    due = [float("inf")] + [
        float(rng.integers(30, 120) * 60) if rng.random() < deadline_share else float("inf")
        for _ in range(n)]
    return OptimizationProblem(
        time_matrix=time_m, distance_matrix=dist, paths={},
        demands=demands, vehicle_capacities=[cap] * num_vehicles,
        num_vehicles=num_vehicles, due_times=due)


if __name__ == "__main__":
    prob = make_synthetic_problem(n=50)
    out = run_benchmark(prob, runs=5)
    print(f"{'Algorithm':<10}{'Best':>9}{'Mean':>9}{'Std':>8}{'ms':>10}{'ConvIt':>8}")
    for r in out["rows"]:
        print(f"{r['algorithm']:<10}{r['best_cost']:>9}{r['mean_cost']:>9}"
              f"{r['std_dev']:>8}{r['runtime_ms']:>10}{r['convergence_iter']:>8}")
    print("winners:", out["best"])
    if out["skipped"]:
        print("skipped (not installed / no solution):", out["skipped"])