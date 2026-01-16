# V3.3 DO-NOT-BREAK MANIFEST

**Baseline:** V3.3 starts from BPM-OS V3.1-EXT frontend.
**Status:** ACTIVE
**Date:** 2026-01-15

## 1. Baseline Statement
This document governs the V3.3 Core branch. All development starts from the stable V3.1-EXT codebase.
The integrity of the existing "Vibe Code" (UI/UX, animations, mock data structures) must be preserved while preparing for backend integration.

## 2. Non-Negotiable Guarantees
Any patch applied to V3.3 must **NOT** violate the following:

*   **Boot Safety:** The application must boot into the Dashboard without white screens or critical errors.
*   **Navigation:** Sidebar navigation must remain functional for all defined routes (S0–S17).
*   **RBAC Consistency:** Role-based access control logic (hiding/showing elements based on `UserContext`) must not be bypassed.
*   **SOP Continuity:** All SOP stages (e.g., S5 Module Assembly, S9 Registry) must remain accessible.
*   **System Pages:** Live Status, Inventory, Production Line, Logs, Reports, and Documentation must load correctly.
*   **Architecture:**
    *   No hash routing (keep History API).
    *   No backend dependencies (Frontend-only mode must persist).
    *   No removal of existing mocks without functional replacement.

## 3. Validation Checklist (Run after every patch)
*   [ ] **Build Test:** App compiles and runs (`npm start` / build).
*   [ ] **Smoke Test:** Dashboard loads default view with KPIs visible.
*   [ ] **Nav Test:** Sidebar expansion/collapse works.
*   [ ] **Role Test:** Role switcher updates the context and restricts views appropriately.
*   [ ] **Component Test:** Control Tower loads runbook cards; HUD is visible and expandable.
*   [ ] **Console Cleanliness:** No critical console errors on initial load.

## 4. UX Patterns (V3.3)
*   **GateNotice Pattern:** Context-dependent views (like Runbook Detail) must render a "Blocked" GateNotice when context is missing, guiding the user back to the selection point.
*   **StageStateBanner:** All S0–S17 screens must include the `StageStateBanner` component to indicate operational readiness.
*   **PreconditionsPanel:** All S0–S17 screens must include the `PreconditionsPanel` to list required checks before action.
*   **DisabledHint:** Actions disabled by demo/logic must display a `DisabledHint` explanation.
*   **Context Handoff:** Active context handoff uses sessionStorage; no routing changes.
