# BPM-OS V3.1 — BACKEND HANDOVER CONTRACT

**Patch ID:** PP-094
**Status:** FROZEN
**Date:** 2026-01-12 01:25 (IST)

---

## 1. PREAMBLE
This document certifies that the Frontend Vibe-Coding Phase for BPM-OS V3.1 is complete. 
The interface is now locked. All subsequent development must focus on backend implementation, API integration, and data persistence.

## 2. FRONTEND ASSUMPTIONS
The current UI operates under the following conditions which must be replaced by live logic:

*   **Deterministic UI:** Screens transition based on local React state only.
*   **Mocked Data:** All tables, metrics, and details are populated by hardcoded constants/JSON.
*   **Ephemeral State:** No data persists across browser refreshes (session storage only).
*   **No Backend Logic:** Complexity such as inventory allocation, serial number generation, and validation is simulated visually.

## 3. BACKEND RESPONSIBILITIES (By Domain)

### A. Trace & Identity (S1, S9, S10)
**Backend must provide:**
*   **Immutable Ledger:** A write-once database for Battery Passports and Digital Twins.
*   **Event Sourcing:** Every status change (Mfg -> Warehouse -> Dispatch) must be a recorded event.
*   **Unique Identity Resolution:** APIs to fetch Asset details by UUID, Barcode, or RFID tag.
*   **Provisioning:** Integration with physical BMS hardware via CAN/UART protocols (over WebSocket or local gateway).

### B. Track & Lifecycle (S11–S16)
**Backend must provide:**
*   **Custody Chain:** Strict ownership tracking (Manufacturer vs. Logistics vs. Customer).
*   **State Machine Enforcement:** Prevent illegal transitions (e.g., Shipping a pack that failed QA).
*   **Telemetry Ingestion:** Real-time (or periodic) storage of SoH, SoC, and Temperature data from deployed units.
*   **Inventory Management:** Real-time stock levels, location mapping, and reservation logic.

### C. Governance (S17)
**Backend must provide:**
*   **Audit Logging:** Comprehensive logs of WHO did WHAT and WHEN for every critical action.
*   **Compliance Aggregation:** Automatic calculation of EPR masses and recycling quotas.
*   **RBAC Enforcement:** Server-side validation of permissions (UI hiding is insufficient for security).

## 4. INTEGRATION GUIDELINES
*   **API Pattern:** RESTful or GraphQL is recommended.
*   **Auth:** JWT-based authentication flow expected.
*   **Error Handling:** Backend should return standard HTTP error codes which the existing Error Boundaries can handle gracefully (via interceptors).

---

# V3.1-EXT EXTENSION CONTRACT (SCAFFOLD)

**Patch ID:** EXT-BP-000
**Status:** INITIALIZING
**Date:** 2026-01-12 01:35 (IST)

This section defines the backend requirements for the EXT (Operations & Control) Phase.

## 1. EXT MODULES (Planned)
*   **Dashboarding & Analytics:** (Requirements TBD)
*   **Operational Runbooks:** (Requirements TBD)
*   **Advanced Control Systems:** (Requirements TBD)

## 2. DATA REQUIREMENTS
*   [ ] Real-time aggregated metrics endpoint
*   [ ] Historical trend analysis API
*   [ ] WebSocket stream for live alerts

---
**END OF EXT CONTRACT**