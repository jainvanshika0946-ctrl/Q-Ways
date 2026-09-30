"""
traffic.py
Simulated traffic (the PS allows real-time OR simulated conditions).
Each road gets a congestion value c in [0, 1], and the dynamic travel time is
    dyn_time = travel_time * (1 + gamma * c)
"""
import random

# Typical congestion level by road class, per mode. Main roads jam most in rush hour.
BASE_CONGESTION = {
    "normal": {"motorway": 0.15, "trunk": 0.2, "primary": 0.25, "secondary": 0.2, "default": 0.1},
    "rush":   {"motorway": 0.6,  "trunk": 0.7, "primary": 0.75, "secondary": 0.55, "default": 0.3},
}


def _road_class(data):
    """OSM 'highway' can be a string or a list; return one clean road-type name."""
    hw = data.get("highway", "default")
    hw = hw[0] if isinstance(hw, list) else hw
    return hw.replace("_link", "")


def _update_dyn_time(data, gamma):
    """Applies the formula: dyn_time = base travel time * (1 + gamma * congestion)."""
    data["dyn_time"] = data["travel_time"] * (1 + gamma * data["congestion"])


def apply_traffic(G, mode="normal", seed=42, gamma=1.5):
    """
    Sets congestion on every road for 'normal' or 'rush' mode, then computes dyn_time.
    Same seed = same traffic, so demos are repeatable.
    """
    rng = random.Random(seed)
    table = BASE_CONGESTION[mode]
    for u, v, k, data in G.edges(keys=True, data=True):
        base = table.get(_road_class(data), table["default"])
        c = base + rng.uniform(-0.1, 0.1)          # small random variation per road
        data["congestion"] = min(max(c, 0.0), 1.0)
        _update_dyn_time(data, gamma)
    return G


def tick_traffic(G, seed=None, gamma=1.5, incident_prob=0.02):
    """
    Moves traffic forward one step (the 'Simulate Traffic Update' button).
    Congestion drifts a little, and 2% of roads get a sudden incident spike.
    This is the dynamic weight update mechanism the PS asks for.
    """
    rng = random.Random(seed)
    for u, v, k, data in G.edges(keys=True, data=True):
        c = data["congestion"] + rng.uniform(-0.05, 0.05)
        if rng.random() < incident_prob:
            c += 0.4
        data["congestion"] = min(max(c, 0.0), 1.0)
        _update_dyn_time(data, gamma)
    return G


def congestion_label(c):
    """Maps a congestion value to the legend used on the map: Low / Moderate / Heavy."""
    return "Low" if c < 0.3 else "Moderate" if c < 0.6 else "Heavy"
