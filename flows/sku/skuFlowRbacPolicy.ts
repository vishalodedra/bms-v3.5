/**
 * SKU Flow RBAC Policy
 * Determines permitted actions based on the intersection of Role and State.
 * @foundation V34-S1-FLOW-001-FP-02
 */

import type { SkuFlowRole, SkuFlowState } from "./skuFlowContract";
import { canSubmit } from "./skuFlowGuards";

export type SkuFlowAction =
  | "CREATE"
  | "EDIT_DRAFT"
  | "SUBMIT_FOR_REVIEW"
  | "REVIEW_SEND_BACK"
  | "REVIEW_FORWARD"
  | "APPROVE_TO_ACTIVE"
  | "REJECT"
  | "VIEW";

/**
 * Returns an array of allowed actions for a given role and state.
 */
export function getAllowedSkuActions(role: SkuFlowRole, state: SkuFlowState): SkuFlowAction[] {
  const actions: SkuFlowAction[] = ["VIEW"];

  switch (role) {
    case "Maker":
      // Maker context: Creation and drafting
      if (state === "Draft") {
        actions.push("CREATE");
      }
      if (state === "Draft" || state === "Rejected") {
        actions.push("EDIT_DRAFT");
      }
      if (canSubmit(state)) {
        actions.push("SUBMIT_FOR_REVIEW");
      }
      break;

    case "Checker":
      // Checker context: Technical review
      if (state === "Review") {
        actions.push("REVIEW_SEND_BACK");
        actions.push("REVIEW_FORWARD");
      }
      break;

    case "Approver":
      // Approver context: Final sign-off and activation
      // Allowed for pilot speed to act on 'Review' directly or the standard 'Approved' state.
      if (state === "Review" || state === "Approved") {
        actions.push("APPROVE_TO_ACTIVE");
        actions.push("REJECT");
      }
      break;
  }

  return actions;
}

/**
 * Helper to check if a specific action is permitted.
 */
export function isActionAllowed(
  role: SkuFlowRole,
  state: SkuFlowState,
  action: SkuFlowAction
): boolean {
  return getAllowedSkuActions(role, state).includes(action);
}
