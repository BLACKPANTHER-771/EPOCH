from database import DataStore
from typing import List, Dict, Any
import math

def get_roads(db: DataStore) -> List[Dict[str, Any]]:
    return [r.model_dump() for r in db.roads.values()]

def get_hospitals(db: DataStore) -> List[Dict[str, Any]]:
    return [h.model_dump() for h in db.hospitals.values()]

def get_shelters(db: DataStore) -> List[Dict[str, Any]]:
    return [s.model_dump() for s in db.shelters.values()]

def mock_route(from_lat: float, from_lon: float, to_lat: float, to_lon: float) -> List[List[float]]:
    # Simple straight line with 3 points
    mid_lat = (from_lat + to_lat) / 2
    mid_lon = (from_lon + to_lon) / 2
    return [[from_lon, from_lat], [mid_lon, mid_lat], [to_lon, to_lat]]

def get_road_factor_for_area(db: DataStore, lat: float, lon: float) -> float:
    # Just return average of all roads for now or 1.0 if empty
    if not db.roads:
        return 1.0
    factors = [r.speed_factor for r in db.roads.values()]
    return sum(factors) / len(factors)
