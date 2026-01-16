# BPM-OS System Context (V3.1-EXT)

## 1. Product Vision
Battery Pack Manufacturing Operating System (BPM-OS) is a specialized MES designed for high-compliance battery assembly.
It bridges the gap between physical manufacturing (OT) and digital traceability (IT).

## 2. Operational Flow (SOP Map)
The system follows a strict linear sequence defined by the SOP:

- **S0-S1:** System Setup & Product Definition (Blueprint)
- **S2-S3:** Inbound Logistics & Material Verification
- **S4:** Production Planning & Batch Scheduling
- **S5-S8:** Manufacturing Execution (Cell -> Module -> Pack -> QA)
- **S9-S10:** Digital Identity & BMS Provisioning (Trace)
- **S11-S14:** Outbound Logistics & Dispatch
- **S15-S17:** Lifecycle Service & Compliance Governance

## 3. V3.1-EXT Scope
The "EXT" (Operations, Control & Dashboards) extension adds:
- Enhanced sidebar navigation for scalability.
- Consolidated system-level views (Inventory, Logs, Status).
- **Dashboard Graph Framework** (Added in EXT-PP-023) for management analytics.
- Separation of concerns between Frontend (Visual) and Backend (Logic).
- Strict "Trace" vs "Track" semantic enforcement.

## 4. Current UI Capabilities (as of EXT-HO-095)
The frontend baseline is **DESIGN FROZEN**.
**Last updated via patch:** EXT-HO-095 (Final Design Freeze & Handover Declaration)

## 5. Dashboard Foundation (EXT-PP-025)
The System Dashboard is a **TRACK** surface. It shows the current operational state of the plant and fleet.
- **Purpose:** Real-time visibility, trend analysis, and exception spotting.
- **Non-Purpose:** It is NOT the system of record for lineage (use Registry) and NOT an action surface (use Control Tower).
- **Structure:** The 4-section layout (Snapshot, Trends, Distribution, Risk) is frozen.

## 6. Handover Notes
This frontend is a **state-driven visual shell**. 
It contains NO business logic for:
- Inventory transactions
- Serial number generation
- Regulatory validation checks
- Hardware integration (CAN/Modbus)

All such logic must be implemented in the backend microservices.

---

# HANDOVER APPENDIX I: UI INVENTORY (EXT-HO-091)

## A. Screen Index
*(Refer to previous patch documentation for full screen inventory table)*

## B. Route Map
*   **Root (/)** -> Dashboard
*   **Operational Groups**: System Setup, Procurement, Production, Trace & Identity, Logistics, Track & Lifecycle, Govern, System.

---

# HANDOVER APPENDIX II: UI STATE MACHINE GLOSSARY (EXT-HO-094 VALIDATED)

*(Refer to previous patch documentation for validated glossary)*

---

# HANDOVER APPENDIX III: INTEGRATION HOOKS MAP (EXT-HO-093)

*(Refer to previous patch documentation for hooks map)*

---

# HANDOVER APPENDIX IV: HANDOVER VALIDATION NOTES (EXT-HO-094)

*(Refer to previous patch documentation for validation notes)*

---

# HANDOVER APPENDIX V: HANDOVER READINESS DECLARATION (EXT-HO-095)

**Status:** DESIGN FROZEN & HANDOVER READY
**Date:** 2026-01-15 22:30 (IST)
**Patch ID:** EXT-HO-095

## A. DECLARATION STATEMENT
**BPM-OS V3.1-EXT is hereby declared DESIGN-FROZEN and HANDOVER-READY.**
The Frontend Vibe-Coding Phase is complete. The interface semantics, navigation structure, and role-based behaviors are locked. Any deviation from this point forward requires formal change control.

## B. SCOPE LOCK — FROZEN ASSETS
The following components are contractually frozen:
1.  **Navigation & Sidebar:** Structure, grouping, and logic defined in `Sidebar.tsx`.
2.  **Route Paths:** Exact mapping as per `ROUTE_MAP.md`.
3.  **Role Dashboards:** Operator, Supervisor, Plant Head, Admin, Auditor views (EXT-PP-030 to 034).
4.  **Control Tower & Runbooks:** The 4-runbook architecture and their internal stage/gate logic.
5.  **System Pages:** Live Status, Inventory, Production Line, Logs, Reports, Documentation.
6.  **HUD Behavior:** Default collapsed state, non-blocking positioning, and metadata display.

## C. AUTHORITATIVE ARTIFACTS
These documents are the absolute source of truth for integration teams:
*   **RULEBOOK.md:** Behavioral constraints and "Frontend-Only" laws.
*   **BACKEND_CONTRACT.md (EXT-HO-090):** Data shapes and intent.
*   **SCREEN_INDEX.md (EXT-HO-091):** Complete inventory of visible surfaces.
*   **UI_STATE_MACHINE_GLOSSARY.md (EXT-HO-092):** Status enums and transition logic.
*   **INTEGRATION_HOOKS_MAP.md (EXT-HO-093):** React hook plug points.

## D. BACKEND HANDOVER GUARANTEES
To the Backend Engineering Team:
*   **No Reinterpretation:** You must not change the meaning of status enums (e.g., 'Blocked' means 'Blocked').
*   **Fixed Ordering:** Runbook stages must be returned in the order defined in the UI.
*   **Semantic Fidelity:** Track vs Trace distinction must be respected in API response structures.
*   **Auditor Safety:** Read-only constraints for Auditor roles must be enforced at the API level.

## E. QA / UAT ACCEPTANCE BASELINE
The frontend is accepted if:
1.  Navigation smoke test passes (all sidebar links load correct views).
2.  Dashboards render without crashing (White Screen test).
3.  Runbook details are readable end-to-end.
4.  Demo Mode labels are visible where backend data is absent.
5.  Responsiveness and basic accessibility checks pass.

## F. CHANGE CONTROL
Post-Freeze Change Rules:
*   No silent changes permitted.
*   Any UI/UX modification requires a new Patch ID and RULEBOOK update.
*   Backend changes that break the contract must be flagged immediately.

---
**END OF DECLARATION**
