"""
optimization/qpso.py
Quantum-behaved Particle Swarm Optimization (QPSO) for the multi-vehicle
routing problem described in OptimizationProblem.

WHY RANDOM-KEY ENCODING
QPSO's update rule needs continuous positions (it computes means, logs,
distances). A route is a discrete permutation of stops. Random-key encoding
bridges the two: each particle is a vector of n real numbers (n = number of
deliveries); argsort() of that vector gives a visiting order. QPSO searches
over the continuous vectors; we only convert to a permutation when we need
to evaluate fitness or read out the final answer.

CAPACITY -> MULTIPLE VEHICLES
Given one visiting order, `decode()` walks it left to right and starts a new
vehicle whenever adding the next delivery would exceed that vehicle's
capacity. If more vehicles get opened than the fleet actually has, that
particle is penalized heavily rather than rejected outright, so the swarm
can still learn "less bad" directions instead of hitting a hard wall.

CONTRACT
optimize(problem) returns exactly:
    {
        "routes": [[0, 2, 1, 0], [0, 3, 0], ...],  # matrix indices, 0 = depot
        "fitness": <float, total time + penalties, lower is better>,
        "fitness_history": [<fitness at each iteration>, ...],
    }
This is the same shape services/optimization_service.py already expects from
nearest_neighbor_solve(), so swapping it in is a one-line change there.
"""
from dataclasses import dataclass
import numpy as np

from optimization.fitness import evaluate_routes


CAPACITY_VIOLATION_PENALTY = 1e6   # per unit of demand over capacity
EXTRA_VEHICLE_PENALTY = 1e7        # per vehicle needed beyond the fleet size
UNREACHABLE = 1e9


@dataclass
class QPSOConfig:
    num_particles: int = 30
    num_iterations: int = 150
    beta_start: float = 1.0   # contraction-expansion coefficient, start (more exploration)
    beta_end: float = 0.4     # ...end (more exploitation)
    seed: int = 42


def decode(order, demands, capacities):
    """
    order: list of delivery indices (1..n, depot excluded), a visiting sequence.
    demands: list, demands[0] is the depot (always 0), demands[i] for delivery i.
    capacities: list of per-vehicle capacities, in the order vehicles will be used.

    Returns (routes, vehicles_used, overflow_demand):
        routes: list of routes, each a list of matrix indices starting/ending at 0
        vehicles_used: how many vehicles this decoding needed
        overflow_demand: total demand that didn't fit into any available vehicle
                         (0 if the fleet was big enough)
    """
    routes = []
    current_route = [0]
    current_load = 0.0
    vehicle_idx = 0
    overflow_demand = 0.0

    def capacity_for(idx):
        return capacities[idx] if idx < len(capacities) else 0.0  # ran out of real vehicles

    cap = capacity_for(vehicle_idx)
    for stop in order:
        d = demands[stop]
        if current_load + d > cap and len(current_route) > 1:
            # close current vehicle, start the next one
            current_route.append(0)
            routes.append(current_route)
            vehicle_idx += 1
            cap = capacity_for(vehicle_idx)
            current_route = [0]
            current_load = 0.0
        if current_load + d > cap:
            # doesn't fit even alone in a fresh vehicle (or fleet is exhausted)
            overflow_demand += d
            continue
        current_route.append(stop)
        current_load += d

    current_route.append(0)
    routes.append(current_route)
    vehicles_used = len(routes)
    return routes, vehicles_used, overflow_demand


def route_time(route, time_matrix):
    return sum(time_matrix[route[i]][route[i + 1]] for i in range(len(route) - 1))


def fitness_of_order(order, problem):
    """
    order: list of delivery indices (a permutation of 1..n).
    Lower is better. Uses the SAME shared scorer as every other algorithm
    (fitness.evaluate_routes: travel time + soft time-window penalty +
    unreachable-edge penalty), plus capacity / fleet-size penalties that
    come from how decode() builds routes.
    """
    routes, vehicles_used, overflow = decode(order, problem.demands, problem.vehicle_capacities)
    fit, _ = evaluate_routes(routes, problem.time_matrix, problem.due_times)

    penalty = 0.0
    if vehicles_used > problem.num_vehicles:
        penalty += EXTRA_VEHICLE_PENALTY * (vehicles_used - problem.num_vehicles)
    penalty += CAPACITY_VIOLATION_PENALTY * overflow
    return fit + penalty, routes


def optimize(problem, config: QPSOConfig = None):
    """
    Runs QPSO over random-key vectors of length n = number of deliveries,
    then decodes the best one found into vehicle routes.
    """
    config = config or QPSOConfig()
    rng = np.random.default_rng(config.seed)

    n = problem.time_matrix.shape[0] - 1  # number of deliveries (excludes depot)
    if n <= 0:
        return {"routes": [[0, 0]], "fitness": 0.0, "fitness_history": [0.0]}

    P, D = config.num_particles, n

    # --- initialize swarm ---
    positions = rng.uniform(0, 1, size=(P, D))
    pbest_pos = positions.copy()
    pbest_fit = np.full(P, np.inf)
    pbest_routes = [None] * P

    def order_from_position(pos):
        # argsort of the random keys -> a visiting order over delivery indices 1..n
        return [int(i) for i in (np.argsort(pos) + 1)]

    for i in range(P):
        order = order_from_position(positions[i])
        fit, routes = fitness_of_order(order, problem)
        pbest_fit[i] = fit
        pbest_routes[i] = routes

    gbest_idx = int(np.argmin(pbest_fit))
    gbest_pos = pbest_pos[gbest_idx].copy()
    gbest_fit = pbest_fit[gbest_idx]
    gbest_routes = pbest_routes[gbest_idx]

    fitness_history = [float(gbest_fit)]

    # --- main QPSO loop ---
    for it in range(config.num_iterations):
        beta = config.beta_start - (config.beta_start - config.beta_end) * (it / max(1, config.num_iterations - 1))
        mbest = pbest_pos.mean(axis=0)  # mean personal-best position, the quantum "center"

        for i in range(P):
            phi = rng.uniform(0, 1, size=D)
            p = phi * pbest_pos[i] + (1 - phi) * gbest_pos  # local attractor point

            u = rng.uniform(1e-6, 1.0, size=D)  # avoid log(0)
            sign = np.where(rng.uniform(0, 1, size=D) > 0.5, 1.0, -1.0)
            positions[i] = p + sign * beta * np.abs(mbest - positions[i]) * np.log(1.0 / u)

            order = order_from_position(positions[i])
            fit, routes = fitness_of_order(order, problem)

            if fit < pbest_fit[i]:
                pbest_fit[i] = fit
                pbest_pos[i] = positions[i].copy()
                pbest_routes[i] = routes

            if fit < gbest_fit:
                gbest_fit = fit
                gbest_pos = positions[i].copy()
                gbest_routes = routes

        fitness_history.append(float(gbest_fit))

    return {
        "routes": gbest_routes,
        "fitness": float(gbest_fit),
        "fitness_history": fitness_history,
    }