# Route & Navigation Map

**Patch ID:** V33-DOC-HO-92
**Status:** FROZEN
**Context:** Navigation Architecture for BPM-OS V3.3

This document maps the application's navigation structure, sidebar hierarchy, and routing logic. In V3.3, routing is handled via client-side state (`NavView` enum), not URL routing, to ensure a seamless "app-like" feel without page reloads.

## 1. Sidebar Hierarchy

The primary navigation is the left-hand sidebar (`Sidebar.tsx`). Visibility of groups and items is guarded by RBAC.

| Group | Label | Route ID (`NavView`) | Access Roles (Primary) |
|:---|:---|:---|:---|
| **Root** | Dashboard | `dashboard` | All |
| **System Setup** | System Setup (S0) | `system_setup` | Admin, Mgmt |
| | SKU & Blueprint (S1) | `sku_blueprint` | Admin, Eng, Mgmt |
| **Procurement** | Procurement (S2) | `procurement` | Admin, Proc, Mgmt |
| | Inbound Receipt (S3) | `inbound_receipt` | Admin, Stores, Sup, Mgmt |
| **Production** | Batch Planning (S4) | `batch_planning` | Admin, Planner, Sup, Mgmt |
| | Module Assembly (S5) | `module_assembly` | Admin, Ops, Sup, Mgmt |
| | Module QA (S6) | `module_qa` | Admin, QA, Sup, Mgmt |
| | Pack Assembly (S7) | `pack_assembly` | Admin, Ops, Sup, Mgmt |
| | Pack Review (S8) | `pack_review` | Admin, QA, Sup, Mgmt |
| **Trace & Identity** | Battery Registry (S9) | `battery_registry` | Admin, Mgmt, Eng, QA |
| | BMS Provisioning (S10) | `bms_provisioning` | Admin, Eng, Sup, Mgmt |
| **Logistics** | Finished Goods (S11) | `finished_goods` | Admin, Stores, Logistics, Mgmt |
| | Packaging (S12) | `packaging_aggregation` | Admin, Stores, Logistics, Mgmt |
| | Dispatch Auth (S13) | `dispatch_authorization` | Admin, Logistics, Sup, Mgmt |
| | Dispatch Exec (S14) | `dispatch_execution` | Admin, Logistics, Stores, Mgmt |
| **Track & Lifecycle** | Service & Warranty (S15) | `service_warranty` | Admin, Service, Mgmt |
| | Recycling & Recovery (S16) | `recycling_recovery` | Admin, Sust, Service, Mgmt |
| **Govern** | Control Tower | `control_tower` | All (Context Aware) |
| | Compliance & Audit (S17) | `compliance_audit` | Admin, Comp, Sust, Mgmt |
| **System** | Live Status | `live_status` | All |
| | Inventory | `system_inventory` | All |
| | Production Line | `production_line` | All |
| | Logs | `system_logs` | All |
| | Reports | `system_reports` | All |
| | Documentation | `documentation` | All |

## 2. Contextual Navigation (Drill-Downs)

Beyond the sidebar, specific screens offer contextual navigation flows.

### Control Tower (`ControlTower.tsx`)
The Control Tower acts as a central hub. Clicking a **Runbook Card** navigates to the detailed runbook view.
- **Route:** `runbook_detail`
- **Context:** Requires `activeRunbookId` state (e.g., 'manufacturing', 'material').
- **Behavior:** Loads `RunbookDetail.tsx`.

### Runbook Detail (`RunbookDetail.tsx`)
Displays the linear stage progression of a runbook.
- **Action:** Clicking "Go to Operational Screen" on a specific stage.
- **Target:** Navigates to the corresponding `NavView` (e.g., `module_assembly`) for execution.
- **Context Handoff:** Sets `ActiveContext` in `sessionStorage` to display the "Active Context" banner on the destination screen.

### Exceptions View (`ExceptionsView.tsx`)
Detailed view of system blockers and risks.
- **Entry:** Accessed via "View Exceptions" in Control Tower or Dashboard widgets.
- **Route:** `exceptions_view`

## 3. Workflow Guidance (Next Step Panels)
Each operational screen (S0-S17) includes a "Next Recommended Action" panel (`components/StageStateBanner.tsx` and inline logic).
- **Purpose:** Guides users through the linear SOP flow.
- **Logic:** Checks the local stage context (e.g., `isReadyForNext`).
- **Target:** Navigates to the logically next screen in the lifecycle (e.g., S3 -> S4).

## 4. Routing Implementation Details
- **Router:** Custom state-based router in `App.tsx` (`currentView` state).
- **History:** Not integrated with Browser History API in V3.3 (Single Page Application behavior).
- **Persistence:** View state is ephemeral; refreshing returns to `dashboard` (unless recovered via session/local storage mechanisms in future patches).
- **Error Handling:** `ErrorBoundary` catches render failures and offers navigation back to `dashboard` or `documentation`.
