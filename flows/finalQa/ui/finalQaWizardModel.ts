/**
 * Final QA Flow Wizard Model
 * Defines local state shape for the FLOW-004 step-wizard.
 * @foundation V34-S9-FLOW-004-PP-03
 */

import type { FinalQaDraft, FinalQaFlowState, FinalQaRole } from "../finalQaFlowContract";

export type FinalQaStepId = "PACK_INFO" | "CHECKLIST" | "DECISION" | "COMPLETION";

export interface FinalQaWizardModel {
  role: FinalQaRole;
  state: FinalQaFlowState;
  step: FinalQaStepId;
  draft: FinalQaDraft;
  batteryId?: string;
  rejectionReason?: string;
  reworkNotes?: string;
}

const DEFAULT_CHECKLIST = [
  { id: 'eol-1', label: 'Voltage Stability Test (OCV)', result: 'NA' as const },
  { id: 'eol-2', label: 'Enclosure Seal Integrity', result: 'NA' as const },
  { id: 'eol-3', label: 'Firmware Version Verification', result: 'NA' as const },
  { id: 'eol-4', label: 'Safety Interlock Functionality', result: 'NA' as const },
  { id: 'eol-5', label: 'External Visual & Labeling', result: 'NA' as const },
];

/**
 * Initial defaults for a new Final QA session.
 */
export function createDefaultFinalQaWizardModel(): FinalQaWizardModel {
  return {
    role: "QA",
    state: "Pending",
    step: "PACK_INFO",
    draft: {
      packId: "",
      skuCode: "",
      checklist: [...DEFAULT_CHECKLIST],
      remarks: ""
    }
  };
}

/**
 * Maps flow state to the appropriate UI wizard step.
 */
export function resolveFinalQaStepFromState(state: FinalQaFlowState): FinalQaStepId {
  switch (state) {
    case "Pending":
      return "CHECKLIST";
    case "Approved":
    case "Rejected":
    case "ReworkRequested":
      return "COMPLETION";
    default:
      return "PACK_INFO";
  }
}
