from fastapi import APIRouter, HTTPException
from database import db
from models import IncidentCreate, VerifyRequest, ApproveRequest, RejectRequest, IncidentStatus, ResourceStatus, Allocation
from optimizer import run_optimization, run_reallocation, calculate_priority
from maps import get_roads, get_hospitals, get_shelters
from eo import get_eo_layers

router = APIRouter(prefix="/api")

@router.get("/incidents")
def get_incidents_api():
    return {"incidents": [i.model_dump() for i in db.incidents.values()]}

@router.post("/incidents")
def create_incident_api(inc: IncidentCreate):
    from models import Incident
    incident = Incident(
        title=inc.title,
        description=inc.description,
        type=inc.type,
        severity=inc.severity,
        latitude=inc.latitude,
        longitude=inc.longitude,
        population_impact=inc.population_impact,
        vulnerability_score=inc.vulnerability_score,
        accessibility_risk=inc.accessibility_risk
    )
    incident.priority_score = calculate_priority(incident)
    db.incidents[incident.id] = incident
    db.add_audit("CREATE", "Incident", incident.id, "system", "Created incident")
    return incident.model_dump()

@router.post("/incidents/{id}/verify")
def verify_incident_api(id: str, req: VerifyRequest):
    inc = db.incidents.get(id)
    if not inc:
        raise HTTPException(404, "Not found")
    prev_status = inc.status
    inc.status = req.status
    inc.verification_notes = req.notes
    inc.verified_by = req.verified_by
    inc.is_duplicate_of = req.duplicate_of
    db.add_audit("UPDATE", "Incident", id, req.verified_by, "Verified", prev_status.value, req.status.value)
    return {"incident": inc.model_dump()}

@router.get("/resources")
def get_resources_api():
    return {"resources": [r.model_dump() for r in db.resources.values()]}

@router.get("/allocations")
def get_allocations_api():
    return {"allocations": [a.model_dump() for a in db.allocations.values()]}

@router.post("/optimize")
def optimize_api():
    recs, run_id = run_optimization(db)
    return {"recommendations": [r.model_dump() for r in recs], "optimization_run_id": run_id}

@router.post("/reallocate")
def reallocate_api():
    recs, dealloc = run_reallocation(db)
    return {"recommendations": [r.model_dump() for r in recs], "deallocated": dealloc, "optimization_run_id": "realloc"}

@router.post("/recommendations/{id}/approve")
def approve_rec_api(id: str, req: ApproveRequest):
    rec = db.recommendations.get(id)
    if not rec:
        raise HTTPException(404, "Not found")
    
    from models import RecommendationStatus
    rec.status = RecommendationStatus.APPROVED
    
    res = db.resources.get(rec.resource_id)
    inc = db.incidents.get(rec.incident_id)
    if res:
        res.status = ResourceStatus.RESERVED
    if inc:
        inc.status = IncidentStatus.ALLOCATED
        
    alloc = Allocation(
        incident_id=rec.incident_id,
        resource_id=rec.resource_id,
        eta_minutes=rec.eta_minutes,
        distance_km=0.0, # Mock
        approved_by=req.approved_by,
        approved_at=rec.created_at # mock
    )
    db.allocations[alloc.id] = alloc
    db.add_audit("APPROVE", "Recommendation", id, req.approved_by, "Approved allocation")
    return {"allocation": alloc.model_dump(), "recommendation": rec.model_dump()}

@router.post("/recommendations/{id}/reject")
def reject_rec_api(id: str, req: RejectRequest):
    rec = db.recommendations.get(id)
    if not rec:
        raise HTTPException(404, "Not found")
    from models import RecommendationStatus
    rec.status = RecommendationStatus.REJECTED
    db.add_audit("REJECT", "Recommendation", id, req.rejected_by, req.reason)
    return {"recommendation": rec.model_dump()}

@router.get("/roads")
def get_roads_api():
    return {
        "roads": get_roads(db),
        "hospitals": get_hospitals(db),
        "shelters": get_shelters(db)
    }

@router.post("/roads/{id}")
def update_road_api(id: str, req: dict):
    from models import RoadState
    rd = db.roads.get(id)
    if not rd:
        raise HTTPException(404, "Not found")
    prev = rd.state
    rd.state = RoadState(req.get("state", "OPEN"))
    db.add_audit("UPDATE", "Road", id, "system", "Road state changed", prev.value, rd.state.value)
    return {"road": rd.model_dump()}

@router.get("/hazards")
def get_hazards_api():
    return {"hazards": [h.model_dump() for h in db.hazards.values()]}

@router.get("/eo")
def get_eo_api():
    return {"layers": [l.model_dump() for l in get_eo_layers(db)]}

@router.get("/dashboard")
def get_dashboard_api():
    from models import IncidentStatus
    incs = db.incidents.values()
    recs = db.recommendations.values()
    ress = db.resources.values()
    
    total_incidents = len(incs)
    active_incidents = sum(1 for i in incs if i.status not in (IncidentStatus.RESOLVED, IncidentStatus.CANCELLED, IncidentStatus.REJECTED))
    resolved_incidents = sum(1 for i in incs if i.status == IncidentStatus.RESOLVED)
    
    from models import RecommendationStatus
    pending_approvals = sum(1 for r in recs if r.status == RecommendationStatus.PENDING)
    
    total_resources = len(ress)
    available_resources = sum(1 for r in ress if r.status == ResourceStatus.AVAILABLE)
    deployed_resources = total_resources - available_resources
    
    allocs = list(db.allocations.values())
    avg_response_time_minutes = sum(a.eta_minutes for a in allocs) / len(allocs) if allocs else 0
    
    inc_by_sev = {}
    for i in incs:
        inc_by_sev[i.severity] = inc_by_sev.get(i.severity, 0) + 1
        
    inc_by_type = {}
    for i in incs:
        inc_by_type[i.type.value] = inc_by_type.get(i.type.value, 0) + 1
        
    inc_by_stat = {}
    for i in incs:
        inc_by_stat[i.status.value] = inc_by_stat.get(i.status.value, 0) + 1
        
    res_by_type = {}
    for r in ress:
        res_by_type[r.type.value] = res_by_type.get(r.type.value, 0) + 1
        
    res_by_stat = {}
    for r in ress:
        res_by_stat[r.status.value] = res_by_stat.get(r.status.value, 0) + 1
        
    approved_recs = sum(1 for r in recs if r.status == RecommendationStatus.APPROVED)
    total_recs = len(recs)
    eff = (approved_recs / total_recs) if total_recs else 0.0
    
    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "resolved_incidents": resolved_incidents,
        "pending_approvals": pending_approvals,
        "total_resources": total_resources,
        "available_resources": available_resources,
        "deployed_resources": deployed_resources,
        "avg_response_time_minutes": avg_response_time_minutes,
        "incidents_by_severity": inc_by_sev,
        "incidents_by_type": inc_by_type,
        "incidents_by_status": inc_by_stat,
        "resources_by_type": res_by_type,
        "resources_by_status": res_by_stat,
        "recent_activity": [a.model_dump() for a in sorted(db.audit_log, key=lambda x: x.timestamp, reverse=True)[:20]],
        "allocation_efficiency": eff
    }

@router.get("/audit")
def get_audit_api():
    return {"entries": [a.model_dump() for a in sorted(db.audit_log, key=lambda x: x.timestamp, reverse=True)]}
