# FLOW-002 — Batch / Work Order Creation (S4)

## Purpose
The Batch flow manages the transformation of production demand into actionable Work Orders. It ensures that every manufacturing run is properly planned against an approved SKU (S1), authorized by leadership, and tracked during execution.

## Roles
- **Planner**: Responsible for defining batch parameters, selecting the target SKU, and setting planned quantities.
- **Supervisor**: Authorization authority who verifies line readiness and releases the batch for execution.
- **Operator**: Operational role responsible for monitoring the run and flagging completion.

## State Machine
The flow follows a linear lifecycle with safety gates:

- **Draft**: Initial definition phase by the Planner.
- **Approved**: Planned batch has been verified and released by the Supervisor.
- **InProgress**: The batch is currently being executed on the production line.
- **Completed**: Production targets met; batch is closed and inventory updated.
- **Cancelled**: Batch aborted before completion due to material shortage or line failure.

### Transitions
- **Draft -> Approved**: Supervisor authorizes the start of the batch.
- **Approved -> InProgress**: Automated or manual trigger when the first unit is processed.
- **InProgress -> Completed**: Manual closure by operator or supervisor upon reaching target.
- **Any -> Cancelled**: Immediate stop of the flow for exceptions.

## UI Wizard Steps
- **DRAFT step**: Input fields for Batch Name, SKU selection (from S1 registry), and Planned Quantity. Actions: Reset, Submit Plan.
- **APPROVAL step**: Summary view for Supervisor oversight. Action: Authorize Start.
- **EXECUTION step**: Real-time monitoring dashboard showing live output vs target, yield, and uptime. Actions: Mark Batch Complete.
- **COMPLETION step**: Success state showing closure summary and inventory handoff message. Action: Start New Batch.

## RBAC Matrix (role × action)

| Action | Planner | Supervisor | Operator | Allowed States |
|---|:---:|:---:|:---:|---|
| **CREATE_DRAFT** | ✅ | ❌ | ❌ | Draft |
| **AUTHORIZE** | ❌ | ✅ | ❌ | Approved |
| **START_RUN** | ❌ | ✅ | ✅ | Approved |
| **COMPLETE** | ❌ | ✅ | ✅ | InProgress |
| **CANCEL** | ✅ | ✅ | ✅ | All except Completed |
| **VIEW** | ✅ | ✅ | ✅ | All |

## API Endpoints (Sim In-App Option-B)
*All responses use the standard `ApiResult` envelope.*

### POST /api/flows/batch/create
- **Request**: `CreateBatchReq { draft: BatchDraft }`
- **Response**: `ApiResult<BatchFlowInstance>`

### POST /api/flows/batch/approve
- **Request**: `ApproveBatchReq { instanceId, approvedBy }`
- **Response**: `ApiResult<BatchFlowInstance>`

### POST /api/flows/batch/start
- **Request**: `StartBatchReq { instanceId }`
- **Response**: `ApiResult<BatchFlowInstance>`

### POST /api/flows/batch/complete
- **Request**: `CompleteBatchReq { instanceId }`
- **Response**: `ApiResult<BatchFlowInstance>`

### POST /api/flows/batch/cancel
- **Request**: `CancelBatchReq { instanceId, reason }`
- **Response**: `ApiResult<BatchFlowInstance>`

### GET /api/flows/batch/get?id=...
- **Notes**: Fetches specific batch instance by ID.

### GET /api/flows/batch/list
- **Notes**: Lists all Batch flow instances in the store.

## Store Behavior
- **In-memory store**: All batch data is cleared on browser refresh during pilot.
- **Identity**: Instances prefixed with `BAT-` followed by hex string.

## Backend Integration Notes
- **SKU Validation**: Backend must verify that the `skuCode` provided in the draft exists in the `FLOW-001` registry before allowing batch creation.
- **Inventory Locking**: Upon entering `Approved` state, the backend should ideally flag required raw material inventory in S3 as "Reserved".
- **Telemetry**: In production, the `InProgress` state should be updated by live PLC/IOT feeds rather than manual wizard button clicks.