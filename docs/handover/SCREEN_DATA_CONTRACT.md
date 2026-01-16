# Screen → Data Contract Map

**Patch ID:** V33-DOC-HO-90
**Context:** Defines the binding between UI Screens and Backend Contexts.

This document maps every major screen in BPM-OS V3.3 to its required data structures (Read Models) and the write intents it emits. Backend services must satisfy these contracts to power the frontend.

## 1. Operational Screens (S0 - S17)

| Screen | Route ID | Primary Context (Read) | Key Write Intents (Mutations) |
|:---|:---|:---|:---|
| **System Setup** | `system_setup` | `S0Context` | `EDIT_PLANT_DETAILS`, `MANAGE_LINES`, `UPDATE_REGULATIONS` |
| **SKU & Blueprint** | `sku_blueprint` | `S1Context` | `CREATE_SKU`, `EDIT_BLUEPRINT`, `APPROVE_BLUEPRINT` |
| **Procurement** | `procurement` | `S2Context` | `CREATE_PO`, `SUBMIT_PO`, `APPROVE_PO`, `ISSUE_PO` |
| **Inbound Receipt** | `inbound_receipt` | `S3Context` | `RECORD_RECEIPT`, `START_INSPECTION`, `SERIALIZE` |
| **Batch Planning** | `batch_planning` | `S4Context` | `CREATE_BATCH`, `EDIT_BATCH`, `LOCK_PLAN`, `RELEASE_BATCH` |
| **Module Assembly** | `module_assembly` | `S5Context` | `START_ASSEMBLY`, `PAUSE`, `COMPLETE_MODULE`, `HANDOVER` |
| **Module QA** | `module_qa` | `S6Context` | `START_SESSION`, `LOG_OBSERVATION`, `SUBMIT_PASS/REJECT` |
| **Pack Assembly** | `pack_assembly` | `S7Context` | `START_ASSEMBLY`, `COMPLETE_PACK`, `REPORT_ISSUE` |
| **Pack Review** | `pack_review` | `S8Context` | `START_AGING`, `COMPLETE_SOAK`, `RELEASE_FROM_AGING` |
| **Battery Registry** | `battery_registry` | `S9Context` | `START_FINAL_QA`, `MARK_APPROVE/REJECT`, `RELEASE_PACKING` |
| **BMS Provisioning** | `bms_provisioning` | `S10Context` | `FLASH_FIRMWARE`, `VERIFY_CONFIG`, `BIND_IDENTITY` |
| **Finished Goods** | `finished_goods` | `S11Context` | `PREPARE_DISPATCH`, `HANDOVER_LOGISTICS`, `CONFIRM_DELIVERY` |
| **Packaging** | `packaging_aggregation` | `S12Context` (derived) | *Aggregation Logic (Not yet fully wired in V3.3 Core)* |
| **Dispatch Auth** | `dispatch_authorization` | `S11Context` (subset) | `AUTHORIZE_DISPATCH`, `HOLD_DISPATCH` |
| **Dispatch Exec** | `dispatch_execution` | `S11Context` (subset) | `CONFIRM_LOADING`, `EXECUTE_HANDOVER` |
| **Service & Warranty** | `service_warranty` | `S12Context` | `INITIATE_CLAIM`, `APPROVE/REJECT_CLAIM`, `CLOSE_WARRANTY` |
| **Recycling (Returns)** | `recycling_recovery` | `S13Context` | `OPEN_REQUEST`, `INITIATE_RETURN`, `CONFIRM_RECEIPT` |
| **Refurb/Recycle** | `recycling_recovery` | `S14Context` | `INSPECT_RETURN`, `MARK_REFURB/RECYCLE`, `COMPLETE_JOB` |
| **System Reports** | `system_reports` | `S15Context` | `GENERATE_SNAPSHOT`, `SUBMIT_COMPLIANCE_REPORT` |
| **Audit** | `compliance_audit` | `S16Context` | `START_AUDIT`, `RAISE_FINDING`, `CLOSE_AUDIT` |
| **Closure** | `compliance_audit` | `S17Context` | `PREPARE_ARCHIVE`, `COMPLETE_ARCHIVE`, `CLOSE_PROGRAM` |

## 2. Governance & Visibility Screens

| Screen | Component | Primary Data Model | Description |
|:---|:---|:---|:---|
| **Dashboard** | `Dashboard.tsx` | `SystemHealthRM`, `InventoryRM` | High-level aggregated KPIs. Read-only. |
| **Control Tower** | `ControlTower.tsx` | `RunbookRM[]` | List of all active runbooks and their health status. |
| **Live Status** | `LiveStatus.tsx` | `SystemHealthRM`, Line Telemetry | Real-time "heartbeat" of lines and stations. |
| **Inventory** | `SystemInventory.tsx` | `InventoryRM` | Consolidated view of stock across all lifecycle stages. |
| **Logs** | `SystemLogs.tsx` | `LogEntry[]` | Immutable audit trail of all Write Intents listed above. |

## 3. Data Flow Principals

1.  **Frontend is a Projection:** The UI projects the state of the Contexts. It does not calculate business logic (e.g., it displays "Compliance Score", it does not calculate it).
2.  **Intents are Commands:** When a user clicks a button, the Frontend emits an "Intent" (Action ID). The Backend processes this and updates the Context.
3.  **Optimistic UI:** The V3.3 Demo uses optimistic local state updates to simulate backend processing. Real implementation will replace `setIsSimulating` with API calls.
