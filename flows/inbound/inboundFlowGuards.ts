/**
 * Inbound Flow Transition Guards
 * Pure functions describing allowed state machine transitions for FLOW-003.
 * @foundation V34-S3-FLOW-003-BP-01
 */

import type { InboundFlowState } from "./inboundFlowContract";

export function canSerialize(current: InboundFlowState): boolean {
  return current === "Received";
}

export function canSubmitForQc(current: InboundFlowState): boolean {
  return current === "Serialized";
}

export function canQcComplete(current: InboundFlowState): boolean {
  return current === "QCPending";
}

export function canRelease(current: InboundFlowState): boolean {
  return current === "Blocked" || current === "QCPending";
}

export function canScrap(current: InboundFlowState): boolean {
  return current !== "Released" && current !== "Scrapped";
}

export function nextStateOnSerialize(): InboundFlowState {
  return "Serialized";
}

export function nextStateOnSubmitQc(): InboundFlowState {
  return "QCPending";
}

export function nextStateOnQcDecision(decision: "PASS" | "FAIL" | "SCRAP"): InboundFlowState {
  switch (decision) {
    case "PASS": return "Released";
    case "FAIL": return "Blocked";
    case "SCRAP": return "Scrapped";
  }
}

export function nextStateOnRelease(): InboundFlowState {
  return "Released";
}

export function nextStateOnScrap(): InboundFlowState {
  return "Scrapped";
}
