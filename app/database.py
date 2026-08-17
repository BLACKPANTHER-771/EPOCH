import json
from pathlib import Path
from typing import Dict, List, Optional
from models import (
    Incident, Resource, Allocation, Recommendation, AuditLogEntry,
    Road, Hazard, Hospital, Shelter, EOLayer, get_iso_now
)

class DataStore:
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.resources: Dict[str, Resource] = {}
        self.allocations: Dict[str, Allocation] = {}
        self.recommendations: Dict[str, Recommendation] = {}
        self.audit_log: List[AuditLogEntry] = []
        self.roads: Dict[str, Road] = {}
        self.hazards: Dict[str, Hazard] = {}
        self.hospitals: Dict[str, Hospital] = {}
        self.shelters: Dict[str, Shelter] = {}
        self.eo_layers: List[EOLayer] = []

    def load_demo_data(self):
        data_path = Path(__file__).parent.parent / 'data' / 'demo.json'
        if not data_path.exists():
            return
            
        with open(data_path, 'r') as f:
            data = json.load(f)

        for inc_data in data.get('incidents', []):
            inc = Incident.model_validate(inc_data)
            self.incidents[inc.id] = inc
            
        for res_data in data.get('resources', []):
            res = Resource.model_validate(res_data)
            self.resources[res.id] = res

        for alloc_data in data.get('allocations', []):
            alloc = Allocation.model_validate(alloc_data)
            self.allocations[alloc.id] = alloc

        for rec_data in data.get('recommendations', []):
            rec = Recommendation.model_validate(rec_data)
            self.recommendations[rec.id] = rec

        for audit_data in data.get('audit_log', []):
            audit = AuditLogEntry.model_validate(audit_data)
            self.audit_log.append(audit)
            
        for road_data in data.get('roads', []):
            road = Road.model_validate(road_data)
            self.roads[road.id] = road
            
        for hazard_data in data.get('hazards', []):
            haz = Hazard.model_validate(hazard_data)
            self.hazards[haz.id] = haz
            
        for hosp_data in data.get('hospitals', []):
            hosp = Hospital.model_validate(hosp_data)
            self.hospitals[hosp.id] = hosp

        for shelter_data in data.get('shelters', []):
            shelter = Shelter.model_validate(shelter_data)
            self.shelters[shelter.id] = shelter

        for eo_data in data.get('eo_layers', []):
            eo = EOLayer.model_validate(eo_data)
            self.eo_layers.append(eo)

    def save_state(self):
        data_path = Path(__file__).parent.parent / 'data' / 'state.json'
        data = {
            "incidents": [v.model_dump() for v in self.incidents.values()],
            "resources": [v.model_dump() for v in self.resources.values()],
            "allocations": [v.model_dump() for v in self.allocations.values()],
            "recommendations": [v.model_dump() for v in self.recommendations.values()],
            "audit_log": [v.model_dump() for v in self.audit_log],
            "roads": [v.model_dump() for v in self.roads.values()],
            "hazards": [v.model_dump() for v in self.hazards.values()],
            "hospitals": [v.model_dump() for v in self.hospitals.values()],
            "shelters": [v.model_dump() for v in self.shelters.values()],
            "eo_layers": [v.model_dump() for v in self.eo_layers],
        }
        with open(data_path, 'w') as f:
            json.dump(data, f, indent=2)

    def add_audit(self, action: str, entity_type: str, entity_id: str, user: str = "system", details: str = "", prev_state: Optional[str] = None, new_state: Optional[str] = None):
        entry = AuditLogEntry(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user=user,
            details=details,
            previous_state=prev_state,
            new_state=new_state
        )
        self.audit_log.append(entry)

db = DataStore()
