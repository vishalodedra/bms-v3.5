/**
 * Final QA Flow API Handlers (FLOW-004)
 * Simulated backend logic with in-memory store.
 * @foundation V34-S9-FLOW-004-PP-04
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import { upsertFlow, getFlow, listFlows } from "../../store/inMemoryStore";
import {
  type FinalQaFlowInstance,
  type CreateFinalQaReq,
  type ApproveFinalQaReq,
  type RejectFinalQaReq,
  type RequestReworkReq,
  type SubmitFinalQaReq,
} from "../../../flows/finalQa";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "QA"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

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
 * POST /api/flows/final-qa/create
 */
export const createFinalQa: ApiHandler = async (req) => {
  const { draft } = parseBody<CreateFinalQaReq>(req);
  if (!draft?.packId) return err("BAD_REQUEST", "Pack ID is required");

  const instance: FinalQaFlowInstance = {
    flowId: "FLOW-004",
    instanceId: newId("FQA"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Pending",
    draft
  };

  upsertFlow(instance as any);
  return ok(instance);
};

/**
 * POST /api/flows/final-qa/submit
 */
export const submitFinalQa: ApiHandler = async (req) => {
  const { instanceId } = parseBody<SubmitFinalQaReq>(req);
  const flow = getFlow(instanceId) as FinalQaFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-004") return err("NOT_FOUND", "Flow not found", 404);
  
  flow.updatedAt = nowIso();
  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/final-qa/approve
 */
export const approveFinalQa: ApiHandler = async (req) => {
  const { instanceId, approvedBy } = parseBody<ApproveFinalQaReq>(req);
  const flow = getFlow(instanceId) as FinalQaFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-004") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "Pending") return err("BAD_REQUEST", "Flow not in Pending state");

  flow.state = "Approved";
  flow.approvedBy = approvedBy;
  flow.approvedAt = nowIso();
  flow.batteryId = `BATT-2026-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/final-qa/reject
 */
export const rejectFinalQa: ApiHandler = async (req) => {
  const { instanceId, rejectedBy, reason } = parseBody<RejectFinalQaReq>(req);
  const flow = getFlow(instanceId) as FinalQaFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-004") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "Pending") return err("BAD_REQUEST", "Flow not in Pending state");

  flow.state = "Rejected";
  flow.rejectedBy = rejectedBy;
  flow.rejectedAt = nowIso();
  flow.rejectionReason = reason;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/final-qa/rework
 */
export const reworkFinalQa: ApiHandler = async (req) => {
  const { instanceId, requestedBy, notes } = parseBody<RequestReworkReq>(req);
  const flow = getFlow(instanceId) as FinalQaFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-004") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "Pending") return err("BAD_REQUEST", "Flow not in Pending state");

  flow.state = "ReworkRequested";
  flow.reworkRequestedBy = requestedBy;
  flow.reworkRequestedAt = nowIso();
  flow.reworkNotes = notes;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * GET /api/flows/final-qa/get?id=...
 */
export const getFinalQa: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow || flow.flowId !== "FLOW-004") return err("NOT_FOUND", "Flow not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/final-qa/list
 */
export const listFinalQa: ApiHandler = async () => {
  const flows = listFlows("FLOW-004");
  return ok(flows);
};
