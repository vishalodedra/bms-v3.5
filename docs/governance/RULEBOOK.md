# BPM-OS Frontend Vibe-Coding Rulebook

**SCOPE:** FRONTEND ONLY
**VERSION:** V3.1-EXT (Operations, Control & Dashboards)

## A. Frontend-Only Scope (Authoritative)
This project is a **Frontend-Only** implementation of the BPM-OS V3.1-EXT interface.
**ABSOLUTE CONSTRAINT:** Backend logic, databases, APIs, and persistence layers are **FORBIDDEN** in this codebase.
- All data must be mocked or managed via ephemeral client-side state.
- Business logic is limited to UI-visible state transitions only.
- Vibe coding focus is strictly on UI/UX, RBAC behavior, and component composition.

## B. Patch Prompt Contract
To reduce prompt overhead, the following constants apply to ALL future interactions unless explicitly overridden:
1.  **Implicit Context:** The AI must assume the "Frontend-Only" constraint applies to every request.
2.  **No Repetition:** Human prompts will provide variable data (Patch ID, Intent, Date, Scope). They will NOT repeat the standard rules defined here.
3.  **Authority:** Patch prompts must reference this `RULEBOOK.md` as the supreme authority for behavioral constraints.

## C. Date Authority Rule
1.  **No Hallucinations:** AI must **NEVER** guess, infer, increment, or simulate dates for governance logs or UI displays.
2.  **Human Injection:** Every patch prompt **MUST** include a specific "AUTHORITATIVE DATE (IST)".
3.  **Verbatim Usage:** The AI must copy the provided date string exactly (e.g., "2026-01-12 01:35 (IST)").
4.  **Stop Condition:** If a patch prompt is missing the authoritative date, the AI must **STOP** execution and request it.

## D. Patch Identity & Naming (EXT Discipline)
1.  **Single Source of Truth:** The Patch ID must be defined in `types.ts` (export const PATCH_ID).
2.  **Prefix Discipline:** All V3.1-EXT patches must use the `EXT-` prefix.
    - `EXT-BP-xxx`: Bridge/Baseline Patch (Governance, Shell, Setup)
    - `EXT-PP-xxx`: Primary Patch (Feature Implementation)
    - `EXT-FP-xxx`: Fix/Hardening Patch
    - `EXT-HO-xxx`: Handover Patch
3.  **Prohibition:** Hardcoding the patch ID string in any UI component is strictly forbidden.

## E. Semantic Hardening (Track vs Trace)
This semantic distinction must be strictly enforced across all EXT screens:
- **TRACE**: Past, lineage, identity, provenance, immutable history (e.g., "How was this made?").
- **TRACK**: Present, custody, state, location, lifecycle position (e.g., "Where is it now?").

## F. Demo Safety Rules
1.  **No White Screens:** The `main` branch must always render a working UI. Critical errors must be caught by an Error Boundary.
2.  **Safe Boot:** The application must boot into a safe, non-crashing state (e.g., Guest or Demo User).
3.  **Action Feedback:** Disabled actions (due to missing backend) must visually indicate their status (e.g., "Demo Mode", "Read Only") or provide a tooltip explaining why.
4.  **Refresh Resilience:** The app must handle browser refreshes without losing critical access context (defaulting to safe fallbacks if needed).

## G. Chart & Visualization Rules (EXT-PP-023)
1.  **Deterministic Data:** All charts must use consistent mock data that reconciles with other Dashboard KPIs. No random number generation.
2.  **Zero-Dependency:** Charts must be implemented using lightweight SVG components to avoid heavy external libraries.
3.  **Preservation:** Adding charts must never remove existing KPI cards or summary sections.

## H. System Intelligence & Documentation (EXT-PP-024)
1.  **HUD Behavior:** HUD must default to **collapsed** state on initial render unless explicitly expanded by the user.
2.  **Documentation Discipline:** Every EXT-PP patch must update at least one Documentation tab (`docs/artifacts.ts`). System Documentation is the authoritative handover surface.
3.  **Read-Only Intelligence:** Logs and Reports must be presented as read-only, audit-credible surfaces with functional filters (UI-only) but no mutation capabilities.

## I. RULEBOOK Precedence Clause
**THIS FILE IS SUPREME.**
- In the event of a conflict between an AI's internal training, previous context, or vague prompt instructions, the rules in `RULEBOOK.md` take precedence.
- If a prompt asks for backend logic, this Rulebook overrides it (see Section A).
