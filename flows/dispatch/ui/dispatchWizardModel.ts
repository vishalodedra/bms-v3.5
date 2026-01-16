/**
 * Dispatch Flow Wizard Model
 * Defines local state shape for the FLOW-005 step-wizard.
 * @foundation V34-S11-FLOW-005-PP-02
 */

import type { 
  DispatchDraft, 
  DispatchFlowState, 
  DispatchRole 
} from "../dispatchFlowContract";

// Fix: Exporting types that are required by the UI component
export type { 
  DispatchDraft, 
  DispatchFlowState, 
  DispatchRole 
};

export type DispatchWizardStepId = "DRAFT" | "APPROVAL" | "EXECUTION" | "DELIVERY" | "COMPLETION";

export interface DispatchWizardModel {
  role: DispatchRole;
  state: DispatchFlowState;
  step: DispatchWizardStepId;
  draft: DispatchDraft;
}

/**
 * Initial defaults for a new dispatch flow.
 */
export function createDefaultDispatchWizardModel(): DispatchWizardModel {
  return {
    role: "SCM",
    state: "Draft",
    step: "DRAFT",
    draft: {
      consignmentId: `CSGN-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      customerName: "",
      destination: "",
      items: [
        { batteryId: "BATT-2026-X992", skuCode: "BP-LFP-48V-2.5K", qty: 1 }
      ]
    }
  };
}

/**
 * Maps flow state to the appropriate UI wizard step.
 */
export function resolveDispatchStepFromState(state: DispatchFlowState): DispatchWizardStepId {
  switch (state) {
    case "Draft":
      return "DRAFT";
    case "Approved":
      return "EXECUTION";
    case "Dispatched":
      return "DELIVERY";
    case "Delivered":
    case "Closed":
    case "Cancelled":
      return "COMPLETION";
    default:
      return "DRAFT";
  }
}