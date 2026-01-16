# BPM-OS V3.1-EXT — BACKEND HANDOVER CONTRACT

**Patch ID:** EXT-HO-090 (Validated EXT-HO-094)
**Status:** FROZEN (EXT-HO-095)
**Date:** 2026-01-15 22:00 (IST)
**Context:** V3.1-EXT (Operations, Control & Dashboards)

---

## 1. PREAMBLE & SCOPE
This document serves as the authoritative interface contract between the **Frontend Vibe-Code** and the **Backend Implementation**.
The UI has been "Vibe Coded" to a stable state (EXT-FP-065). The Backend team must implement APIs that satisfy these data shapes and semantics without altering the frontend behavior.

### Guiding Principles
1.  **Frontend-First Truth:** The UI structure determines the API payload structure. Do not "optimize" payloads in ways that require frontend refactoring.
2.  **Semantic Fidelity:** Statuses like 'Blocked', 'Open', 'Hold' must be treated as enum contracts.
3.  **No Business Logic in UI:** Calculations (OEE, Yield, Risk Scores) must be performed by the backend.

---

## 2. ENTITY GLOSSARY (INTENT)

| Entity | Definition |
|:---|:---|
| **Runbook** | A predefined operational workflow (e.g., "Manufacturing", "Dispatch") composed of sequential Stages. |
| **Stage** | A distinct phase in a runbook (e.g., S5 Module Assembly). Contains Gates and Steps. |
| **Gate** | A validation checkpoint (interlock) that must be cleared to proceed. |
| **Exception** | A system event (blocker, deviation) that halts flow or flags risk. |
| **Line** | A physical production line (e.g., "Line A") containing Stations. |
| **Station** | A discrete physical workspace where tasks occur. |
| **Metric** | An aggregated KPI (e.g., Yield, Throughput) computed over a time window. |
| **LogEvent** | An immutable audit record of a system or user action. |

---

## 3. ENDPOINT INDEX

### GROUP I: DASHBOARDS
*Powering the Role-Specific Dashboards (Operator, Supervisor, Plant Head, Admin, Auditor)*

- **GET /dashboard/summary**
    - Returns aggregated KPIs (Planned, Built, Yield, Hold).
- **GET /dashboard/trends**
    - Returns time-series data for sparklines and trend charts.
- **GET /dashboard/distributions**
    - Returns breakdown data (Stage Mix, Custody Mix).
- **GET /dashboard/{role}/summary**
    - Returns role-specific KPI cards (e.g., Operator Shift Info, Auditor Compliance Score).
- **GET /dashboard/{role}/attention**
    - Returns list of items requiring immediate user action (Blocks, Approvals).

### GROUP II: CONTROL TOWER & RUNBOOKS
*Powering ControlTower.tsx and RunbookDetail.tsx*

- **GET /control-tower/runbooks**
    - Returns high-level status of all active runbooks (Health, Stage, Progress).
- **GET /runbooks/{runbookId}**
    - Returns full details, including current custody and warranty context.
- **GET /runbooks/{runbookId}/stages**
    - Returns ordered list of stages with their status and gate states.
- **GET /runbooks/{runbookId}/exceptions**
    - Returns active exceptions linked to this runbook.

### GROUP III: LIVE STATUS
*Powering LiveStatus.tsx*

- **GET /live-status/summary**
    - Returns system-wide health metrics (Health %, Active Lines).
- **GET /live-status/operations**
    - Returns snapshot of running operations vs blocked operations.
- **GET /live-status/lines**
    - Returns real-time status of all physical lines and stations.

### GROUP IV: INVENTORY
*Powering SystemInventory.tsx*

- **GET /inventory/categories**
    - Returns summary counts for Cells, Modules, Packs, FG, etc.
- **GET /inventory/items**
    - *Query Params:* `category`, `search`, `status`
    - Returns paginated list of inventory items.

### GROUP V: PRODUCTION LINES
*Powering ProductionLine.tsx*

- **GET /lines**
    - Returns list of lines with summary health status.
