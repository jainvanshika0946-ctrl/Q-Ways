"""
distance_matrix.py
Turns the road graph into two simple tables (matrices) for the QPSO engine:
  time_matrix[i][j] = travel time (seconds) from stop i to stop j, using current traffic
  dist_matrix[i][j] = road distance (metres) along that same fastest route
The QPSO engine then only does table lookups, so it runs fast.
"""
import numpy as np
import networkx as nx

UNREACHABLE = 1e9


def _path_length(G, path):
    """Adds up road lengths along a path (uses the fastest of any parallel roads)."""
    total = 0.0
    for u, v in zip(path[:-1], path[1:]):
        best = min(G[u][v].values(), key=lambda d: d["dyn_time"])
        total += best["length"]
    return total


def build_matrices(G, nodes):
    """
    nodes: list of graph node ids (depot first, then stops), from snap_points().
    Returns (time_matrix, dist_matrix, paths).
    paths[(i, j)] = list of graph nodes to drive from nodes[i] to nodes[j]
    (i and j are positions in the `nodes` list, not raw node ids).
    """
    n = len(nodes)
    time_m = np.full((n, n), UNREACHABLE)
    dist_m = np.full((n, n), UNREACHABLE)
    paths = {}
    for i, src in enumerate(nodes):
        # one Dijkstra run from src gives the fastest route to every other stop
        times, routes = nx.single_source_dijkstra(G, src, weight="dyn_time")
        for j, dst in enumerate(nodes):
            if dst in times:
                time_m[i][j] = times[dst]
                dist_m[i][j] = _path_length(G, routes[dst])
                paths[(i, j)] = routes[dst]
    return time_m, dist_m, paths
