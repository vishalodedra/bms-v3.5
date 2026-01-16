/**
 * Dispatch Flow API Handlers (FLOW-005)
 * Simulated backend logic with in-memory store.
 * @foundation V34-S11-FLOW-005-PP-03
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import { upsertFlow, getFlow, listFlows } from "../../store/inMemoryStore";
import {
  type DispatchFlowInstance,
  type CreateDispatchReq,
  type ApproveDispatchReq,
  type DispatchShipmentReq,
  type RecordDeliveryReq,
  type CloseDispatchReq,
  type CancelDispatchReq,
} from "../../../flows/dispatch";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "DIS"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

function parseBody<T>(req: ApiRequest): T {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  return req.body as T;
}

const err = (code: string, message: string, status = 400): ApiResponse => ({
  status,
  body: { ok: false, error: { code, message } }
});

const ok = (data: any): ApiResponse => ({
  status: 200,
  body: { ok: true, data }
});

/**
 * POST /api/flows/dispatch/create
 */
export const createDispatch: ApiHandler = async (req) => {
  const { draft } = parseBody<CreateDispatchReq>(req);
  if (!draft?.customerName) return err("BAD_REQUEST", "Customer Name is required");

  const instance: DispatchFlowInstance = {
    flowId: "FLOW-005",
    instanceId: newId("CN"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Draft",
    draft: {
      ...draft,
      consignmentId: newId("CN")
    }
  };

  upsertFlow(instance as any);
  return ok(instance);
};

/**
 * POST /api/flows/dispatch/approve
 */
export const approveDispatch: ApiHandler = async (req) => {
  const { instanceId, approvedBy, invoiceNumber } = parseBody<ApproveDispatchReq>(req);
  const flow = getFlow(instanceId) as DispatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);
  if (flow.state !== "Draft") return err("BAD_REQUEST", "Flow must be in Draft state");

  flow.state = "Approved";
  flow.approvedBy = approvedBy;
  flow.approvedAt = nowIso();
  flow.draft.invoiceNumber = invoiceNumber || flow.draft.invoiceNumber;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/dispatch/dispatch
 */
export const dispatchShipment: ApiHandler = async (req) => {
  const { instanceId, dispatchedBy, transporter, vehicleNo, driverName } = parseBody<DispatchShipmentReq>(req);
  const flow = getFlow(instanceId) as DispatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);
  if (flow.state !== "Approved") return err("BAD_REQUEST", "Flow must be Approved to dispatch");

  flow.state = "Dispatched";
  flow.dispatchedBy = dispatchedBy;
  flow.dispatchedAt = nowIso();
  flow.draft.transporter = transporter;
  flow.draft.vehicleNo = vehicleNo;
  flow.draft.driverName = driverName;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/dispatch/deliver
 */
export const recordDelivery: ApiHandler = async (req) => {
  const { instanceId, handoverProof, deliveredAt } = parseBody<RecordDeliveryReq>(req);
  const flow = getFlow(instanceId) as DispatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);
  if (flow.state !== "Dispatched") return err("BAD_REQUEST", "Flow must be Dispatched to deliver");

  flow.state = "Delivered";
  flow.deliveredAt = deliveredAt || nowIso();
  flow.draft.handoverProof = handoverProof;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/dispatch/close
 */
export const closeDispatch: ApiHandler = async (req) => {
  const { instanceId, closedBy } = parseBody<CloseDispatchReq>(req);
  const flow = getFlow(instanceId) as DispatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);
  if (flow.state !== "Delivered") return err("BAD_REQUEST", "Flow must be Delivered to close");

  flow.state = "Closed";
  flow.closedBy = closedBy;
  flow.closedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/dispatch/cancel
 */
export const cancelDispatch: ApiHandler = async (req) => {
  const { instanceId, cancelledBy, reason } = parseBody<CancelDispatchReq>(req);
  const flow = getFlow(instanceId) as DispatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);

  flow.state = "Cancelled";
  flow.cancelledBy = cancelledBy;
  flow.cancelledAt = nowIso();
  flow.cancellationReason = reason;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * GET /api/flows/dispatch/get?id=...
 */
export const getDispatch: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow || flow.flowId !== "FLOW-005") return err("NOT_FOUND", "Consignment not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/dispatch/list
 */
export const listDispatch: ApiHandler = async () => {
  const flows = listFlows("FLOW-005");
  return ok(flows);
};
