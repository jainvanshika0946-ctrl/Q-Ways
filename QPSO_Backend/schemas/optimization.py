"""
schemas/optimization.py
Pydantic models describing every request and response the API uses.
Keeping these separate from main.py makes it easy to see, at a glance,
exactly what shape of JSON each endpoint expects and returns.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# ---------- shared building blocks ----------

class LatLon(BaseModel):
    lat: float
    lon: float


class Delivery(BaseModel):
    id: str
    lat: float
    lon: float
    demand: float = 0
    due_time_min: Optional[float] = Field(
        default=None,
        description="Soft deadline: minutes from depot departure by which this "
                    "delivery should be reached. Missing it adds cost but does not "
                    "invalidate the route.",
    )


class Vehicle(BaseModel):
    id: str
    capacity: float


# ---------- /graph/build ----------

class GraphBuildRequest(BaseModel):
    center_lat: float = 13.0827
    center_lon: float = 80.2707
    radius_m: int = 2500


class GraphBuildResponse(BaseModel):
    status: str
    num_nodes: int
    num_edges: int
    cache_path: str


# ---------- /snap ----------

class SnapRequest(BaseModel):
    coords: List[LatLon] = Field(..., description="depot first, then each delivery, in order")


class SnapResponse(BaseModel):
    status: str
    node_ids: List[int]


# ---------- /traffic/apply ----------

class TrafficRequest(BaseModel):
    mode: Literal["normal", "rush", "auto"] = "normal"
    seed: int = 42
    gamma: float = 1.5


class TrafficResponse(BaseModel):
    status: str
    mode_requested: str          # what you asked for, e.g. "auto"
    mode_applied: str            # what actually got applied, e.g. "rush"
    sample_congestion: List[float]
    avg_congestion: float


# ---------- /matrix/build ----------

class MatrixBuildRequest(BaseModel):
    depot: LatLon
    deliveries: List[Delivery]
    traffic_mode: Literal["normal", "rush", "auto"] = "normal"


class MatrixBuildResponse(BaseModel):
    status: str
    traffic_mode_applied: str   # what "auto" resolved to, if used
    stop_ids: List[str]         # ["D", "A", "B", "C"] in matrix order
    node_ids: List[int]         # matching graph node ids
    time_matrix: List[List[float]]
    dist_matrix: List[List[float]]


# ---------- /optimize ----------

class OptimizeRequest(BaseModel):
    depot: LatLon
    deliveries: List[Delivery]
    vehicles: List[Vehicle]
    traffic_mode: Literal["normal", "rush", "auto"] = "normal"
    algorithm: Literal["QPSO", "nearest_neighbor"] = "nearest_neighbor"


class StopETA(BaseModel):
    id: str
    eta_min: float                       # minutes from depot departure
    due_min: Optional[float] = None      # the delivery's requested deadline, if any
    late_by_min: float = 0               # 0 if on time or no deadline was set


class VehicleResult(BaseModel):
    vehicle_id: str
    stops: List[str]
    distance_km: float
    travel_time_min: float
    route_coordinates: List[List[float]]
    stop_etas: List[StopETA]


class StopInfo(BaseModel):
    id: str                     # "D" for the depot, else the delivery id
    lat: float                  # original lat sent by the frontend
    lon: float                  # original lon sent by the frontend
    snapped_lat: float          # where the stop sits on the road network
    snapped_lon: float
    is_depot: bool = False


class OptimizeResponse(BaseModel):
    status: str
    algorithm: str
    traffic_mode_applied: str   # what "auto" resolved to, if used
    stops: List[StopInfo]       # every marker the map needs
    vehicles: List[VehicleResult]
    total_distance_km: float
    total_time_min: float
    fitness: Optional[float] = None
    fitness_history: Optional[List[float]] = None