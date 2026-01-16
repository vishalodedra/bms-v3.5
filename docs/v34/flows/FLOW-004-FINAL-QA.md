# FLOW-004 — Final QA & Registry (S8/S9)

## Purpose
The Final QA flow manages the end-of-line (EOL) validation for fully assembled battery packs. It serves as the definitive quality gate before a physical asset is bound to its unique digital identity (Battery ID) in the System of Record. This flow ensures compliance with AIS-156 standards and prevents faulty units from reaching the warehouse or field.

## Roles
- **QA**: Responsible for performing the technical inspection against the EOL checklist and submitting findings.
- **Supervisor**: Authorization authority who reviews QA findings and makes the final disposition decision (Approve/Reject/Rework).
- **System**: Automated role that handles digital twin binding and Battery ID generation upon approval.

## State Machine
The flow follows a disposition-based model:

- **Pending**: Unit is undergoing inspection or awaiting supervisor decision.
- **Approved**: Unit has passed all checks and is bound to the registry.
- **Rejected**: Unit has failed critical checks and is scrapped/quarantined.
- **ReworkRequested**: Unit requires specific corrections at the assembly station before re-entry.

### Transitions
- **Pending -> Approved**: Supervisor approves the lot; System generates Battery ID.
- **Pending -> Rejected**: Supervisor rejects the lot; unit is locked from registry.
- **Pending -> ReworkRequested**: Supervisor flags for correction; QA re-inspects after rework.

## UI Wizard Steps
- **PACK INFO step**: Identification of the serialized pack (from S7/S8 queue). Action: Next (Initializes API Instance).
- **CHECKLIST step**: Interactive verification of EOL criteria (Voltage, Seal, Firmware, Safety, Visual). Actions: Pass/Fail/NA on each item.
- **DECISION step**: disposition panel (Supervisor only). Actions: Approve, Reject, Rework.
- **COMPLETION step**: Success/Fail summary. For approved units, displays the newly generated **Battery ID** bound to the Pack ID.

## RBAC Matrix (role × action)

| Action | QA | Supervisor | System | Allowed States |
|---|:---:|:---:|:---:|---|
| **CREATE_DRAFT** | ✅ | ❌ | ❌ | Pending |
| **EDIT_CHECKLIST** | ✅ | ❌ | ❌ | Pending |
| **SUBMIT_QA** | ✅ | ❌ | ❌ | Pending |
| **APPROVE** | ❌ | ✅ | ❌ | Pending |
| **REJECT** | ❌ | ✅ | ❌ | Pending |
| **REWORK** | ❌ | ✅ | ❌ | Pending |
| **GENERATE_ID** | ❌ | ❌ | ✅ | Approved |
| **VIEW** | ✅ | ✅ | ✅ | All |

## API Endpoints (Sim In-App Option-B)
*All responses use the standard `ApiResult` envelope.*

### POST /api/flows/final-qa/create
- **Request**: `{ draft: FinalQaDraft }`
- **Response**: `ApiResult<FinalQaFlowInstance>`
- **Notes**: Initializes the flow instance for a specific pack.

### POST /api/flows/final-qa/approve
- **Request**: `{ instanceId, approvedBy }`
- **Response**: `ApiResult<FinalQaFlowInstance>`
- **Notes**: Generates `batteryId` (e.g. `BATT-2026-XXXX`).

### POST /api/flows/final-qa/reject
- **Request**: `{ instanceId, rejectedBy, reason }`
- **Response**: `ApiResult<FinalQaFlowInstance>`

### POST /api/flows/final-qa/rework
- **Request**: `{ instanceId, requestedBy, notes }`
- **Response**: `ApiResult<FinalQaFlowInstance>`

### GET /api/flows/final-qa/get?id=...
- **Notes**: Retrieves the digital twin draft and current state.

## Store Behavior
- **In-memory store**: Persistence is ephemeral during the pilot phase.
- **Identity Binding**: The `batteryId` is the definitive "Trace" key, while `packId` remains the "Track" key.

## Compliance (AIS-156)
This flow captures immutable evidence required for regulatory filings. Each approved unit in the registry includes a timestamped log of the Supervisor's approval and the QA's checklist results.