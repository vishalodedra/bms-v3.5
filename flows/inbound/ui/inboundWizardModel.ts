
/**
 * Inbound Flow Wizard Model
 * Defines local state shape for the FLOW-003 step-wizard.
 * @foundation V34-S3-FLOW-003-PP-02
 */

import type { InboundReceiptDraft, InboundFlowState, InboundFlowRole } from "../inboundFlowContract";

export type InboundWizardStepId = "RECEIPT" | "SERIALIZATION" | "QC" | "DISPOSITION";

export interface SerialItemState {
  serial: string;
  isVerified: boolean;
  qcStatus?: 'PASS' | 'FAIL'; // V34-S3-GOV-FP-22: Local QC state
  disposition?: 'RELEASED' | 'SCRAPPED'; // V34-S3-GOV-FP-26: UI visibility
}

export interface InboundWizardModel {
  role: InboundFlowRole;
  state: InboundFlowState;
  step: InboundWizardStepId;
  receipt: InboundReceiptDraft;
  passCount: number;
  failCount: number;
  serializedItems: SerialItemState[]; // Added for visibility and verification tracking
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
      poNumber: "",
      grnNumber: "",
      supplierName: "",
      supplierLotNumber: "",
      materialCode: "",
      quantityReceived: 0,
      uom: "Units",
      receivedDate: new Date().toISOString().split('T')[0],
      notes: ""
    },
    passCount: 0,
    failCount: 0,
    serializedItems: []
  };
}

/**
 * Maps flow state to the appropriate UI wizard step.
 */
export function resolveInboundStepFromState(state: InboundFlowState): InboundWizardStepId {
  switch (state) {
    case "Received":
      // FIX V34-S3-GOV-FP-15: If state is Received, we are done with Receipt creation.
      return "SERIALIZATION";
    case "Serialized":
      return "SERIALIZATION";
    case "QCPending":
      return "QC";
    case "Disposition": 
      // V34-S3-GOV-FP-23: Explicit disposition step
      return "DISPOSITION";
    case "Released":
    case "Blocked":
    case "Scrapped":
    case "Completed": // V34-S3-GOV-FP-26: Final mixed state
      return "DISPOSITION"; // Show final summary
    default:
      return "RECEIPT";
  }
}
