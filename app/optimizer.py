import math
from typing import Tuple, List, Dict, Any
from models import Incident, Recommendation, RecommendationStatus, AllocationStatus, IncidentStatus, ResourceStatus, ResourceType, IncidentType
from database import DataStore
import uuid
from maps import get_road_factor_for_area

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def estimate_travel_time(distance_km: float, speed_kmh: float, road_factor: float) -> float:
    if speed_kmh <= 0 or road_factor <= 0:
        return 999.0
    # hours to minutes
    return (distance_km / (speed_kmh * road_factor)) * 60.0

def calculate_priority(incident: Incident) -> float:
    severity_normalized = incident.severity / 5.0
    return 0.35 * severity_normalized + 0.25 * incident.population_impact + 0.20 * incident.vulnerability_score + 0.20 * incident.accessibility_risk

def get_compatible_types(incident_type: IncidentType) -> List[ResourceType]:
    if incident_type == IncidentType.MEDICAL_EMERGENCY:
        return [ResourceType.AMBULANCE, ResourceType.MEDICAL_UNIT, ResourceType.HELICOPTER]
    elif incident_type in (IncidentType.EARTHQUAKE_DAMAGE, IncidentType.STRUCTURAL_COLLAPSE):
        return [ResourceType.RESCUE_TEAM, ResourceType.FIRE_TRUCK]
    elif incident_type == IncidentType.FIRE:
        return [ResourceType.FIRE_TRUCK, ResourceType.RESCUE_TEAM]
    elif incident_type == IncidentType.FLOOD:
        return [ResourceType.BOAT, ResourceType.RESCUE_TEAM, ResourceType.HELICOPTER]
    elif incident_type == IncidentType.HAZMAT_SPILL:
        return [ResourceType.HAZMAT, ResourceType.FIRE_TRUCK]
    elif incident_type == IncidentType.TRAPPED_PERSONS:
        return [ResourceType.RESCUE_TEAM, ResourceType.FIRE_TRUCK, ResourceType.HELICOPTER]
    elif incident_type == IncidentType.UTILITY_FAILURE:
        return [ResourceType.RESCUE_TEAM, ResourceType.SUPPLY_TRUCK]
    elif incident_type == IncidentType.EVACUATION:
        return [ResourceType.SUPPLY_TRUCK, ResourceType.AMBULANCE, ResourceType.HELICOPTER]
    return list(ResourceType)

def run_optimization(db: DataStore) -> Tuple[List[Recommendation], str]:
    run_id = str(uuid.uuid4())
    recommendations = []
    
    # Get incidents
    target_statuses = {IncidentStatus.NEW, IncidentStatus.VERIFIED, IncidentStatus.PRIORITIZED}
    pending_incidents = [i for i in db.incidents.values() if i.status in target_statuses]
    
    for inc in pending_incidents:
        inc.priority_score = calculate_priority(inc)
        
    pending_incidents.sort(key=lambda x: x.priority_score, reverse=True)
    
    available_resources = [r for r in db.resources.values() if r.status == ResourceStatus.AVAILABLE]
    # To keep track of assignments in this run so we don't double book
    tentatively_assigned = set()
    
    for inc in pending_incidents:
        compatible_types = get_compatible_types(inc.type)
        candidates = []
        
        for res in available_resources:
            if res.id in tentatively_assigned:
                continue
            if res.type not in compatible_types:
                continue
                
            dist = haversine(res.latitude, res.longitude, inc.latitude, inc.longitude)
            road_factor = get_road_factor_for_area(db, inc.latitude, inc.longitude)
            eta = estimate_travel_time(dist, res.speed_kmh, road_factor)
            
            score = 100.0 - eta # simple score: lower ETA is better
            candidates.append({"res": res, "eta": eta, "score": score, "dist": dist})
            
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        if candidates:
            best = candidates[0]
            tentatively_assigned.add(best["res"].id)
            
            alts = []
            for alt in candidates[1:4]:
                alts.append({
                    "resource_id": alt["res"].id,
                    "resource_name": alt["res"].name,
                    "eta_minutes": alt["eta"],
                    "score": alt["score"]
                })
                
            rec = Recommendation(
                incident_id=inc.id,
                resource_id=best["res"].id,
                priority_score=inc.priority_score,
                confidence=0.9 if best["eta"] < 30 else 0.6,
                reasons=[f"Best ETA ({best['eta']:.1f} mins)", f"Matches capability {best['res'].type.value}"],
                alternatives=alts,
                eta_minutes=best["eta"],
                road_state_summary="Conditions normal" if get_road_factor_for_area(db, inc.latitude, inc.longitude) >= 0.8 else "Degraded conditions",
                optimization_run_id=run_id
            )
            recommendations.append(rec)
            db.recommendations[rec.id] = rec
            db.add_audit("CREATE", "Recommendation", rec.id, "system", "Optimizer generated recommendation")
            
    return recommendations, run_id

def run_reallocation(db: DataStore) -> Tuple[List[Recommendation], List[str]]:
    deallocated = []
    # Cancel all pending recommendations
    for rec in db.recommendations.values():
        if rec.status == RecommendationStatus.PENDING:
            rec.status = RecommendationStatus.REJECTED
            
    # For a simple mock, just run optimization again
    new_recs, run_id = run_optimization(db)
    return new_recs, deallocated
