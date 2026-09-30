"""
services/graph_service.py
Thin wrapper around Vanshika's graph/traffic/matrix functions, plus a
process-wide cache so you don't re-download OSM data on every request.

This is deliberately the ONLY place that holds a live NetworkX graph object
in memory. Every endpoint in main.py goes through this module instead of
touching graph.road_network etc. directly, so there's one obvious place to
look when something about the graph state is wrong.
"""
from datetime import datetime

from graph.road_network import load_city, snap_points
from graph.traffic import apply_traffic
from graph.distance_matrix import build_matrices

# Simple time-of-day rule for "auto" traffic mode. This is NOT live traffic
# sensing - nothing here reads real road conditions. It's a clock-based
# guess, same spirit as traffic.py's BASE_CONGESTION presets. Real live
# traffic would need an external feed (Google/TomTom), which is out of
# scope for this simulated-traffic prototype.
RUSH_HOURS = set(range(8, 12)) | set(range(17, 21))  # 8-11am and 5-8pm


class GraphState:
    """
    Holds the one road graph this backend instance is working with.
    A student prototype doesn't need multi-user graph isolation -
    if you later need that, key this dict by session/user id instead
    of using bare module-level globals.
    """
    def __init__(self):
        self.G = None
        self.center = None
        self.radius_m = None
        self.traffic_mode = None          # the mode actually applied ("normal"/"rush")
        self.traffic_mode_requested = None  # what the caller asked for (may be "auto")


state = GraphState()


def resolve_traffic_mode(mode):
    """
    "auto" -> "normal" or "rush" based on the current clock hour.
    "normal"/"rush" pass through unchanged.
    """
    if mode != "auto":
        return mode
    hour = datetime.now().hour
    return "rush" if hour in RUSH_HOURS else "normal"


def ensure_graph(center_lat=13.0827, center_lon=80.2707, radius_m=2500, cache_path="city.graphml"):
    """
    Loads the road graph if it isn't already loaded (or if a different
    center/radius is requested), then returns it. Call this at the top of
    any endpoint that needs a graph.
    """
    center = (center_lat, center_lon)
    if state.G is None or state.center != center or state.radius_m != radius_m:
        state.G = load_city(center=center, radius_m=radius_m, cache_path=cache_path)
        state.center = center
        state.radius_m = radius_m
        state.traffic_mode = None  # freshly loaded graph has no traffic applied yet
    return state.G


def snap(coords):
    """coords: list of (lat, lon) tuples. Returns nearest road-node ids."""
    if state.G is None:
        raise RuntimeError("Graph not loaded yet - call ensure_graph() first")
    return snap_points(state.G, coords)


def apply_traffic_mode(mode="normal", seed=42, gamma=1.5):
    """
    Applies congestion + dyn_time to every edge of the currently loaded graph.
    mode can be "normal", "rush", or "auto" (resolved via resolve_traffic_mode).
    Returns (graph, resolved_mode) so callers can report which mode was
    actually used, not just what was requested.
    """
    if state.G is None:
        raise RuntimeError("Graph not loaded yet - call ensure_graph() first")
    resolved = resolve_traffic_mode(mode)
    apply_traffic(state.G, mode=resolved, seed=seed, gamma=gamma)
    state.traffic_mode = resolved
    state.traffic_mode_requested = mode
    return state.G, resolved


def matrices(node_ids):
    """node_ids: list of graph node ids, depot first. Returns (time_m, dist_m, paths)."""
    if state.G is None:
        raise RuntimeError("Graph not loaded yet - call ensure_graph() first")
    if state.traffic_mode is None:
        # dyn_time doesn't exist until traffic has been applied at least once
        apply_traffic_mode(mode="normal")
    return build_matrices(state.G, node_ids)