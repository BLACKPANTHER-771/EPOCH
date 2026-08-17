from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timezone

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

class IncidentStatus(str, Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    DUPLICATE = "DUPLICATE"
    CANCELLED = "CANCELLED"
    PRIORITIZED = "PRIORITIZED"
    ALLOCATED = "ALLOCATED"
    DISPATCHED = "DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class Severity(int, Enum):
    LOW = 1
    MODERATE = 2
    HIGH = 3
    SEVERE = 4
    CRITICAL = 5

class IncidentType(str, Enum):
    EARTHQUAKE_DAMAGE = "EARTHQUAKE_DAMAGE"
    FIRE = "FIRE"
    FLOOD = "FLOOD"
    MEDICAL_EMERGENCY = "MEDICAL_EMERGENCY"
    STRUCTURAL_COLLAPSE = "STRUCTURAL_COLLAPSE"
    HAZMAT_SPILL = "HAZMAT_SPILL"
    TRAPPED_PERSONS = "TRAPPED_PERSONS"
    UTILITY_FAILURE = "UTILITY_FAILURE"
    EVACUATION = "EVACUATION"

class ResourceType(str, Enum):
    AMBULANCE = "AMBULANCE"
    RESCUE_TEAM = "RESCUE_TEAM"
    MEDICAL_UNIT = "MEDICAL_UNIT"
    HAZMAT = "HAZMAT"
    FIRE_TRUCK = "FIRE_TRUCK"
    HELICOPTER = "HELICOPTER"
    BOAT = "BOAT"
    SUPPLY_TRUCK = "SUPPLY_TRUCK"

class ResourceStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    DISPATCHED = "DISPATCHED"
    ON_ROUTE = "ON_ROUTE"
    ARRIVED = "ARRIVED"
    BUSY = "BUSY"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"
    UNKNOWN = "UNKNOWN"

class RoadState(str, Enum):
    OPEN = "OPEN"
    DEGRADED = "DEGRADED"
    BLOCKED = "BLOCKED"

class RecommendationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"

class AllocationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Incident(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    description: str
    type: IncidentType
    severity: int
    status: IncidentStatus = IncidentStatus.NEW
    latitude: float
    longitude: float
    population_impact: float = 0.5
    vulnerability_score: float = 0.5
    accessibility_risk: float = 0.5
    priority_score: float = 0.0
    reported_at: str = Field(default_factory=get_iso_now)
    updated_at: str = Field(default_factory=get_iso_now)
    verified_by: Optional[str] = None
    verification_notes: Optional[str] = None
    is_duplicate_of: Optional[str] = None
    ai_classification: Optional[Dict[str, Any]] = None

class Resource(BaseModel):
    id: str
    name: str
    type: ResourceType
    status: ResourceStatus = ResourceStatus.AVAILABLE
    latitude: float
    longitude: float
    capacity: int = 1
    capability_tags: List[str] = []
    current_assignment: Optional[str] = None
    speed_kmh: float = 60.0
    base_latitude: float
    base_longitude: float

class Allocation(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    incident_id: str
    resource_id: str
    status: AllocationStatus = AllocationStatus.ACTIVE
    eta_minutes: float
    distance_km: float
    route_description: str = ""
    created_at: str = Field(default_factory=get_iso_now)
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None

class Recommendation(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    incident_id: str
    resource_id: str
    priority_score: float
    confidence: float
    reasons: List[str]
    alternatives: List[Dict[str, Any]]
    eta_minutes: float
    road_state_summary: str
    optimization_run_id: str
    status: RecommendationStatus = RecommendationStatus.PENDING
    created_at: str = Field(default_factory=get_iso_now)

class AuditLogEntry(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    timestamp: str = Field(default_factory=get_iso_now)
    action: str
    entity_type: str
    entity_id: str
    user: str = "system"
    details: str = ""
    previous_state: Optional[str] = None
    new_state: Optional[str] = None

class Road(BaseModel):
    id: str
    name: str
    state: RoadState = RoadState.OPEN
    speed_factor: float = 1.0
    geometry: List[List[float]]

class Hazard(BaseModel):
    id: str
    type: str
    severity: int
    description: str
    detected_at: str = Field(default_factory=get_iso_now)
    geometry: List[List[List[float]]]

class EOLayer(BaseModel):
    id: str
    name: str
    type: str
    source: str = "mock"
    acquired_at: str = Field(default_factory=get_iso_now)
    geometry: Dict[str, Any]

class Hospital(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int = 0
    specialties: List[str] = []

class Shelter(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int = 0
    amenities: List[str] = []

class IncidentCreate(BaseModel):
    title: str
    description: str = ""
    type: IncidentType
    severity: int
    latitude: float
    longitude: float
    population_impact: float = 0.5
    vulnerability_score: float = 0.5
    accessibility_risk: float = 0.5

class VerifyRequest(BaseModel):
    status: IncidentStatus
    notes: str = ""
    verified_by: str = "operator"
    duplicate_of: Optional[str] = None

class ApproveRequest(BaseModel):
    approved_by: str = "operator"

class RejectRequest(BaseModel):
    reason: str = ""
    rejected_by: str = "operator"
