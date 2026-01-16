/**
 * Batch Flow Wizard Model
 * Defines local state shape for the FLOW-002 step-wizard.
 * @foundation V34-S2-FLOW-002-PP-02
 */

import type { BatchDraft, BatchFlowState, BatchFlowRole } from "../batchFlowContract";

export type WizardStepId = "DRAFT" | "APPROVAL" | "EXECUTION" | "COMPLETION";

export interface BatchWizardModel {
  role: BatchFlowRole;
  state: BatchFlowState;
  step: WizardStepId;
  draft: BatchDraft;
  comment?: string;
}

/**
 * Initial defaults for a new Batch creation flow.
 */
export function createDefaultBatchWizardModel(): BatchWizardModel {
  return {
    role: "Planner",
    state: "Draft",
    step: "DRAFT",
    draft: { 
      batchName: "", 
      skuCode: "", 
      plannedQuantity: 0,
      notes: "" 
    }
  };
}

/**
 * Maps flow state to the appropriate UI wizard step.
 */
export function resolveBatchStepFromState(state: BatchFlowState): WizardStepId {
  switch (state) {
    case "Draft":
      return "DRAFT";
    case "Approved":
      return "APPROVAL";
    case "InProgress":
      return "EXECUTION";
    case "Completed":
    case "Cancelled":
      return "COMPLETION";
    default:
      return "DRAFT";
  }
}