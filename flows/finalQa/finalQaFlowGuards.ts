/**
 * Final QA Flow Transition Guards
 * Pure functions describing allowed state machine transitions for FLOW-004.
 * @foundation V34-S9-FLOW-004-BP-01
 */

import type { FinalQaFlowState } from "./finalQaFlowContract";

export function canSubmit(current: FinalQaFlowState): boolean {
  return current === "Pending" || current === "ReworkRequested";
}

export function canApprove(current: FinalQaFlowState): boolean {
  return current === "Pending";
}

export function canReject(current: FinalQaFlowState): boolean {
  return current === "Pending";
}

export function canRequestRework(current: FinalQaFlowState): boolean {
  return current === "Pending";
}

export function nextStateOnApprove(): FinalQaFlowState {
  return "Approved";
}

export function nextStateOnReject(): FinalQaFlowState {
  return "Rejected";
}

export function nextStateOnRework(): FinalQaFlowState {
  return "ReworkRequested";
}

export function nextStateOnSubmit(): FinalQaFlowState {
  return "Pending";
}