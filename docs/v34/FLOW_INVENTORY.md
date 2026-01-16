# V3.4 Flow Inventory (MES Pilot)

V3.4 converts “stage simulations” into “flow-level MES behavior” using Option-B in-app simulated API.

## Option-B (In-app Simulated API) — Definition
- UI calls fetch("/api/...")
- Responses are served by in-app handlers (dev-time simulation)
- Backend team later replaces the /api handlers with real services, while UI stays stable

## Infrastructure Status
| Component | Status | Notes |
|:---|:---|:---|
| Fetch Interceptor | **WIRED** | window.fetch patched in apiHarness.ts |
| Flow Logic Router | **WIRED** | flowHandlers.ts manages routing |
| Local Storage DB | **WIRED** | Simple persistence for pilot flow instances |

## Flow List

| Flow ID | SOP Stage | Screen/Area | Primary Roles | State Model | API Endpoints (planned) | Status |
|---|---|---|---|---|---|---|
| FLOW-001 | S1 | SKU Creation & Blueprint Approval | Engineering, Supervisor | Draft → Review → Approved → Active | /api/flows/sku/* | **WIRED** |
| FLOW-002 | S4 | Batch / Work Order Creation | Planner, Supervisor | Draft → Approved → InProgress → Closed | /api/flows/batch/* | **WIRED** |
| FLOW-003 | S3 | Inbound Receipt + Serialization + QC | Stores, QA, Supervisor | Received → QCPending → Released/Blocked/Scrapped | /api/flows/inbound/* | **WIRED** |
| FLOW-004 | S8/S9 | Final Pack QA → Trigger Battery ID (system) | QA, Supervisor (S8) + System (S9) | Pending → Approved/Rejected | /api/flows/final-qa/* | **WIRED** |
| FLOW-005 | S11 | Dispatch Authorization → Execution → Custody Transfer | SCM, Finance, Logistics | Draft → Approved → Dispatched → Delivered → Closed | /api/flows/dispatch/* | **WIRED** |

## Infrastructure Status (Detail)
- Router: **WIRED**
- apiFetch Adapter: **WIRED**
- In-memory store: **WIRED** (reset on reload)
- /api/health: **WIRED**
- /api/flows/registry: **WIRED**
- /api/flows/{sku,batch,inbound,final-qa,dispatch}: **WIRED** (static skeleton)

## Guardrails
- One flow change per patch
- No screen-wide refactors
- Compliance module remains read-only
- If a flow is not wired, show explicit “PLANNED” status in that flow area; do not crash

## Flow Status Notes
- **FLOW-001**: Fully implemented in UI wizard + in-app API + in-memory store. End-to-end documentation available in `docs/v34/flows/FLOW-001-SKU.md`.
- **FLOW-002**: Fully implemented in UI wizard + in-app API + in-memory store. Documentation available in `docs/v34/flows/FLOW-002-BATCH.md`.
- **FLOW-003**: Fully implemented in UI wizard + in-app API + in-memory store. Documentation available in `docs/v34/flows/FLOW-003-INBOUND.md`.
- **FLOW-004**: Fully implemented in UI wizard + in-app API + in-memory store. Documentation available in `docs/v34/flows/FLOW-004-FINAL-QA.md`.
- **FLOW-005**: Fully implemented in UI wizard + in-app API + in-memory store. Documentation available in `docs/v34/flows/FLOW-005-DISPATCH.md`.