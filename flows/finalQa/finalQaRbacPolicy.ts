/**
 * Final QA Flow RBAC Policy
 * Determines permitted actions based on the intersection of Role and State for FLOW-004.
 * @foundation V34-S9-FLOW-004-FP-02
 */

import type { FinalQaFlowState, FinalQaRole } from "./finalQaFlowContract";

export type FinalQaFlowAction =
  | "CREATE_DRAFT"
  | "EDIT_CHECKLIST"
  | "SUBMIT_QA"
  | "APPROVE"
  | "REJECT"
  | "REQUEST_REWORK"
  | "GENERATE_BATTERY_ID"
  | "VIEW";

/**
 * Returns an array of allowed actions for a given role and state.
 */
export function getAllowedFinalQaActions(
  role: FinalQaRole,
  state: FinalQaFlowState
): FinalQaFlowAction[] {
  const actions: FinalQaFlowAction[] = ["VIEW"];

  switch (role) {
    case "QA":
      // QA context: Inputting and submitting findings
      if (state === "Pending") {
        actions.push("CREATE_DRAFT", "EDIT_CHECKLIST", "SUBMIT_QA");
      }
      break;

    case "Supervisor":
      // Supervisor context: Review and Disposition
      if (state === "Pending") {
        actions.push("APPROVE", "REJECT", "REQUEST_REWORK");
      }
      break;

    case "System":
      // System context: Digital identity automation
      if (state === "Approved") {
        actions.push("GENERATE_BATTERY_ID");
      }
      break;
  }

  return actions;
}

/**
 * Helper to check if a specific action is permitted.
 */
export function isActionAllowed(
  role: FinalQaRole,
  state: FinalQaFlowState,
  action: FinalQaFlowAction
): boolean {
  return getAllowedFinalQaActions(role, state).includes(action);
}
