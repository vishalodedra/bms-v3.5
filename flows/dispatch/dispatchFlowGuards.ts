/**
 * Dispatch Flow Transition Guards
 * Pure functions describing allowed state machine transitions for FLOW-005.
 * @foundation V34-S11-FLOW-005-BP-01
 */

import type { DispatchFlowState } from "./dispatchFlowContract";

export function canApprove(current: DispatchFlowState): boolean {
  return current === "Draft";
}

export function canDispatch(current: DispatchFlowState): boolean {
  return current === "Approved";
}

export function canDeliver(current: DispatchFlowState): boolean {
  return current === "Dispatched";
}

export function canClose(current: DispatchFlowState): boolean {
  return current === "Delivered";
}

export function canCancel(current: DispatchFlowState): boolean {
  return current !== "Closed" && current !== "Cancelled";
}

export function nextStateOnApprove(): DispatchFlowState {
  return "Approved";
}

export function nextStateOnDispatch(): DispatchFlowState {
  return "Dispatched";
}

export function nextStateOnDelivery(): DispatchFlowState {
  return "Delivered";
}

export function nextStateOnClose(): DispatchFlowState {
  return "Closed";
}

export function nextStateOnCancel(): DispatchFlowState {
  return "Cancelled";
}