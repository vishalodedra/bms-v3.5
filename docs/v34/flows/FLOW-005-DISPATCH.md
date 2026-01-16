# FLOW-005 — Dispatch & Custody Handover (S11)

## Purpose
The Dispatch flow manages the legal and physical transition of finished battery packs from the factory warehouse to the customer. This flow ensures that all commercial documents (Invoices) are tied to physical assets, transporters are verified, and a secure custody handover occurs via OTP/Authentication. It serves as the bridge between internal manufacturing and external logistics.

## Roles
- **SCM**: Responsible for initial consignment drafting and selecting inventory items.
- **Finance**: Authorization authority who generates and verifies commercial invoices.
- **Logistics**: Operational role responsible for physical loading, transporter assignment, and recording delivery.

## State Machine
The flow follows a linear custody lifecycle:

- **Draft**: Initial consignment definition by SCM.
- **Approved**: Finance has authorized the commercial terms and generated an invoice.
- **Dispatched**: Material has physically left the dock and is with the transporter.
- **Delivered**: Customer has acknowledged receipt; custody transferred.
- **Closed**: Post-delivery archival complete.
- **Cancelled**: Consignment voided before delivery.

### Transitions
- **Draft -> Approved**: Finance approves the draft.
- **Approved -> Dispatched**: Logistics records vehicle details and confirms departure.
- **Dispatched -> Delivered**: Customer provides verification code to Logistics.
- **Delivered -> Closed**: System/Supervisor archives the flow.

## UI Wizard Steps
- **CONSIGNMENT DRAFT step**: SCM inputs customer details, destination, and selects items.
- **APPROVAL step**: Finance reviews summary and enters Invoice Number.
- **EXECUTION step**: Logistics enters Transporter/Vehicle details. Triggers Gate Pass.
- **DELIVERY step**: Logistics records handover proof (OTP Verification).
- **COMPLETION step**: Final summary of custody chain transfer.

## RBAC Matrix (role × action)

| Action | SCM | Finance | Logistics | Allowed States |
|---|:---:|:---:|:---:|---|
| **CREATE_DRAFT** | ✅ | ❌ | ❌ | Draft |
| **APPROVE_DISPATCH** | ❌ | ✅ | ❌ | Draft |
| **EXECUTE_DISPATCH** | ❌ | ❌ | ✅ | Approved |
| **RECORD_DELIVERY** | ❌ | ❌ | ✅ | Dispatched |
| **CLOSE_FLOW** | ✅ | ✅ | ✅ | Delivered |
| **VIEW** | ✅ | ✅ | ✅ | All |

## API Endpoints (Sim In-App Option-B)
*All responses use the standard `ApiResult` envelope.*

### POST /api/flows/dispatch/create
- **Request**: `{ draft: DispatchDraft }`
- **Response**: `ApiResult<DispatchFlowInstance>`

### POST /api/flows/dispatch/approve
- **Request**: `{ instanceId, approvedBy, invoiceNumber }`
- **Response**: `ApiResult<DispatchFlowInstance>`

### POST /api/flows/dispatch/dispatch
- **Request**: `{ instanceId, dispatchedBy, transporter, vehicleNo, driverName }`
- **Response**: `ApiResult<DispatchFlowInstance>`

### POST /api/flows/dispatch/deliver
- **Request**: `{ instanceId, handoverProof, deliveredAt }`
- **Response**: `ApiResult<DispatchFlowInstance>`

### POST /api/flows/dispatch/close
- **Request**: `{ instanceId, closedBy }`
- **Response**: `ApiResult<DispatchFlowInstance>`

### GET /api/flows/dispatch/get?id=...
- **Notes**: Retrieves the specific consignment status and item list.

## Store Behavior
- **In-memory store**: Persistence is ephemeral during pilot.
- **Trace Impact**: Successful delivery updates the "Custodian" field in the S9 Battery Registry for all items in the consignment.

## Legal & Compliance
This flow is the definitive record of "Transfer of Title". The timestamped delivery event marks the shift in safety and warranty liability from the manufacturer to the customer.