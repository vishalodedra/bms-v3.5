/**
 * SKU Flow API Handlers
 * Simulated backend logic for FLOW-001.
 * @foundation V34-S1-FLOW-001-PP-05
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import type { ApiResult } from "../../../types";
import { upsertFlow, getFlow, listFlows } from "../../store/inMemoryStore";
import {
  type CreateSkuFlowReq,
  type SubmitSkuForReviewReq,
  type ReviewSkuReq,
  type ApproveSkuReq,
  type SkuFlowInstance,
  type SkuFlowState,
  nextStateOnSubmit,
  nextStateOnReview,
  nextStateOnApprove,
} from "../../../flows/sku";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "SKU"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

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
 * POST /api/flows/sku/create
 */
export const createSkuFlow: ApiHandler = async (req) => {
  const { draft } = parseBody<CreateSkuFlowReq>(req);
  if (!draft?.skuCode) return err("BAD_REQUEST", "skuCode is required");

  const instance: SkuFlowInstance = {
    flowId: "FLOW-001",
    instanceId: newId("SKU"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Draft",
    draft
  };

  upsertFlow(instance as any);
  return ok(instance);
};

/**
 * POST /api/flows/sku/submit
 */
export const submitSkuForReview: ApiHandler = async (req) => {
  const { instanceId } = parseBody<SubmitSkuForReviewReq>(req);
  const flow = getFlow(instanceId) as SkuFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-001") return err("NOT_FOUND", "Flow instance not found", 404);
  if (flow.state !== "Draft" && flow.state !== "Rejected") {
    return err("BAD_REQUEST", `Invalid state for submission: ${flow.state}`);
  }

  flow.state = nextStateOnSubmit();
  flow.submittedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/sku/review
 */
export const reviewSku: ApiHandler = async (req) => {
  const { instanceId, decision, comment } = parseBody<ReviewSkuReq>(req);
  const flow = getFlow(instanceId) as SkuFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-001") return err("NOT_FOUND", "Flow instance not found", 404);
  if (flow.state !== "Review") return err("BAD_REQUEST", "Flow not in Review state");

  flow.state = nextStateOnReview(decision);
  flow.reviewedAt = nowIso();
  flow.updatedAt = nowIso();
  if (comment) flow.rejectionReason = comment; // reuse field for simple sim

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/sku/approve
 */
export const approveSku: ApiHandler = async (req) => {
  const { instanceId, decision, reason } = parseBody<ApproveSkuReq>(req);
  const flow = getFlow(instanceId) as SkuFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-001") return err("NOT_FOUND", "Flow instance not found", 404);
  // Fast-track allowed: Approve can act on Review or Approved
  if (flow.state !== "Review" && flow.state !== "Approved") {
    return err("BAD_REQUEST", "Flow not in Review or Approved state");
  }

  flow.state = nextStateOnApprove(decision);
  flow.updatedAt = nowIso();

  if (decision === "APPROVE") {
    flow.approvedAt = nowIso();
  } else {
    flow.rejectedAt = nowIso();
    flow.rejectionReason = reason;
  }

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * GET /api/flows/sku/get?id=...
 */
export const getSkuFlow: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow) return err("NOT_FOUND", "Flow not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/sku/list
 */
export const listSkuFlows: ApiHandler = async () => {
  const flows = listFlows("FLOW-001");
  return ok(flows);
};
