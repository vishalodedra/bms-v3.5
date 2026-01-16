# RBAC → Screen → Action Matrix

**Patch ID:** V33-DOC-HO-91
**Status:** VALIDATED
**Context:** Derived from actual Frontend Guard Logic (`s*Guards.ts`).

This matrix defines the permission model for BPM-OS V3.3. It reflects the **actual implementation** in the frontend code.
The **System Admin** role implicitly has access to ALL actions (omitted for brevity, assume ✅ for Admin).

## 1. System & Definition (S0 - S1)

| Action | Mgmt | Eng | Comp |
|:---|:---:|:---:|:---:|
| **S0: System Setup** | | | |
| `EDIT_PLANT_DETAILS` | ❌ | ❌ | ❌ |
| `MANAGE_LINES` | ✅ | ❌ | ❌ |
| `UPDATE_REGULATIONS` | ✅ | ❌ | ✅ |
| **S1: SKU Blueprint** | | | |
| `CREATE_SKU` | ❌ | ✅ | ❌ |
| `EDIT_BLUEPRINT` | ❌ | ✅ | ❌ |
| `SUBMIT_FOR_REVIEW` | ❌ | ✅ | ❌ |
| `APPROVE_BLUEPRINT` | ✅ | ❌ | ✅ |
| `PUBLISH_BLUEPRINT` | ✅ | ❌ | ❌ |

## 2. Supply Chain (S2 - S4)

| Action | Mgmt | Proc | Stores | Planner | Sup | QA |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **S2: Procurement** | | | | | | |
| `CREATE_PO` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `SUBMIT_PO` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `APPROVE_PO` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ISSUE_PO` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S3: Inbound** | | | | | | |
| `RECORD_RECEIPT` | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `START_INSPECTION` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `START_SERIALIZATION`| ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **S4: Planning** | | | | | | |
| `CREATE_BATCH` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `LOCK_BATCH` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `RELEASE_BATCH` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 3. Manufacturing Execution (S5 - S8)

| Action | Mgmt | Sup | Ops | QA |
|:---|:---:|:---:|:---:|:---:|
| **S5: Module Assy** | | | | |
| `START_LINE` | ❌ | ✅ | ❌ | ❌ |
| `COMPLETE_UNIT` | ❌ | ❌ | ✅ | ❌ |
| `HANDOVER_QA` | ❌ | ✅ | ❌ | ❌ |
| **S6: Module QA** | | | | |
| `START_INSPECT` | ❌ | ❌ | ❌ | ✅ |
| `SUBMIT_PASS` | ❌ | ❌ | ❌ | ✅ |
| `SUBMIT_REJECT` | ❌ | ✅ | ❌ | ❌ |
| **S7: Pack Assy** | | | | |
| `START_LINE` | ❌ | ✅ | ✅ | ❌ |
| `COMPLETE_PACK` | ❌ | ❌ | ✅ | ❌ |
| `ABORT_SESSION` | ❌ | ✅ | ❌ | ❌ |
| **S8: Pack Review** | | | | |
| `START_AGING` | ❌ | ✅ | ❌ | ✅ |
| `RELEASE` | ✅ | ❌ | ❌ | ✅ |

## 4. Trace & Identity (S9 - S10)

| Action | Mgmt | Eng | Sup | QA | Ops |
|:---|:---:|:---:|:---:|:---:|:---:|
| **S9: Registry** | | | | | |
| `START_FINAL_QA` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `MARK_APPROVE` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `RELEASE_PACKING`| ✅ | ❌ | ❌ | ❌ | ❌ |
| **S10: BMS Prov** | | | | | |
| `START_SESSION` | ❌ | ✅ | ✅ | ❌ | ❌ |
| `FLASH_FW` | ❌ | ✅ | ❌ | ❌ | ✅ |
| `VERIFY_CONFIG` | ❌ | ✅ | ❌ | ✅ | ❌ |
| `COMPLETE_PROV` | ❌ | ✅ | ✅ | ❌ | ❌ |

## 5. Logistics (S11 - S14)

| Action | Mgmt | Logist | Stores | Sup |
|:---|:---:|:---:|:---:|:---:|
| **S11: Finished** | | | | |
| `PREPARE_DISPATCH`| ❌ | ❌ | ✅ | ✅ |
| `CONFIRM_TRANSIT` | ❌ | ✅ | ❌ | ❌ |
| `CLOSE_CUSTODY` | ✅ | ❌ | ❌ | ❌ |
| **S13: Auth** | | | | |
| `AUTHORIZE` | ❌ | ✅ | ❌ | ✅ |
| `HOLD_DISPATCH` | ❌ | ✅ | ❌ | ✅ |
| **S14: Exec** | | | | |
| `CONFIRM_LOAD` | ❌ | ✅ | ❌ | ✅ |
| `HANDOVER` | ❌ | ✅ | ❌ | ❌ |

## 6. Lifecycle & Governance (S12, S15 - S17)

| Action | Mgmt | Svc | Sust | Comp | Eng |
|:---|:---:|:---:|:---:|:---:|:---:|
| **S12: Warranty** | | | | | |
| `INITIATE_CLAIM` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `APPROVE_CLAIM` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S15: Compliance**| | | | | |
| `GENERATE_SNAP` | ❌ | ❌ | ✅ | ✅ | ❌ |
| `SUBMIT_REPORT` | ✅ | ❌ | ❌ | ✅ | ❌ |
| **S14: Circular** | | | | | |
| `INSPECT_RETURN` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `MARK_REFURB` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `CLOSE_CASE` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S16: Audit** | | | | | |
| `START_AUDIT` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `RESOLVE_FINDING`| ❌ | ❌ | ❌ | ✅ | ❌ |
| `CLOSE_AUDIT` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **S17: Closure** | | | | | |
| `ARCHIVE` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `CLOSE_PROGRAM` | ✅ | ❌ | ❌ | ❌ | ❌ |

---
**Key:**
*   **Mgmt:** Management / Plant Head
*   **Eng:** Engineering
*   **Comp:** Compliance
*   **Proc:** Procurement
*   **Sup:** Supervisor
*   **Ops:** Operator
*   **Logist:** Logistics
*   **Svc:** Service
*   **Sust:** Sustainability
