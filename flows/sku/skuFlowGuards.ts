/**
 * SKU Flow Transition Guards
 * Pure functions describing allowed state machine transitions.
 * @foundation V34-S1-FLOW-001-BP-01
 */

import type { SkuFlowState } from "./skuFlowContract";

/**
 * Maker can submit when in Draft or after a Rejection.
 */
export function canSubmit(current: SkuFlowState): boolean {
  return current === "Draft" || current === "Rejected";
}

/**
 * Checker can review when in Review state.
 */
export function canReview(current: SkuFlowState): boolean {
  return current === "Review";
}

/**
 * Approver can act when in Review (to push to Approved) 
 * OR when Approved (to publish to Active).
 */
export function canApprove(current: SkuFlowState): boolean {
  return current === "Review" || current === "Approved";
}

/**
 * Returns the next state after submission.
 */
export function nextStateOnSubmit(): SkuFlowState {
  return "Review";
}

/**
 * Returns the next state after a review decision.
 */
export function nextStateOnReview(decision: "SEND_BACK" | "FORWARD"): SkuFlowState {
  return decision === "SEND_BACK" ? "Draft" : "Approved";
}

/**
 * Returns the next state after an approval decision.
 */
export function nextStateOnApprove(decision: "APPROVE" | "REJECT"): SkuFlowState {
  return decision === "APPROVE" ? "Active" : "Rejected";
}
