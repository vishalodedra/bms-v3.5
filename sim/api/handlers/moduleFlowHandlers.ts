
/**
 * Module Flow API Handlers (FLOW-006)
 * Simulated backend logic for S5 Module Assembly.
 * @foundation V34-S5-FLOW-006-PP-01
 */

import type { ApiHandler, ApiRequest, ApiResponse } from "../apiTypes";
import { upsertFlow, getFlow, listFlows, getStore } from "../../store/inMemoryStore";
import {
  type ModuleFlowInstance,
  type CreateModuleReq,
  type AddCellsReq,
  type SerializeModuleReq,
  type CompleteModuleReq,
} from "../../../flows/module/moduleFlowContract";
import { BatchFlowInstance, AnyFlowInstance } from "../../../types";

const nowIso = (): string => new Date().toISOString();
const newId = (prefix = "MOD"): string => `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

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
 * POST /api/flows/module/create
 * Starts a new module assembly session for a specific batch.
 */
export const createModuleFlow: ApiHandler = async (req) => {
  const { batchId, skuCode, assemblyStation } = parseBody<CreateModuleReq>(req);
  if (!batchId) return err("BAD_REQUEST", "Batch ID is required");

  // Validate Batch Status
  const store = getStore();
  const batch = Object.values(store.db.flows).find(f => f.instanceId === batchId && f.flowId === 'FLOW-002') as BatchFlowInstance | undefined;
  
  if (!batch) return err("NOT_FOUND", "Batch not found");
  if (batch.state !== "InProgress") return err("BAD_REQUEST", "Batch must be InProgress to start assembly");

  const instance: ModuleFlowInstance = {
    flowId: "FLOW-006",
    instanceId: newId("ASSY"),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "InAssembly",
    draft: {
      batchId,
      skuCode,
      assemblyStation,
      cellSerials: []
    }
  };

  upsertFlow(instance as unknown as AnyFlowInstance);
  return ok(instance);
};

/**
 * POST /api/flows/module/add-cells
 * Maps specific cell serials to the module.
 */
export const addCellsToModule: ApiHandler = async (req) => {
  const { instanceId, cellSerials } = parseBody<AddCellsReq>(req);
  const flow = getFlow(instanceId) as unknown as ModuleFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-006") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "InAssembly") return err("BAD_REQUEST", "Module not in assembly state");

  // In a real system, we would validate:
  // 1. Cells exist in inventory
  // 2. Cells are released (S3)
  // 3. Cells are allocated to this batch (S4)
  // 4. Cells are not used in another module
  
  // For simulation, we append unique cells
  const newCells = cellSerials.filter(c => !flow.draft.cellSerials.includes(c));
  flow.draft.cellSerials.push(...newCells);
  flow.updatedAt = nowIso();

  upsertFlow(flow as unknown as AnyFlowInstance);
  return ok(flow);
};

/**
 * POST /api/flows/module/serialize
 * Generates the unique module ID.
 */
export const serializeModule: ApiHandler = async (req) => {
  const { instanceId } = parseBody<SerializeModuleReq>(req);
  const flow = getFlow(instanceId) as unknown as ModuleFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-006") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "InAssembly") return err("BAD_REQUEST", "Module not in assembly state");
  if (flow.draft.moduleSerial) return err("BAD_REQUEST", "Module already serialized");

  // Generate a Module Serial (Mock logic: PREFIX-YEAR-BATCH-SEQ)
  const batchSuffix = flow.draft.batchId.split('-').pop();
  const uniqueSeq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  flow.draft.moduleSerial = `MOD-2026-${batchSuffix}-${uniqueSeq}`;
  flow.updatedAt = nowIso();

  upsertFlow(flow as unknown as AnyFlowInstance);
  return ok(flow);
};

/**
 * POST /api/flows/module/complete
 * Finalizes assembly.
 */
export const completeModule: ApiHandler = async (req) => {
  const { instanceId } = parseBody<CompleteModuleReq>(req);
  const flow = getFlow(instanceId) as unknown as ModuleFlowInstance | undefined;

  if (!flow || flow.flowId !== "FLOW-006") return err("NOT_FOUND", "Flow not found", 404);
  if (flow.state !== "InAssembly") return err("BAD_REQUEST", "Module not in assembly state");
  if (!flow.draft.moduleSerial) return err("BAD_REQUEST", "Module not serialized");
  if (flow.draft.cellSerials.length === 0) return err("BAD_REQUEST", "No cells mapped");

  flow.state = "PendingQA"; // Move to S6 Input Queue
  flow.completedAt = nowIso();
  flow.updatedAt = nowIso();

  upsertFlow(flow as unknown as AnyFlowInstance);
  return ok(flow);
};

/**
 * GET /api/flows/module/get?id=...
 */
export const getModuleFlow: ApiHandler = async (req) => {
  const id = req.query?.["id"];
  if (!id) return err("BAD_REQUEST", "Missing id parameter");

  const flow = getFlow(id);
  if (!flow || flow.flowId !== "FLOW-006") return err("NOT_FOUND", "Module flow not found", 404);

  return ok(flow);
};

/**
 * GET /api/flows/module/list
 */
export const listModuleFlows: ApiHandler = async () => {
  const flows = listFlows("FLOW-006");
  return ok(flows);
};
