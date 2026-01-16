/**
 * Dispatch & Custody Flow Contract (FLOW-005)
 * Canonical definitions for S11 Outbound Logistics & Custody Transfer.
 * @foundation V34-S11-FLOW-005-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type DispatchFlowState = 
  | "Draft" 
  | "Approved" 
  | "Dispatched" 
  | "Delivered" 
  | "Closed" 
  | "Cancelled";

export type DispatchRole = "SCM" | "Finance" | "Logistics";

export interface DispatchItem {
  batteryId: string;
  skuCode: string;
  qty: number;
}

export interface DispatchDraft {
  consignmentId: string;
  customerName: string;
  destination: string;
  items: DispatchItem[];
  invoiceNumber?: string;
  transporter?: string;
  vehicleNo?: string;
  driverName?: string;
  driverContact?: string;
  handoverProof?: string; // OTP / signature / POD note ref
}

export interface DispatchFlowInstance {
  flowId: "FLOW-005";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: DispatchFlowState;
  
  draft: DispatchDraft;

  approvedBy?: string;
  approvedAt?: IsoDateTime;
  
  dispatchedBy?: string;
  dispatchedAt?: IsoDateTime;
  
  deliveredAt?: IsoDateTime;
  podAcknowledgedBy?: string;
  
  closedBy?: string;
  closedAt?: IsoDateTime;
  
  cancelledBy?: string;
  cancelledAt?: IsoDateTime;
  cancellationReason?: string;
}

// API Payloads
export interface CreateDispatchReq {
  draft: DispatchDraft;
}
export type CreateDispatchRes = ApiResult<DispatchFlowInstance>;

export interface ApproveDispatchReq {
  instanceId: EntityId;
  approvedBy: string;
  invoiceNumber?: string;
}
export type ApproveDispatchRes = ApiResult<DispatchFlowInstance>;

export interface DispatchShipmentReq {
  instanceId: EntityId;
  dispatchedBy: string;
  transporter: string;
  vehicleNo: string;
  driverName: string;
}
export type DispatchShipmentRes = ApiResult<DispatchFlowInstance>;

export interface RecordDeliveryReq {
  instanceId: EntityId;
  handoverProof: string;
  deliveredAt: IsoDateTime;
}
export type RecordDeliveryRes = ApiResult<DispatchFlowInstance>;

export interface CloseDispatchReq {
  instanceId: EntityId;
  closedBy: string;
}
export type CloseDispatchRes = ApiResult<DispatchFlowInstance>;

export interface CancelDispatchReq {
  instanceId: EntityId;
  cancelledBy: string;
  reason: string;
}
export type CancelDispatchRes = ApiResult<DispatchFlowInstance>;

export const DISPATCH_FLOW_ENDPOINTS = {
  create: "/api/flows/dispatch/create",
  approve: "/api/flows/dispatch/approve",
  dispatch: "/api/flows/dispatch/dispatch",
  deliver: "/api/flows/dispatch/deliver",
  close: "/api/flows/dispatch/close",
  cancel: "/api/flows/dispatch/cancel",
  get: "/api/flows/dispatch/get", // expects ?id=
  list: "/api/flows/dispatch/list",
} as const;