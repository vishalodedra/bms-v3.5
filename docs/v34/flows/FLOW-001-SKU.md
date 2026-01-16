# FLOW-001 — SKU Creation & Blueprint Approval (S1)

## Purpose
The SKU flow manages the formal definition and engineering approval of Battery Pack Stock Keeping Units (SKUs). An "Active SKU" in BPM-OS represents a validated engineering blueprint that is released for production planning (S4) and material procurement (S2). This ensures that no battery pack is manufactured without a signed-off technical specification.

## Roles
- **Maker**: Responsible for entering technical specifications and drafting the SKU profile.
- **Checker**: Technical reviewer who verifies engineering alignment and standards.
- **Approver**: Final authority (Management/Engineering Lead) who authorizes the SKU for active use.

*Note: The role switcher in the UI wizard is for demo/testing purposes; production implementations will bind actions to authenticated session RBAC.*

## State Machine
The flow follows a strict state transition model:

- **Draft**: Initial creation phase where Maker defines parameters.
- **Review**: Technical verification phase.
- **Approved**: Technical verification complete, awaiting final management activation.
- **Active**: SKU is released for manufacturing.
- **Rejected**: Flow stopped due to non-compliance or error.

### Transitions
- **Draft -> Review**: Maker submits draft for review.
- **Review -> Draft**: Checker sends back for corrections.
- **Review -> Approved**: Checker forwards to approval.
- **Approved -> Active**: Approver activates the SKU.
- **Review -> Active**: Approver "fast-tracks" the SKU (allowed in pilot mode).
- **Approved/Review -> Rejected**: Approver rejects the definition.
- **Rejected -> Draft**: Maker edits and resubmits.

## UI Wizard Steps (current V3.4 implementation)
- **DRAFT step**: Input technical fields (SKU Code, Name, Chemistry, Form Factor). Actions: Save Draft (creates ID), Submit for Review.
- **REVIEW step**: Read-only summary of the draft. Actions: Send Back, Forward. Includes reviewer comment field.
- **APPROVE step**: Read-only summary + Checker comments. Actions: Approve to Active, Reject. Includes rejection reason field.
- **PUBLISH step**: Success state showing the Active summary. Action: Start New SKU (resets wizard).

## RBAC Matrix (role × action)

| Action | Maker | Checker | Approver | Allowed States |
|---|:---:|:---:|:---:|---|
| **CREATE** | ✅ | ❌ | ❌ | Draft |
| **EDIT_DRAFT** | ✅ | ❌ | ❌ | Draft, Rejected |
| **SUBMIT_FOR_REVIEW** | ✅ | ❌ | ❌ | Draft, Rejected |
| **REVIEW_SEND_BACK** | ❌ | ✅ | ❌ | Review |
| **REVIEW_FORWARD** | ❌ | ✅ | ❌ | Review |
| **APPROVE_TO_ACTIVE** | ❌ | ❌ | ✅ | Review, Approved |
| **REJECT** | ❌ | ❌ | ✅ | Review, Approved |
| **VIEW** | ✅ | ✅ | ✅ | All |

## API Endpoints (Sim In-App Option-B)
*Note: All responses use the standard `ApiResult` envelope.*

### POST /api/flows/sku/create
- **Request**: `CreateSkuFlowReq { draft: SkuDraft }`
- **Response**: `CreateSkuFlowRes { ok: true, data: SkuFlowInstance }`
- **Notes**: Creates a new instance in the in-memory store with a generated `instanceId`.

### POST /api/flows/sku/submit
- **Request**: `SubmitSkuForReviewReq { instanceId: string }`
- **Response**: `SubmitSkuForReviewRes`
- **Notes**: Moves state to `Review`.

### POST /api/flows/sku/review
- **Request**: `ReviewSkuReq { instanceId, decision: "SEND_BACK" | "FORWARD", comment? }`
- **Response**: `ReviewSkuRes`
- **Notes**: Moves state to `Draft` or `Approved`.

### POST /api/flows/sku/approve
- **Request**: `ApproveSkuReq { instanceId, decision: "APPROVE" | "REJECT", reason? }`
- **Response**: `ApproveSkuRes`
- **Notes**: Moves state to `Active` or `Rejected`.

### GET /api/flows/sku/get?id=...
- **Response**: `ApiResult<SkuFlowInstance>`
- **Notes**: Fetches specific instance by ID.

### GET /api/flows/sku/list
- **Response**: `ApiResult<SkuFlowInstance[]>`
- **Notes**: Lists all SKU flow instances in the store.

## Store Behavior
- **In-memory store**: All data resets on page reload (by design for Pilot phase).
- **InstanceId format**: Simulated prefix `SKU-` followed by an 8-character hex string.

## Backend Handover Notes
- **Communication**: UI uses `apiFetch("/api/...")` and strictly expects the `ApiResult` envelope (`{ ok: boolean, data?: T, error?: { code, message } }`).
- **Endpoint Stability**: Backend should preserve the exact endpoint paths to avoid frontend changes.
- **Persistence Strategy**: Suggested backend storage includes a `sku_flow_instances` table for state tracking and a `sku_drafts` table for technical parameters, linked via `instance_id`. Audit trails should capture timestamps for each transition (submitted_at, reviewed_at, etc.).