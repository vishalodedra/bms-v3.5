
# BPM-OS Frontend PATCHLOG

## V3.4 Active

| Patch ID | Patch Type | Intent | Status | Notes | Date |
|:---|:---|:---|:---|:---|:---|
| **V34-S4-MANUAL-ALLOC-43** | Feature Patch | S4 Manual Allocation & Approval | **STABLE** | Disabled auto-allocation; Enforced manual cell selection in S4; Fixed Approval state transition and validation logic. | 2026-01-30 20:15 (IST) |
| **V34-S4-ALLOC-42** | Feature Patch | S4 Material Allocation Logic | **STABLE** | Enforced 'Planned Qty x Cells Per Module' allocation rule in Batch Wizard; Linked to S1 definition. | 2026-01-30 19:30 (IST) |
| **V34-S1-SKU-DEF-41** | Feature Patch | SKU Manufacturing Definition | **STABLE** | Added 'Cells per Module' to S1 Blueprint; Linked S5 Module Assembly target to S1 definition. | 2026-01-30 18:00 (IST) |
| **V34-DATA-PRE-MOCK-40** | Data Patch | Seed S1-S4 Mock Data | **STABLE** | Injected deterministic mock data for SKUs, POs, GRNs, and Batches to enable S5+ end-to-end flow testing without manual setup. | 2026-01-30 17:00 (IST) |
| **V34-S5-SPA-FP-39** | Feature Patch | S5 Workstation UX | **STABLE** | Implemented scan-based assembly loop, strict active-batch enforcement, and immutable aggregation logic for Module Assembly. | 2026-01-30 16:30 (IST) |
| **V34-S5-SPA-FP-38** | Architecture | S5 Route-Based SPA | **STABLE** | Converted S5 to listing-first architecture with strict routing and batch preconditions. Separated Listing, Detail, and Creation views. | 2026-01-30 15:00 (IST) |
| **V34-S5-SPA-FP-37** | Feature Patch | S5 Module Assembly | **STABLE** | Implemented S5 SPA with batch-scoped assembly, cell aggregation, and serialization. Enforced strict batch state preconditions. | 2026-01-30 14:00 (IST) |
| **V34-S4-FIX-36** | Fix Patch | Batch Execution Guard | **STABLE** | Enforced strict state gating for execution metrics. Added pre-start readiness view for Approved batches. | 2026-01-30 10:30 (IST) |
| **V34-S4-TRANS-35** | Feature Patch | Draft to Approved Transition | **STABLE** | Mapped Approved state to Execution step; added validations and approval workflow. | 2026-01-30 09:30 (IST) |
| **V34-S4-STAB-34** | Fix Patch | S4 Logic & SOP Messages | **STABLE** | Refined SKU validation logic to distinguish between 'No SKUs' and 'No Active SKUs'. Reaffirmed Draft-only creation and Listing redirect. | 2026-01-29 21:00 (IST) |
| **V34-S4-FIX-33** | Fix Patch | Fix Batch Post-Submit Navigation | **STABLE** | Updated Batch Wizard to redirect to Listing view instead of Detail view after successful batch creation. | 2026-01-29 20:30 (IST) |
| **V34-S4-FIX-32** | Fix Patch | Fix Batch Creation Navigation | **STABLE** | Implemented post-submit success feedback and auto-navigation to detail view in Batch Wizard. | 2026-01-29 19:30 (IST) |
| **V34-S4-SKU-FIX-31** | Fix Patch | Fix S4 SKU Active Lookup | **STABLE** | Seeded in-memory store with Active SKU; Updated Batch Wizard to strictly filter for 'Active' state and provide clearer empty state. | 2026-01-29 18:30 (IST) |
| **V34-S4-SPA-FP-30** | Feature Patch | S4 Material Allocation | **STABLE** | Implemented material allocation in Batch Wizard; Updated S4 route to /s4/batches; Enforced SKU and Material checks. | 2026-01-29 17:30 (IST) |
| **V34-S4-FIX-01** | Fix Patch | S4 Batch-Scoped Planning | **STABLE** | Removed global 'Planning Phase' lock. Enabled concurrent batch creation and editing. Guards now enforce RBAC and Upstream Dependencies only. | 2026-01-29 16:30 (IST) |
| **V34-S4-SPA-FP-29** | Architecture | S4 SPA Conversion | **STABLE** | Converted Batch Planning to route-based SPA; Implemented listing-first navigation structure; Removed local view state. | 2026-01-29 15:30 (IST) |
| **V34-S3-GOV-FP-28** | Fix Patch | Fix Missing Supplier | **STABLE** | Enforced Supplier Name capture in Inbound Wizard; Implemented API-level backfill for legacy records to prevent blank listings. | 2026-01-29 14:15 (IST) |
| **V34-S3-GOV-FP-27** | Fix Patch | S3 Item Traceability | **STABLE** | Added PO Number and Supplier Lot fields to Inbound Receipt form; Propagated traceability fields to item-level records; Fixed N/A display in View page. | 2026-01-29 13:00 (IST) |
| **V34-S3-GOV-FP-26** | Fix Patch | S3 Item Disposition | **STABLE** | Introduced 'Completed' state for mixed-result workflows; Added item-level disposition tracking (Released/Scrapped); Updated wizard UI to handle partial releases. | 2026-01-29 11:45 (IST) |
| **V34-S3-GOV-FP-25** | Fix Patch | Fix S3 Workflow Transition | **STABLE** | Enforced Disposition state after QC; Added explicit release/scrap actions in wizard; Prevented premature finalization. | 2026-01-29 10:30 (IST) |
| **V34-CORE-FP-26** | Fix Patch | Fix Preview Routing (HashRouter) | **STABLE** | Switched to HashRouter to fix white screen and navigation errors in AI Studio Preview iframe. | 2026-01-29 09:30 (IST) |
| **V34-CORE-FP-25** | Fix Patch | Fix Preview Navigation | **STABLE** | Configured BrowserRouter basename; Added catch-all route redirect to prevent iframe errors. | 2026-01-29 08:30 (IST) |
| **V34-S3-GOV-FP-24** | Fix Patch | S3 Route-Based Nav | **STABLE** | Replaced state-based navigation with React Router; Implemented nested routes for S3 flow; Added route registry. | 2026-01-29 07:30 (IST) |
| **V34-S3-GOV-FP-23** | Fix Patch | Fix Premature S3 Finalization | **STABLE** | Introduced 'Disposition' state; Enforced explicit release action after QC. | 2026-01-29 06:15 (IST) |
| **V34-S3-GOV-FP-22** | Fix Patch | Explicit Serial QC Mapping | **STABLE** | Replaced QC slider with serial-level Pass/Fail selection; Enforced explicit disposition per item. | 2026-01-29 05:15 (IST) |
| **V34-S3-GOV-FP-21** | Fix Patch | Fix QC Serial Disposition | **STABLE** | Implemented serial-level QC status mapping (Pass/Block); Corrected View page visibility. | 2026-01-29 04:30 (IST) |
| **V34-S3-GOV-FP-20** | Fix Patch | S3 Serialization Post-Gen | **STABLE** | Removed invalid scan step after Internal Generation; Added completion locking. | 2026-01-29 03:45 (IST) |
| **V34-S3-GOV-FP-19** | Fix Patch | S3 Serialization Logic Fix | **STABLE** | Separated Internal Gen vs Scan Verification; Disabled auto-verify; Removed scan requirement for Internal Gen. | 2026-01-29 03:00 (IST) |
| **V34-S3-GOV-FP-18** | Fix Patch | Fix Serialization UX | **STABLE** | Enforced manual scan-only flow; Moved serial list to bottom; Added serial visibility to Receipt Detail view. | 2026-01-29 02:00 (IST) |
| **V34-S3-GOV-FP-17** | Fix Patch | Fix Serialization UI | **STABLE** | Implemented visible Serial List and Scan Verification logic in Inbound Wizard. | 2026-01-29 01:00 (IST) |
| **V34-S3-GOV-FP-16** | Fix Patch | Fix Internal Serial Gen | **STABLE** | Fixed serialization logic to deterministically generate and persist serials; Enforced explicit 'Generate' action before QC. | 2026-01-29 00:15 (IST) |
| **V34-S3-GOV-FP-15** | Fix Patch | Fix Inbound Next Navigation | **STABLE** | Corrected wizard step resolution for 'Received' state to ensure transition to Serialization. | 2026-01-28 23:45 (IST) |
| **V34-S3-GOV-FP-14** | Fix Patch | S3 Functional Completeness | **STABLE** | Added PO Number & Supplier Lot capture to Inbound Flow; Enforced strict serialization method selection. | 2026-01-28 23:15 (IST) |
| **V34-S3-GOV-FP-13** | Fix Patch | Restore S3 Features | **STABLE** | Restored Scan, Serialization Modes, and Label Printing in Inbound Wizard. Preserved routing. | 2026-01-28 22:45 (IST) |
| **V34-S3-GOV-PP-12** | Product Patch | S3 Full Page & Routing | **STABLE** | Implemented full-page scrolling and route-based navigation for Inbound Console; Removed split-pane constraint. | 2026-01-28 22:00 (IST) |
| **V34-S3-GOV-PP-11** | Product Patch | S3 Inbound Flow Strictness | **STABLE** | Enforced GRN->Serialization->QC->Disposition flow; Implemented strict inventory state machine and audit events. | 2026-01-28 21:00 (IST) |
