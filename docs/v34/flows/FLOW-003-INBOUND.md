# FLOW-003 — Inbound Receipt, Serialization & QC (S3)

## Purpose
The Inbound flow manages the physical arrival and digital registration of raw materials (Cells, BMS units, Enclosures). It acts as the primary quality gate before materials are released into the manufacturing inventory. This flow ensures every component has a unique digital identity (Serialization) and a verified quality status (QC) before use.

## Roles
- **Stores**: Responsible for recording physical arrivals (GRN entry) and generating component serial numbers.
- **QA**: Inspects materials against AIS-156 standards and provides pass/fail/scrap decisions.
- **Supervisor**: Oversight role that can manage dispositions and unblock lots.

## State Machine
The flow follows a linear progression with branching outcomes:

- **Received**: Material has arrived and GRN is recorded.
- **Serialized**: Unique IDs have been generated and printed for the items.
- **QCPending**: Items are undergoing technical inspection/sampling.
- **Released**: QC passed; items are available for Batch Planning (S4).
- **Blocked**: QC failed; items are restricted from production use.
- **Scrapped**: Material is discarded or returned to vendor.

### Transitions
- **Received -> Serialized**: Stores generates serial numbers.
- **Serialized -> QCPending**: Lot is submitted for QA inspection.
- **QCPending -> Released**: QA records a "PASS" decision.
- **QCPending -> Blocked**: QA records a "FAIL" decision.
- **QCPending -> Scrapped**: QA/Supervisor records a "SCRAP" decision.
- **Blocked -> Released**: Supervisor overrides/clears a blocked lot (Authorized release).

## UI Wizard Steps
- **RECEIPT step**: Input GRN Number, Supplier, Material Code, and Quantity. Action: Next (Create API Entry).
- **SERIALIZATION step**: Bulk generation of Unique IDs. Action: Next (Submit for QC).
- **QC step**: Slider interface to record Passed vs. Failed counts. Actions: Release Lot, Block Lot.
- **DISPOSITION step**: Final summary showing the outcome and availability status. Action: Process New Receipt.

## RBAC Matrix (role × action)

| Action | Stores | QA | Supervisor | Allowed States |
|---|:---:|:---:|:---:|---|
| **CREATE_RECEIPT** | ✅ | ❌ | ✅ | Received |
| **SERIALIZE** | ✅ | ❌ | ❌ | Received |
| **SUBMIT_QC** | ✅ | ❌ | ❌ | Serialized |
| **COMPLETE_QC** | ❌ | ✅ | ✅ | QCPending |
| **RELEASE_OVERRIDE** | ❌ | ❌ | ✅ | Blocked |
| **VIEW** | ✅ | ✅ | ✅ | All |

## API Endpoints (Sim In-App Option-B)
*All responses use the standard `ApiResult` envelope.*

### POST /api/flows/inbound/create
- **Request**: `CreateInboundReq { receipt: InboundReceiptDraft }`
- **Response**: `ApiResult<InboundFlowInstance>`

### POST /api/flows/inbound/serialize
- **Request**: `SerializeItemsReq { instanceId, serials: string[] }`
- **Response**: `ApiResult<InboundFlowInstance>`
- **Notes**: In pilot mode, the wizard auto-submits for QC after serialization.

### POST /api/flows/inbound/complete-qc
- **Request**: `CompleteQcReq { instanceId, decision, qcUser, remarks }`
- **Response**: `ApiResult<InboundFlowInstance>`

### GET /api/flows/inbound/get?id=...
- **Notes**: Fetches specific inbound instance by ID.

### GET /api/flows/inbound/list
- **Notes**: Lists all Inbound flow instances in the store.

## Store Behavior
- **In-memory store**: All inbound data is cleared on browser refresh during pilot.
- **Identity**: Instances prefixed with `INB-` followed by hex string.

## Audit & Compliance (QC Traceability)
This flow represents a critical "Trace" handoff. 
1. The **GRN Number** binds the manufacturer's batch to the BPM-OS digital identity.
2. Every **Serial Number** generated is linked to the original GRN and the specific **QC Inspection Report**.
3. Compliance modules (S17) consume these records to prove that only "Released" materials entered the production line.