"""
optimization/problem.py
The standardized object you hand to Aniruddha's QPSO once it exists.
Nothing here runs an algorithm - it just bundles the inputs in one place
so the contract between you and him is unambiguous.
"""


class OptimizationProblem:
    def __init__(
        self,
        time_matrix,
        distance_matrix,
        paths,
        demands,
        vehicle_capacities,
        num_vehicles,
        due_times=None,
        objective_weights=None,
    ):
        self.time_matrix = time_matrix
        self.distance_matrix = distance_matrix
        self.paths = paths
        self.demands = demands
        self.vehicle_capacities = vehicle_capacities
        self.num_vehicles = num_vehicles
        # due_times[i] = deadline in seconds from depot departure for stop i,
        # or None/inf if stop i has no deadline. Same length as time_matrix.
        # Soft constraint: missing a deadline costs fitness, it doesn't
        # invalidate the route (see optimization/fitness.py::time_window_penalty).
        self.due_times = due_times
        self.objective_weights = objective_weights or {"time": 1.0, "distance": 0.0}
