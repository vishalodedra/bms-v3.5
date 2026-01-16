/**
 * Final QA Flow Contract (FLOW-004)
 * Canonical definitions for Final Pack QA & Digital Twin Registration (S9).
 * @foundation V34-S9-FLOW-004-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type FinalQaFlowState = "Pending" | "Approved" | "Rejected" | "ReworkRequested";

export type FinalQaRole = "QA" | "Supervisor" | "System";

export interface QaChecklistItem {
  id: string;
  label: string;
  result: "PASS" | "FAIL" | "NA";
  evidenceNote?: string;
}

export interface FinalQaDraft {
  packId: string;
  skuCode: string;
  batchId?: string;
  workstationId?: string;
  checklist: QaChecklistItem[];
  remarks?: string;
}

export interface FinalQaFlowInstance {
  flowId: "FLOW-004";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: FinalQaFlowState;

  draft: FinalQaDraft;

  qaBy?: string;
  qaAt?: IsoDateTime;

  approvedBy?: string;
  approvedAt?: IsoDateTime;

  rejectedBy?: string;
  rejectedAt?: IsoDateTime;
  rejectionReason?: string;

  reworkRequestedBy?: string;
  reworkRequestedAt?: IsoDateTime;
  reworkNotes?: string;

  batteryId?: string; // Generated on approval (System)
}

// API Payloads
export interface CreateFinalQaReq {
  draft: FinalQaDraft;
}
export type CreateFinalQaRes = ApiResult<FinalQaFlowInstance>;

export interface SubmitFinalQaReq {
  instanceId: EntityId;
}
export type SubmitFinalQaRes = ApiResult<FinalQaFlowInstance>;

export interface ApproveFinalQaReq {
  instanceId: EntityId;
  approvedBy: string;
}
export type ApproveFinalQaRes = ApiResult<FinalQaFlowInstance>;

export interface RejectFinalQaReq {
  instanceId: EntityId;
  rejectedBy: string;
  reason: string;
}
export type RejectFinalQaRes = ApiResult<FinalQaFlowInstance>;

export interface RequestReworkReq {
  instanceId: EntityId;
  requestedBy: string;
  notes: string;
}
export type RequestReworkRes = ApiResult<FinalQaFlowInstance>;

export const FINAL_QA_FLOW_ENDPOINTS = {
  create: "/api/flows/final-qa/create",
  submit: "/api/flows/final-qa/submit",
  approve: "/api/flows/final-qa/approve",
  reject: "/api/flows/final-qa/reject",
  rework: "/api/flows/final-qa/rework",
  get: "/api/flows/final-qa/get", // expects ?id=
  list: "/api/flows/final-qa/list",
} as const;