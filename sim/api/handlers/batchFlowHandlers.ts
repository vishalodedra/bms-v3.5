/**
 * Batch Flow API Handlers
 * Simulated backend logic for FLOW-002.
 * @foundation V34-S2-FLOW-002-PP-03
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import { upsertFlow, getFlow, listFlows } from "../../store/inMemoryStore";
import {
  type BatchFlowInstance,
  type CreateBatchReq,
  type ApproveBatchReq,
  type StartBatchReq,
  type CompleteBatchReq,
  type CancelBatchReq,
  nextStateOnApprove,
  nextStateOnStart,
  nextStateOnComplete,
  nextStateOnCancel,
} from "../../../flows/batch";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "BAT"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

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
 * POST /api/flows/batch/create
 */
export const createBatchFlow: ApiHandler = async (req) => {
  const { draft } = parseBody<CreateBatchReq>(req);
  if (!draft?.batchName || !draft?.skuCode) return err("BAD_REQUEST", "Batch name and SKU code are required");

  const instance: BatchFlowInstance = {
    flowId: "FLOW-002",
    instanceId: newId("BAT"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Draft",
    draft
  };

  upsertFlow(instance as any);
  return ok(instance);
};

/**
 * POST /api/flows/batch/approve
 */
export const approveBatchFlow: ApiHandler = async (req) => {
  const { instanceId, approvedBy } = parseBody<ApproveBatchReq>(req);
  const flow = getFlow(instanceId) as BatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-002") return err("NOT_FOUND", "Batch instance not found", 404);
  if (flow.state !== "Draft") return err("BAD_REQUEST", "Batch must be in Draft state to approve");

  flow.state = nextStateOnApprove();
  flow.approvedBy = approvedBy;
  flow.approvedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/batch/start
 */
export const startBatchFlow: ApiHandler = async (req) => {
  const { instanceId } = parseBody<StartBatchReq>(req);
  const flow = getFlow(instanceId) as BatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-002") return err("NOT_FOUND", "Batch instance not found", 404);
  if (flow.state !== "Approved") return err("BAD_REQUEST", "Batch must be Approved to start");

  flow.state = nextStateOnStart();
  flow.startedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/batch/complete
 */
export const completeBatchFlow: ApiHandler = async (req) => {
  const { instanceId } = parseBody<CompleteBatchReq>(req);
  const flow = getFlow(instanceId) as BatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-002") return err("NOT_FOUND", "Batch instance not found", 404);
  if (flow.state !== "InProgress") return err("BAD_REQUEST", "Batch must be InProgress to complete");

  flow.state = nextStateOnComplete();
  flow.completedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/batch/cancel
 */
export const cancelBatchFlow: ApiHandler = async (req) => {
  const { instanceId, reason } = parseBody<CancelBatchReq>(req);
  const flow = getFlow(instanceId) as BatchFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-002") return err("NOT_FOUND", "Batch instance not found", 404);

  flow.state = nextStateOnCancel();
  flow.cancelledAt = nowIso();
  flow.cancellationReason = reason;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * GET /api/flows/batch/get?id=...
 */
export const getBatchFlow: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow || flow.flowId !== "FLOW-002") return err("NOT_FOUND", "Batch not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/batch/list
 */
export const listBatchFlows: ApiHandler = async () => {
  const flows = listFlows("FLOW-002");
  return ok(flows);
};