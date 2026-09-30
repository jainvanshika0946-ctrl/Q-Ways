"""
route_geometry.py
Converts graph routes into plain (lat, lon) coordinates and colors, so the
frontend (Leaflet map) can draw them without knowing anything about NetworkX.
"""


def path_to_latlon(G, path):
    """
    path: a list of road-node ids, e.g. from distance_matrix's `paths[(i, j)]`.
    Returns [[lat, lon], [lat, lon], ...] — one point per intersection on the
    route, ready to hand straight to a Leaflet polyline.
    """
    return [[G.nodes[n]["y"], G.nodes[n]["x"]] for n in path]


def route_to_geojson(G, path, color="#b5432c"):
    """
    Wraps one route as a GeoJSON Feature (a standard map format Leaflet
    understands directly via L.geoJSON()).
    """
    coords = [[G.nodes[n]["x"], G.nodes[n]["y"]] for n in path]  # GeoJSON = (lon, lat) order
    return {
        "type": "Feature",
        "properties": {"color": color},
        "geometry": {"type": "LineString", "coordinates": coords},
    }


def edges_to_geojson(G):
    """
    Turns every road in the graph into a GeoJSON Feature colored by its current
    congestion, for the background map layer (the gray-to-red road coloring).
    One call per traffic update — congestion changes, so colors are recomputed.
    """
    from graph.traffic import congestion_label

    colors = {"Low": "#9c968a", "Moderate": "#d98a6f", "Heavy": "#b5432c"}
    features = []
    for u, v, data in G.edges(data=True):
        coords = [[G.nodes[u]["x"], G.nodes[u]["y"]], [G.nodes[v]["x"], G.nodes[v]["y"]]]
        label = congestion_label(data.get("congestion", 0))
        features.append({
            "type": "Feature",
            "properties": {"congestion": label, "color": colors[label]},
            "geometry": {"type": "LineString", "coordinates": coords},
        })
    return {"type": "FeatureCollection", "features": features}
