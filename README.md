# EPOCH
### AI-Driven Dynamic Disaster Resource Allocation & Prioritization

**EPOCH** is a disaster-response decision-support platform designed to help emergency coordinators prioritize incidents and dynamically allocate limited resources as disaster conditions evolve.

During large-scale disasters, multiple emergencies compete for limited resources. Static allocation methods can become ineffective when a new critical incident emerges, a resource becomes unavailable, or accessibility conditions change. EPOCH addresses this challenge by combining incident prioritization, resource matching, geographical visualization, and dynamic reallocation in one operational workflow.

The goal is to support faster, more informed resource-allocation decisions through a unified disaster-management interface.

---

## The Problem

Disaster-response teams often face three interconnected challenges:

- **Limited resources:** Multiple incidents compete for available rescue teams, emergency supplies, and response units.
- **Changing priorities:** An incident's severity and impact can change as the situation develops.
- **Accessibility constraints:** Distance alone cannot determine the best resource when roads become inaccessible or routes are disrupted.

A one-time allocation may become outdated as soon as conditions change. Emergency coordinators need a system that can reassess priorities and recommend updated allocations.

## Our Solution

EPOCH introduces a dynamic approach to disaster resource management.

Instead of treating resource allocation as a one-time decision, the system follows a continuous cycle:

**Incident Detection → Priority Assessment → Resource Matching → Accessibility Evaluation → Allocation → Monitoring → Dynamic Reallocation**

When a new critical incident occurs or an existing condition changes, EPOCH can reassess the situation and generate an updated allocation recommendation.

The platform is designed to support human decision-makers rather than replace emergency authorities.

## Key Features

### 1. Dynamic Incident Prioritization
Evaluates incidents using factors such as severity, population impact, vulnerability, and accessibility risk to help determine which situations require greater attention.

### 2. Resource Matching
Considers incident priority alongside resource capability, availability, distance, and accessibility constraints when recommending allocations.

### 3. Dynamic Resource Reallocation
Reassesses allocation recommendations when new incidents arise or resource availability and accessibility conditions change.

### 4. Geographical Visualization
Uses an interactive map to represent incident locations, resource positions, and allocation information, helping coordinators understand the spatial context of emergencies.

### 5. Disaster Scenario Simulation
Supports the demonstration of changing conditions, such as a new critical incident, an unavailable resource, a blocked route, or an increase in incident severity.

### 6. Unified Command-Centre Dashboard
Brings incident information, priority levels, resource availability, and allocation recommendations into a single operational view.

## Incident Prioritization Model

EPOCH's initial priority-scoring model combines four factors:

```text
Priority Score =
    0.35 × Severity
  + 0.25 × Population Impact
  + 0.20 × Vulnerability
  + 0.20 × Accessibility Risk
```

The inputs must be normalized to comparable scales before calculating the combined score.

These weights represent the initial prototype's design assumptions. They would require validation and calibration with disaster-management experts and reliable operational data before real-world deployment.

## How Dynamic Reallocation Works

Consider a disaster scenario involving several incidents and a limited number of available resources.

1. The system receives incident and resource information.
2. Incidents are evaluated and prioritized.
3. Suitable resources are matched to incidents based on priority, capability, availability, and accessibility.
4. Allocation recommendations are displayed through the dashboard and geographical view.
5. A new critical incident is introduced, or an existing resource or accessibility condition changes.
6. The system reassesses priorities and generates revised allocation recommendations.
7. Coordinators review the updated allocation and make operational decisions.

**Core demonstration:** Initial allocation → New critical incident → Reassessment → Updated allocation.

This illustrates why disaster-resource management requires continuous reassessment rather than relying exclusively on static assignments.

## System Architecture

EPOCH is organized around five principal components:

| Component | Responsibility |
|---|---|
| Frontend Dashboard | Presents incidents, priorities, resources, alerts, and allocation results. |
| Backend API | Handles application requests and coordinates data flow between system components. |
| Prioritization and Allocation Engine | Evaluates incident priorities and resource-matching constraints. |
| Mapping and Simulation Layer | Visualizes locations and represents geographical or accessibility changes. |
| Dynamic Reallocation Workflow | Triggers reassessment and updates allocation recommendations when relevant conditions change. |

### High-Level Data Flow

```text
Incident & Resource Data
          |
          v
   Backend API
          |
          v
Priority Assessment
          |
          v
 Resource Matching
          |
          v
Accessibility Evaluation
          |
          v
Allocation Recommendation
          |
          v
 Dashboard & Map
          |
          v
Changing Conditions Detected
          |
          v
Dynamic Reallocation
          |
          └────────> Updated Recommendation
```

## Technology Stack

The project architecture uses the following technologies:

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Python, FastAPI |
| Decision Logic | Python |
| Interactive Mapping | Leaflet |
| Map Data | OpenStreetMap-based mapping |
| Development Data | Sample and simulated scenario data, where applicable |

The exact stack and implementation status should be verified against the current repository before publication.

## Repository Structure

The project is organized around the following intended structure:

```text
EPOCH/
├── frontend/        # Dashboard and user interface
├── backend/         # API and application services
├── ai-engine/      # Prioritization and allocation logic
├── map-simulation/  # Mapping and scenario simulation
├── docs/            # Technical documentation
├── dataset/         # Sample or simulation datasets
└── README.md
```

The actual repository structure may differ. Update this section to reflect the folders and files present in the project.

## Potential Use Cases

- Coordinating resources across multiple disaster incidents.
- Identifying high-priority emergencies.
- Evaluating resource suitability and availability.
- Understanding geographical constraints affecting response decisions.
- Reassessing allocation recommendations when disaster conditions change.
- Supporting situational awareness in emergency command centres.

## Responsible Use and Limitations

EPOCH is a decision-support prototype, not a certified emergency-dispatch system.

The reliability of its recommendations depends on the quality, accuracy, and freshness of the information supplied to it.

Important considerations include:

- Verification of incoming incident reports.
- Accurate resource-availability information.
- Reliable route and accessibility data.
- Validation of prioritization weights and allocation logic.
- Human oversight of operational decisions.
- Testing against realistic scenarios and appropriate baseline methods.
- Integration with authorized emergency-service systems before any real-world deployment.

Simulated scenarios and prototype outputs must not be interpreted as verified improvements in emergency response times or survival outcomes.

## Future Scope

Potential improvements include:

- Integration with verified real-time disaster and emergency feeds.
- More reliable route planning and road-accessibility information.
- Improved resource-allocation optimization.
- Calibration using historical disaster-response data.
- Performance evaluation against baseline allocation strategies.
- Decision audit trails and more detailed operational reporting.
- Integration with authorized disaster-management infrastructure.

These are potential extensions and should not be presented as existing capabilities unless implemented.

## Intended Users

- Disaster-management authorities
- Emergency command centres
- Field-response coordinators
- Emergency resource and logistics managers

## Project Objective

EPOCH aims to make disaster-resource allocation more adaptive by connecting incident prioritization, resource matching, geographical context, and dynamic reassessment within a unified decision-support workflow.

**The central idea is simple: when disaster conditions change, resource-allocation recommendations should be able to change with them.**

---

*EPOCH is a disaster-management technology project. Its recommendations are intended to support, not replace, decisions made by qualified emergency-response personnel.*
