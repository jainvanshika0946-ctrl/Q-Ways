"""
optimization/fitness.py
Shared cost/penalty math used by every solver (nearest-neighbor, QPSO, and
whatever else gets added later). Keeping this in one place means every
algorithm is scored the same way, which is the whole point of the
benchmarking section in the project guide - "QPSO took 22 min, GA took 24
min" is only a fair comparison if both were penalized identically for
lateness and overloading.

PENALTIES ARE SOFT
None of these reject a solution outright. They add cost. A route that's
5 minutes late to one stop is worse than an on-time route, but still a
valid, returnable answer - "allowed but costly," as the brief for time
windows puts it. Capacity works the same way in the existing QPSO code.
"""

UNREACHABLE = 1e9
CAPACITY_VIOLATION_PENALTY = 1e6     # cost per unit of demand that didn't fit
EXTRA_VEHICLE_PENALTY = 1e7          # cost per vehicle needed beyond the fleet
TIME_WINDOW_PENALTY_PER_MIN = 50.0   # cost per minute a stop is reached late


def route_time(route, time_matrix):
    """Total travel time (seconds) for one route, e.g. [0, 2, 4, 0]."""
    return sum(time_matrix[route[i]][route[i + 1]] for i in range(len(route) - 1))


def route_distance(route, dist_matrix):
    """Total road distance (metres) for one route."""
    return sum(dist_matrix[route[i]][route[i + 1]] for i in range(len(route) - 1))


def compute_etas(route, time_matrix):
    """
    Returns [(stop_index, eta_seconds), ...] - the cumulative travel time
    from the moment the vehicle leaves the depot to the moment it reaches
    each stop on this route, in visiting order (depot itself gets eta 0).
    """
    etas = []
    t = 0.0
    for i, stop in enumerate(route):
        etas.append((stop, t))
        if i < len(route) - 1:
            t += time_matrix[route[i]][route[i + 1]]
    return etas


def time_window_penalty(route, time_matrix, due_times):
    """
    due_times: list aligned with time_matrix indices; due_times[i] is the
    deadline in seconds (from depot departure) for stop i, or None/inf if
    that stop has no deadline. Depot's own entry is ignored.

    Returns (penalty, late_by_seconds) where late_by_seconds is a dict of
    {stop_index: seconds_late} for stops that missed their window - handy
    for showing the person exactly which delivery is at risk.
    """
    if due_times is None:
        return 0.0, {}
    penalty = 0.0
    late_by = {}
    for stop, eta in compute_etas(route, time_matrix):
        due = due_times[stop] if stop < len(due_times) else None
        if due is None or due == float("inf"):
            continue
        if eta > due:
            late_seconds = eta - due
            penalty += TIME_WINDOW_PENALTY_PER_MIN * (late_seconds / 60.0)
            late_by[stop] = late_seconds
    return penalty, late_by


def evaluate_routes(routes, time_matrix, due_times=None):
    """
    Scores a full multi-vehicle solution: total travel time + time-window
    penalties + an unreachable-edge penalty (any UNREACHABLE edge means a
    stop got snapped onto a disconnected part of the graph).
    Does NOT include capacity/fleet-size penalties - those depend on how a
    particular solver builds routes from an order, so they're computed
    where routes are constructed (see optimization/qpso.py::decode).
    Returns (fitness, per_route_late_by) where per_route_late_by is a list
    of the {stop_index: seconds_late} dict for each route, in order.
    """
    total_time = 0.0
    total_penalty = 0.0
    per_route_late = []
    for r in routes:
        total_time += route_time(r, time_matrix)
        tw_penalty, late_by = time_window_penalty(r, time_matrix, due_times)
        total_penalty += tw_penalty
        per_route_late.append(late_by)
        if any(time_matrix[r[i]][r[i + 1]] >= UNREACHABLE for i in range(len(r) - 1)):
            total_penalty += EXTRA_VEHICLE_PENALTY
    return total_time + total_penalty, per_route_late