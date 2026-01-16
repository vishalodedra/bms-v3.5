/**
 * Batch Flow Transition Guards
 * Pure functions describing allowed state machine transitions for FLOW-002.
 * @foundation V34-S2-FLOW-002-BP-01
 */

import type { BatchFlowState } from "./batchFlowContract";

export function canApprove(current: BatchFlowState): boolean {
  return current === "Draft";
}

export function canStart(current: BatchFlowState): boolean {
  return current === "Approved";
}

export function canComplete(current: BatchFlowState): boolean {
  return current === "InProgress";
}

export function canCancel(current: BatchFlowState): boolean {
  return current !== "Completed" && current !== "Cancelled";
}

export function nextStateOnApprove(): BatchFlowState {
  return "Approved";
}

export function nextStateOnStart(): BatchFlowState {
  return "InProgress";
}

export function nextStateOnComplete(): BatchFlowState {
  return "Completed";
}

export function nextStateOnCancel(): BatchFlowState {
  return "Cancelled";
}