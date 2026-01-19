
/**
 * Module Flow Contract (FLOW-006)
 * Definitions for Module Assembly & Serialization (S5).
 * @foundation V34-S5-FLOW-006-BP-01
 */

import type { ApiResult, EntityId, IsoDateTime } from "../../types";

export type ModuleFlowState = "InAssembly" | "Completed" | "PendingQA";

export interface ModuleDraft {
  batchId: string;
  skuCode: string;
  cellSerials: string[]; // List of allocated cells being consumed
  moduleSerial?: string;
  assemblyStation?: string;
}

export interface ModuleFlowInstance {
  flowId: "FLOW-006";
  instanceId: EntityId;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  state: ModuleFlowState;
  
  draft: ModuleDraft;
  
  completedAt?: IsoDateTime;
  assembledBy?: string;
}

// API Contracts
export interface CreateModuleReq {
  batchId: string;
  skuCode: string;
  assemblyStation: string;
}
export type CreateModuleRes = ApiResult<ModuleFlowInstance>;

export interface AddCellsReq {
  instanceId: EntityId;
  cellSerials: string[];
}
export type AddCellsRes = ApiResult<ModuleFlowInstance>;

export interface SerializeModuleReq {
  instanceId: EntityId;
}
export type SerializeModuleRes = ApiResult<ModuleFlowInstance>;

export interface CompleteModuleReq {
  instanceId: EntityId;
}
export type CompleteModuleRes = ApiResult<ModuleFlowInstance>;

export const MODULE_FLOW_ENDPOINTS = {
  create: "/api/flows/module/create",
  addCells: "/api/flows/module/add-cells",
  serialize: "/api/flows/module/serialize",
  complete: "/api/flows/module/complete",
  get: "/api/flows/module/get",
  list: "/api/flows/module/list",
} as const;
