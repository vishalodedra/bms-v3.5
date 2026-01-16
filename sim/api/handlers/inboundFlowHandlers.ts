
/**
 * Inbound Flow API Handlers
 * Simulated backend logic for FLOW-003.
 * @foundation V34-S3-FLOW-003-PP-04
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import { upsertFlow, getFlow, listFlows } from "../../store/inMemoryStore";
import {
  type InboundFlowInstance,
  type CreateInboundReq,
  type SerializeItemsReq,
  type CompleteQcReq,
  type ReleaseInboundReq,
  type ScrapInboundReq,
  nextStateOnSerialize,
  nextStateOnSubmitQc,
  nextStateOnQcDecision,
  nextStateOnRelease,
  nextStateOnScrap,
} from "../../../flows/inbound";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "INB"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

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
 * POST /api/flows/inbound/create
 */
export const createInboundFlow: ApiHandler = async (req) => {
  const { receipt } = parseBody<CreateInboundReq>(req);
  if (!receipt?.grnNumber) return err("BAD_REQUEST", "GRN Number is required");

  const instance: InboundFlowInstance = {
    flowId: "FLOW-003",
    instanceId: newId("INB"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Received",
    receipt,
    serializedItems: []
  };

  upsertFlow(instance as any);
  return ok(instance);
};

/**
 * POST /api/flows/inbound/serialize
 */
export const serializeInbound: ApiHandler = async (req) => {
  const { instanceId, serials } = parseBody<SerializeItemsReq>(req);
  const flow = getFlow(instanceId) as InboundFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "Received") return err("BAD_REQUEST", "Flow not in Received state");

  flow.state = nextStateOnSerialize();
  flow.serializedItems = serials.map(sn => ({ serialNumber: sn, status: "PENDING_QC" }));
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/inbound/submit-qc
 */
export const submitInboundQc: ApiHandler = async (req) => {
  const { instanceId } = parseBody<{ instanceId: string }>(req);
  const flow = getFlow(instanceId) as InboundFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "Serialized") return err("BAD_REQUEST", "Flow must be Serialized to submit for QC");

  flow.state = nextStateOnSubmitQc();
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/inbound/complete-qc
 */
export const completeInboundQc: ApiHandler = async (req) => {
  const { instanceId, decision, remarks, qcUser, quantities } = parseBody<CompleteQcReq>(req);
  const flow = getFlow(instanceId) as InboundFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "QCPending") return err("BAD_REQUEST", "Flow not in QC Pending state");

  flow.state = nextStateOnQcDecision(decision);
  flow.qcBy = qcUser;
  flow.qcAt = nowIso();
  flow.qcRemarks = remarks;
  
  // Update serial items based on explicit pass/fail counts if provided
  if (quantities) {
      const passLimit = quantities.pass;
      flow.serializedItems = flow.serializedItems.map((item, index) => {
          // If we have passed items remaining, mark as passed
          // We just take the first N items as Passed for the simulation
          if (index < passLimit) {
              return { ...item, status: "PASSED" };
          }
          // The rest are Failed/Blocked
          return { ...item, status: "BLOCKED" };
      });
  } else {
      // Fallback if no quantities provided (e.g. legacy call or full block)
      flow.serializedItems = flow.serializedItems.map(item => ({
        ...item,
        status: decision === "PASS" ? "PASSED" : "BLOCKED"
      }));
  }

  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/inbound/release
 */
export const releaseInbound: ApiHandler = async (req) => {
  const { instanceId, remarks } = parseBody<ReleaseInboundReq>(req);
  const flow = getFlow(instanceId) as InboundFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Flow not found", 404);
  
  flow.state = nextStateOnRelease();
  flow.releasedAt = nowIso();
  flow.qcRemarks = remarks || flow.qcRemarks;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * POST /api/flows/inbound/scrap
 */
export const scrapInbound: ApiHandler = async (req) => {
  const { instanceId, reason } = parseBody<ScrapInboundReq>(req);
  const flow = getFlow(instanceId) as InboundFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Flow not found", 404);

  flow.state = nextStateOnScrap();
  flow.scrappedAt = nowIso();
  flow.scrapReason = reason;
  flow.updatedAt = nowIso();

  upsertFlow(flow as any);
  return ok(flow);
};

/**
 * GET /api/flows/inbound/get?id=...
 */
export const getInboundFlow: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow || flow.flowId !== "FLOW-003") return err("NOT_FOUND", "Inbound flow not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/inbound/list
 */
export const listInboundFlows: ApiHandler = async () => {
  const flows = listFlows("FLOW-003");
  return ok(flows);
};
