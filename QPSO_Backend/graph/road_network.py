"""
road_network.py
Downloads a real road network from OpenStreetMap (via OSMnx) and prepares it
as a weighted NetworkX graph: every road gets a speed and a base travel time.
"""
import os
import osmnx as ox


def load_city(center=(13.0827, 80.2707), radius_m=2500, cache_path="city.graphml"):
    """
    Returns a weighted road graph around `center` (lat, lon).
    - First run: downloads from OpenStreetMap, adds speeds + travel times, saves to disk.
    - Later runs: loads the saved file instantly (so the demo works without internet).
    """
    if os.path.exists(cache_path):
        return ox.load_graphml(cache_path)

    G = ox.graph_from_point(center, dist=radius_m, network_type="drive")
    G = ox.add_edge_speeds(G)          # adds 'speed_kph' to every road
    G = ox.add_edge_travel_times(G)    # adds 'travel_time' (seconds) = length / speed
    ox.save_graphml(G, cache_path)
    return G


def snap_points(G, coords):
    """
    coords: list of (lat, lon) pairs typed or clicked by the user.
    Returns the id of the nearest road intersection for each pair.
    Routes can only run on roads, so every depot/stop must sit on a graph node.
    """
    lats = [c[0] for c in coords]
    lons = [c[1] for c in coords]
    return list(ox.nearest_nodes(G, X=lons, Y=lats))
