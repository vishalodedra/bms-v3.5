
/**
 * Inbound Flow Contract (FLOW-003)
 * Canonical definitions for Material Receipt, Serialization & QC lifecycle.
 * @foundation V34-S3-FLOW-003-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type InboundFlowState =
  | "Received"
  | "Serialized"
  | "QCPending"
  | "Disposition"
  | "Released"
  | "Blocked"
  | "Scrapped";

export type InboundFlowRole = "Stores" | "QA" | "Supervisor";

export interface InboundReceiptDraft {
  poNumber?: string; // Optional for now to support non-PO receipts if needed, but UI will enforce
  grnNumber: string;
  supplierName: string;
  supplierLotNumber?: string; // Added for traceability
  materialCode: string;
  materialDescription?: string;
  quantityReceived: number;
  uom: string;
  receivedDate: IsoDateTime;
  notes?: string;
}

export interface SerializedItem {
  serialNumber: string;
  status: "PENDING_QC" | "PASSED" | "FAILED" | "BLOCKED";
}

export interface InboundFlowInstance {
  flowId: "FLOW-003";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: InboundFlowState;

  receipt: InboundReceiptDraft;
  serializedItems: SerializedItem[];

  qcBy?: string;
  qcAt?: IsoDateTime;
  qcRemarks?: string;

  releasedAt?: IsoDateTime;
  blockedAt?: IsoDateTime;
  scrappedAt?: IsoDateTime;
  scrapReason?: string;
}

// API Contracts
export interface CreateInboundReq {
  receipt: InboundReceiptDraft;
}
export type CreateInboundRes = ApiResult<InboundFlowInstance>;

export interface SerializeItemsReq {
  instanceId: EntityId;
  serials: string[];
}
export type SerializeItemsRes = ApiResult<InboundFlowInstance>;

export interface SubmitForQcReq {
  instanceId: EntityId;
}
export type SubmitForQcRes = ApiResult<InboundFlowInstance>;

export interface CompleteQcReq {
  instanceId: EntityId;
  decision: "PASS" | "FAIL" | "SCRAP";
  quantities?: { pass: number; fail: number };
  itemResults?: { serialNumber: string; status: "PASSED" | "BLOCKED" }[]; // V34-S3-GOV-FP-22: Explicit mapping
  remarks?: string;
  qcUser: string;
}
export type CompleteQcRes = ApiResult<InboundFlowInstance>;

export interface ReleaseInboundReq {
  instanceId: EntityId;
  remarks?: string;
}
export type ReleaseInboundRes = ApiResult<InboundFlowInstance>;

export interface ScrapInboundReq {
  instanceId: EntityId;
  reason: string;
}
export type ScrapInboundRes = ApiResult<InboundFlowInstance>;

export const INBOUND_FLOW_ENDPOINTS = {
  create: "/api/flows/inbound/create",
  serialize: "/api/flows/inbound/serialize",
  submitQc: "/api/flows/inbound/submit-qc",
  completeQc: "/api/flows/inbound/complete-qc",
  release: "/api/flows/inbound/release",
  scrap: "/api/flows/inbound/scrap",
  get: "/api/flows/inbound/get",
  list: "/api/flows/inbound/list",
} as const;
