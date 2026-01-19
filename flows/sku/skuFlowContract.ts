
/**
 * SKU Flow Contract (FLOW-001)
 * Canonical definitions for SKU Creation & Blueprint Approval lifecycle.
 * @foundation V34-S1-FLOW-001-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type SkuFlowState = "Draft" | "Review" | "Approved" | "Active" | "Rejected";

export type SkuFlowRole = "Maker" | "Checker" | "Approver";

export interface SkuDraft {
  skuCode: string;
  skuName: string;
  chemistry?: string;           // e.g., LFP, NMC
  formFactor?: string;          // pouch/prismatic/cylindrical
  nominalVoltage?: number;
  capacityAh?: number;
  cellsPerModule: number;       // V34-S1-SKU-DEF-41: Mandatory for manufacturing logic
  notes?: string;
}

export interface BlueprintRef {
  blueprintId: EntityId;
  blueprintName: string;
  version?: string;
}

export interface SkuFlowInstance {
  flowId: "FLOW-001";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: SkuFlowState;

  // business fields
  draft: SkuDraft;
  blueprint?: BlueprintRef;

  // workflow/audit fields
  submittedBy?: string;         // userId/display
  submittedAt?: IsoDateTime;
  reviewedBy?: string;
  reviewedAt?: IsoDateTime;
  approvedBy?: string;
  approvedAt?: IsoDateTime;
  rejectedBy?: string;
  rejectedAt?: IsoDateTime;
  rejectionReason?: string;
}

// API Contracts
export interface CreateSkuFlowReq {
  draft: SkuDraft;
}
export type CreateSkuFlowRes = ApiResult<SkuFlowInstance>;

export interface SubmitSkuForReviewReq {
  instanceId: EntityId;
  comment?: string;
}
export type SubmitSkuForReviewRes = ApiResult<SkuFlowInstance>;

export interface ReviewSkuReq {
  instanceId: EntityId;
  decision: "SEND_BACK" | "FORWARD";
  comment?: string;
}
export type ReviewSkuRes = ApiResult<SkuFlowInstance>;

export interface ApproveSkuReq {
  instanceId: EntityId;
  decision: "APPROVE" | "REJECT";
  comment?: string;
  reason?: string;
}
export type ApproveSkuRes = ApiResult<SkuFlowInstance>;

export const SKU_FLOW_ENDPOINTS = {
  create: "/api/flows/sku/create",
  submit: "/api/flows/sku/submit",
  review: "/api/flows/sku/review",
  approve: "/api/flows/sku/approve",
  get: "/api/flows/sku/get",           // expects ?id=
  list: "/api/flows/sku/list",
} as const;
