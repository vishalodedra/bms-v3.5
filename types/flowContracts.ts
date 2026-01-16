/**
 * V3.4 Flow Contract Types
 * Shared primitives and structures for MES Pilot flows.
 * @foundation V34-FND-BP-02
 */

// A) Shared Primitives
export type FlowId = "FLOW-001" | "FLOW-002" | "FLOW-003" | "FLOW-004" | "FLOW-005";
export type FlowStatus = "PLANNED" | "WIRED" | "STABLE";
export type IsoDateTime = string;
export type EntityId = string;

// B) Standard API Envelope Types
export interface ApiOk<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErr {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiOk<T> | ApiErr;

// C) Flow Registry Contract
export interface FlowRegistryItem {
  flowId: FlowId;
  sopStage: string;
  title: string;
  primaryRoles: string[];
  stateModel: string;
  plannedEndpoints: string[];
  status: FlowStatus;
}

export type FlowRegistry = FlowRegistryItem[];

// D) Generic Flow Instance Contract
export interface FlowInstanceBase {
  flowId: FlowId;
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: string;
  ownerRole?: string;
  tags?: string[];
}

// E) Minimal Per-Flow States
// FLOW-001: SKU Creation & Blueprint Approval
export type SkuFlowState = "Draft" | "Review" | "Approved" | "Active";
export interface SkuFlowInstance extends FlowInstanceBase {
  flowId: "FLOW-001";
  state: SkuFlowState;
  skuCode?: string;
  blueprintId?: string;
}

// FLOW-002: Batch / Work Order Creation
export type BatchFlowState = "Draft" | "Approved" | "InProgress" | "Closed";
export interface BatchFlowInstance extends FlowInstanceBase {
  flowId: "FLOW-002";
  state: BatchFlowState;
  batchId?: string;
  workOrderId?: string;
}

// FLOW-003: Inbound Receipt + Serialization + QC
export type InboundFlowState = "Received" | "QCPending" | "Released" | "Blocked" | "Scrapped";
export interface InboundFlowInstance extends FlowInstanceBase {
  flowId: "FLOW-003";
  state: InboundFlowState;
  receiptId?: string;
  lotId?: string;
}

// FLOW-004: Final Pack QA
export type FinalQaFlowState = "Pending" | "Approved" | "Rejected";
export interface FinalQaFlowInstance extends FlowInstanceBase {
  flowId: "FLOW-004";
  state: FinalQaFlowState;
  packId?: string;
  batteryId?: string;
}

// FLOW-005: Dispatch Authorization -> Execution
export type DispatchFlowState = "Draft" | "Approved" | "Dispatched" | "Delivered" | "Closed";
export interface DispatchFlowInstance extends FlowInstanceBase {
  flowId: "FLOW-005";
  state: DispatchFlowState;
  consignmentId?: string;
  invoiceId?: string;
}

export type AnyFlowInstance = 
  | SkuFlowInstance 
  | BatchFlowInstance 
  | InboundFlowInstance 
  | FinalQaFlowInstance 
  | DispatchFlowInstance;