- **GET /lines/{lineId}**
    - Returns detailed line state, including runbook association.
- **GET /lines/{lineId}/stations**
    - Returns status of individual stations (Ready/Running/Blocked/Idle).
- **GET /lines/{lineId}/oee**
    - Returns backend-computed Availability, Performance, and Quality scores.

### GROUP VI: EXCEPTIONS
*Powering ExceptionsView.tsx*

- **GET /exceptions**
    - Returns global exception list.
- **GET /exceptions/{id}**
    - Returns detailed resolution context and escalation path.

### GROUP VII: LOGS
*Powering SystemLogs.tsx*

- **GET /logs**
    - *Query Params:* `category`, `severity`, `from`, `to`, `search`
    - Returns immutable event stream.

### GROUP VIII: REPORTS
*Powering SystemReports.tsx*

- **GET /reports**
    - Returns registry of available report templates.
- **GET /reports/{reportId}/preview**
    - Returns mock/sample data for the report preview panel.

---

## 4. PAYLOAD SHAPES (EXAMPLES)

### A. Runbook Summary
```json
{
  "id": "manufacturing",
  "title": "Manufacturing Execution",
  "status": "Blocked", // Enum: Healthy, Degraded, Blocked, Idle, Running
  "currentStage": "S5 Module Assembly",
  "blockReason": "Gate Interlock: Seal Check Failed",
  "roles": ["Planner", "Operator"],
  "lastUpdate": "2026-01-15T10:30:00Z"
}
```

### B. Stage Detail
```json
{
  "id": "mfg-02",
  "name": "Module Assembly (S5)",
  "status": "Hold", // Enum: Pending, In Progress, Hold, Completed
  "gate": {
    "status": "Locked", // Enum: Open, Closed, Locked
    "type": "Validation",
    "condition": "Seal Integrity Check"
  },
  "exception": {
    "id": "EX-001",
    "type": "Quality Failure",
    "severity": "Critical" // Enum: Critical, High, Medium, Low
  }
}
```

### C. Line Status
```json
{
  "id": "line-a",
  "name": "Line A (Modules)",
  "mode": "Running", // Enum: Running, Idle, Blocked, Maintenance
  "health": "OK",
  "stations": [
    { "id": "st-01", "name": "Cell Load", "state": "Running" },
    { "id": "st-02", "name": "Weld", "state": "Blocked", "reason": "Safety Curtain" }
  ]
}
```

### D. Inventory Item
```json
{
  "id": "CELL-2026-1001",
  "sku": "CELL-LFP-21700",
  "location": "Zone A - Rack 2",
  "status": "Good", // Enum: Good, Hold, Blocked
  "batchRef": "BATCH-INB-102",
  "age": "2 days"
}
```

---

## 5. UI MAPPING NOTES

### Track vs Trace Semantics
*   **Track (Operational):** Endpoints under `/dashboard`, `/live-status`, `/lines`, `/inventory` refer to the **current state** and physical location.
*   **Trace (Historical/Identity):** Endpoints under `/registry` (S9), `/reports`, and `/logs` refer to **immutable history** and digital lineage.
*   *Constraint:* Do not mix these contexts. An inventory API should not return the full warranty history payload.

### Backend Computations
*   **OEE:** The frontend displays OEE as a percentage. The backend must ingest machine telemetry, apply the OEE formula, and return the final numbers.
*   **Bottleneck Detection:** The Plant Head dashboard shows "Bottleneck by Stage". The backend must analyze WIP accumulation to determine these values.
*   **Compliance Score:** The Admin/Auditor dashboard shows "Aadhaar Ready %". This is a backend aggregate of how many records satisfy the schema validation.

### Demo / Mock Handling
*   The frontend uses `isDemo` flags.
*   In production, these flags will be false. The backend must return real data conforming to the shapes above.
*   If a backend service is unavailable, it should return a standardized error object or empty state, not a 404/500 that breaks the UI shell.

---
**END OF CONTRACT**
