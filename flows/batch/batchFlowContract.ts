/**
 * Batch Flow Contract (FLOW-002)
 * Canonical definitions for Batch / Work Order lifecycle.
 * @foundation V34-S2-FLOW-002-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type BatchFlowState = "Draft" | "Approved" | "InProgress" | "Completed" | "Cancelled";

export type BatchFlowRole = "Planner" | "Supervisor" | "Operator";

export interface BatchDraft {
  batchName: string;
  skuCode: string;
  plannedQuantity: number;
  plannedStartDate?: IsoDateTime;
  plannedEndDate?: IsoDateTime;
  notes?: string;
}

export interface BatchFlowInstance {
  flowId: "FLOW-002";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: BatchFlowState;
  draft: BatchDraft;

  approvedBy?: string;
  approvedAt?: IsoDateTime;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  cancelledAt?: IsoDateTime;
  cancellationReason?: string;
}

// API Contracts
export interface CreateBatchReq {
  draft: BatchDraft;
}
export type CreateBatchRes = ApiResult<BatchFlowInstance>;

export interface ApproveBatchReq {
  instanceId: EntityId;
  approvedBy: string;
}
export type ApproveBatchRes = ApiResult<BatchFlowInstance>;

export interface StartBatchReq {
  instanceId: EntityId;
}
export type StartBatchRes = ApiResult<BatchFlowInstance>;

export interface CompleteBatchReq {
  instanceId: EntityId;
}
export type CompleteBatchRes = ApiResult<BatchFlowInstance>;

export interface CancelBatchReq {
  instanceId: EntityId;
  reason: string;
}
export type CancelBatchRes = ApiResult<BatchFlowInstance>;

export const BATCH_FLOW_ENDPOINTS = {
  create: "/api/flows/batch/create",
  approve: "/api/flows/batch/approve",
  start: "/api/flows/batch/start",
  complete: "/api/flows/batch/complete",
  cancel: "/api/flows/batch/cancel",
  get: "/api/flows/batch/get",
  list: "/api/flows/batch/list",
} as const;