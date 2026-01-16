# BPM-OS Frontend PATCHLOG

## V3.4 Active

| Patch ID | Patch Type | Intent | Status | Notes | Date |
|:---|:---|:---|:---|:---|:---|
| **V34-S1-GOV-PP-05** | Product Patch | Add Cell & IoT Blueprint Forms | **STABLE** | Replaced type cards with compact selector; Added specific forms for CELL and IOT types. | 2026-01-28 09:30 (IST) |
| **V34-S1-GOV-PP-04** | Product Patch | Enable Full Page Scrolling for SKU List | **STABLE** | Removed fixed height constraints on S1 Listing view to allow natural page scrolling. | 2026-01-28 08:30 (IST) |
| **V34-S1-GOV-PP-03** | Product Patch | Enhance S1 Blueprint Governance | **STABLE** | Refactored S1 to route-based views (List/Detail/Create); Added CELL/IOT types; Implemented type selection flow. | 2026-01-28 08:00 (IST) |
| **V34-S0-GOV-PP-02** | Product Patch | Enable Manufacturing Line Status Management | **STABLE** | Added status toggle (Active/Maintenance) for System Admins in S0. | 2026-01-28 07:00 (IST) |
| **V34-S0-GOV-PP-01** | Product Patch | Enable S0 Facility Editing & Line Provisioning | **STABLE** | Added generic Modal component; Implemented Edit Plant & Add Line forms in System Setup. | 2026-01-28 06:00 (IST) |
| **V34-CORE-FP-05** | Foundation | Implement Unified Route-Based Rendering | **STABLE** | Replaced App.tsx switch with configuration-driven ViewRegistry and GenericFlowScreen. | 2026-01-28 05:00 (IST) |
| **V34-STAB-BP-04** | Stabilization | Add Visual Consistency Tokens | **STABLE** | Standardized spacing and layout tokens for optional MES flow usage. | 2026-01-28 04:30 (IST) |
| **V34-STAB-BP-03** | Stabilization | Add Form Validation Helper | **STABLE** | Scoped utility for field validation within MES wizards. No component adoption yet. | 2026-01-28 04:00 (IST) |
| **V34-STAB-BP-02** | Stabilization | Add Wizard UX Guardrail helpers | **STABLE** | Pure helper logic for optional adoption by MES flows to ensure UI consistency. | 2026-01-28 03:30 (IST) |
| **V34-STAB-BP-01** | Stabilization | Add Regression Smoke Panel | **STABLE** | Read-only diagnostic panel to verify API wiring across all MES flows. | 2026-01-28 03:00 (IST) |
| **V34-MES-PP-11** | Product Patch | Standardize Flow Instance Lists across MES Screens | **STABLE** | Integrated FlowInstanceList into S3, S4, S9, and S11 screen wrappers for Pilot consistency. | 2026-01-28 02:30 (IST) |
| **V34-S11-FLOW-005-DOC-04** | Documentation | Document Dispatch & Custody Handover flow | **STABLE** | Detailed technical spec for FLOW-005. | 2026-01-28 02:00 (IST) |
| **V34-S11-FLOW-005-PP-03** | Product Patch | Wire Dispatch wizard to /api/flows/dispatch endpoints | **STABLE** | Integrated simulated API with in-memory store for consignment lifecycle. | 2026-01-28 01:30 (IST) |
| **V34-S11-FLOW-005-PP-02** | Product Patch | Add Dispatch wizard UI using FlowShell | **STABLE** | Local-only wizard for Dispatch & Custody Handover. | 2026-01-28 01:15 (IST) |
| **V34-S11-FLOW-005-BP-01** | Build-Phase | Define Dispatch flow states, consignment model, and API contracts | **STABLE** | Build-phase only; no UI wiring for FLOW-005. | 2026-01-28 01:00 (IST) |
| **V34-S9-FLOW-004-DOC-05** | Documentation | Document Final QA flow for backend + ops | **STABLE** | Detailed technical spec for FLOW-004. | 2026-01-28 00:45 (IST) |
| **V34-S9-FLOW-004-PP-04** | Product Patch | Wire Final QA wizard to /api/flows/final-qa endpoints | **STABLE** | Integrated simulated API for FQA lifecycle. | 2026-01-28 00:30 (IST) |
| **V34-S9-FLOW-004-PP-03** | Product Patch | Add Final QA wizard UI using FlowShell | **STABLE** | Local-only wizard for Final QA (S9) lifecycle. Includes ID generation simulation. | 2026-01-28 00:15 (IST) |
| **V34-S9-FLOW-004-FP-02** | Flow Policy | Define Final QA allowed actions by role + state | **STABLE** | Logic only; no UI change for FLOW-004. | 2026-01-27 23:45 (IST) |
| **V34-S9-FLOW-004-BP-01** | Build-Phase | Define Final QA flow states, checklist model, and API contracts | **STABLE** | Build-phase only; no UI wiring for FLOW-004. | 2026-01-27 23:30 (IST) |
| **V34-S3-FLOW-003-DOC-05** | Documentation | Document inbound + QC flow for ops and backend teams | **STABLE** | Technical spec for FLOW-003 including state model and API. | 2026-01-27 23:00 (IST) |
| **V34-S3-FLOW-003-PP-04** | Product Patch | Wire inbound wizard to /api/flows/inbound endpoints | **STABLE** | Integrated sim API for full material receipt lifecycle. | 2026-01-27 22:00 (IST) |
| **V34-S3-FLOW-003-PP-03** | Product Patch | Make inbound wizard tablet-friendly (warehouse usage) | **STABLE** | Implemented responsive layouts and touch optimizations for FLOW-003. | 2026-01-27 22:30 (IST) |
| **V34-S3-FLOW-003-PP-02** | Product Patch | Add inbound flow wizard UI using FlowShell | **STABLE** | Local-only wizard for material receipt lifecycle. | 2026-01-27 21:30 (IST) |
| **V34-S3-FLOW-003-BP-01** | Build-Phase | Define Inbound flow states, data model, and API payload contracts | **STABLE** | Contracts only for FLOW-003; no UI wiring. | 2026-01-27 21:00 (IST) |
| **V34-S2-FLOW-002-DOC-04** | Documentation | Document Batch / Work Order flow for backend & ops handover | **STABLE** | Technical spec for FLOW-002 including state model and API. | 2026-01-27 20:30 (IST) |
| **V34-S2-FLOW-002-PP-03** | Product Patch | Wire Batch Wizard to /api/flows/batch endpoints | **STABLE** | Integrated sim API with in-memory store for Batch lifecycle. | 2026-01-27 20:15 (IST) |
| **V34-S2-FLOW-002-PP-02** | Product Patch | Add Batch Flow Wizard UI using FlowShell | **STABLE** | Local state only. No API yet. Wizard hidden by default. | 2026-01-27 19:45 (IST) |
| **V34-S2-FLOW-002-BP-01** | Build-Phase | Define Batch flow states, data model, and API payload contracts | **STABLE** | Contracts only; no UI wiring or handlers. | 2026-01-27 19:15 (IST) |
| **V34-S1-FLOW-001-DOC-06** | Documentation | Document FLOW-001 (S1 SKU) — states, RBAC, wizard, API endpoints, handover meta | **STABLE** | No runtime change. Completes Flow-001 pilot. | 2026-01-27 18:45 (IST) |
| **V34-S1-FLOW-001-PP-06** | Product Patch | SKU Flow Instance List & Load | **STABLE** | Integrated sim API flow list into S1 screen; added "Resume" support in Wizard. | 2026-01-27 18:30 (IST) |
| **V34-S1-FLOW-001-PP-05** | Product Patch | Wire S1 SKU Wizard to /api/flows/sku endpoints backed by in-memory store | **STABLE** | Sim API via apiFetch; no global fetch patching. | 2026-01-27 18:00 (IST) |
| **V34-S1-FLOW-001-PP-04** | Product Patch | Add device-aware layout for S1 SKU Wizard (desktop/tablet/mobile) | **STABLE** | Uses useDeviceLayout(); still local-only; no API wiring. | 2026-01-27 17:15 (IST) |
| **V34-S1-FLOW-001-PP-03** | Product Patch | Add S1 SKU Flow Step Wizard UI (local-only; no API) | **STABLE** | Wizard hidden by default; existing S1 UI preserved. No API wiring yet. | 2026-01-27 16:45 (IST) |
| **V34-S1-FLOW-001-FP-02** | Flow Policy | Add RBAC policy mapping for SKU flow actions by role + state | **STABLE** | Pure policy logic; no UI changes. | 2026-01-27 16:15 (IST) |
| **V34-S1-FLOW-001-BP-01** | Flow Contract | Define S1 SKU flow state machine + API payload contracts (no UI wiring) | **STABLE** | Phase B begins. Contracts only. | 2026-01-27 15:45 (IST) |
| **V34-FND-BP-10** | Foundation | Add in-memory API store (flows map) resettable on reload | **STABLE** | PLAN: Phase A Step 6 (V34-FND-BP-06). Store introduced; endpoints still static; no UI wiring. | 2026-01-27 15:15 (IST) |
| **V34-FND-BP-09** | Foundation | Add /api/flows/* static skeleton endpoints (Option-B alignment) | **STABLE** | PLAN: Phase A Step 5 (V34-FND-BP-05). Static JSON only; no UI wiring. | 2026-01-27 14:45 (IST) |
| **V34-FND-BP-08** | Foundation | Add Device Layout Resolver + hook (mobile/tablet/desktop) | **STABLE** | PLAN: Phase A Step 4 (V34-FND-BP-04). Not used anywhere yet. Zero runtime change. | 2026-01-27 14:15 (IST) |
| **V34-FND-BP-08** | Foundation | Add Flow UI Harness shells (FlowShell/FlowStep/FlowFooter) | **STABLE** | PLAN: Phase A Step 3 (V34-FND-BP-03). Not used anywhere yet. Zero runtime change. | 2026-01-27 13:45 (IST) |
| **V34-FND-BP-06** | Foundation | Add GET /api/flows/registry route backed by FLOW_REGISTRY_SEED | **STABLE** | No UI wiring; still uses apiFetch wrapper only | 2026-01-27 13:10 (IST) |
| **V34-FND-BP-05** | Foundation | Route apiFetch("/api/*") to in-app simulated router (health endpoint available) | **STABLE** | No UI wiring; no global fetch patching; AI Studio safe | 2026-01-27 12:45 (IST) |
| **V34-FND-BP-04** | Foundation | Add in-app API router scaffold (types + dispatch + 1 health route) | **STABLE** | No UI wiring, no global fetch patching | 2026-01-27 12:10 (IST) |
| **V34-FND-BP-03** | Foundation | Add Flow Registry Seed (typed list, not yet rendered) | **STABLE** | Data-only; no runtime change | 2026-01-27 11:45 (IST) |
| **V34-HOTFIX-BP-00** | Hotfix | Prevent crash by removing window.fetch monkey-patch; introduce apiFetch wrapper | **STABLE** | AI Studio sandbox blocks assigning window.fetch | 2026-01-27 11:30 (IST) |
| **V34-API-BP-03** | Foundation | Option-B API Harness Scaffolding | **STABLE** | Global fetch patched; flowHandlers initialized | 2026-01-27 11:15 (IST) |
| **V34-FND-BP-02** | Foundation | Add Flow Contract Types (shared flow + API envelope types) | **STABLE** | Types-only; no runtime change | 2026-01-27 10:45 (IST) |
| **V34-FND-BP-01** | Foundation | Add Flow Inventory registry (docs only) + bump version to V3.4 | **STABLE** | No UI/runtime change | 2026-01-27 10:20 (IST) |