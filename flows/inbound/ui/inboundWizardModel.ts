/**
 * Inbound Flow Wizard Model
 * Defines local state shape for the FLOW-003 step-wizard.
 * @foundation V34-S3-FLOW-003-PP-02
 */

import type { InboundReceiptDraft, InboundFlowState, InboundFlowRole } from "../inboundFlowContract";

export type InboundWizardStepId = "RECEIPT" | "SERIALIZATION" | "QC" | "DISPOSITION";

export interface InboundWizardModel {
  role: InboundFlowRole;
  state: InboundFlowState;
  step: InboundWizardStepId;
  receipt: InboundReceiptDraft;
  passCount: number;
  failCount: number;
}

/**
 * Initial defaults for a new material receipt flow.
 */
export function createDefaultInboundWizardModel(): InboundWizardModel {
  return {
    role: "Stores",
    state: "Received",
    step: "RECEIPT",
    receipt: {
      grnNumber: "",
      supplierName: "",
      materialCode: "",
      quantityReceived: 0,
      uom: "Units",
      receivedDate: new Date().toISOString().split('T')[0],
      notes: ""
    },
    passCount: 0,
    failCount: 0
  };
}

/**
 * Maps flow state to the appropriate UI wizard step.
 */
export function resolveInboundStepFromState(state: InboundFlowState): InboundWizardStepId {
  switch (state) {
    case "Received":
      return "RECEIPT";
    case "Serialized":
      return "SERIALIZATION";
    case "QCPending":
      return "QC";
    case "Released":
    case "Blocked":
    case "Scrapped":
      return "DISPOSITION";
    default:
      return "RECEIPT";
  }
}
