/**
 * Simulated API Route Registry
 * Initial scaffold with health check, flow registry, and static flow skeletons.
 * @foundation V34-FND-BP-04
 * @foundation V34-FND-BP-06
 * @foundation V34-FND-BP-09
 * @foundation V34-S1-FLOW-001-PP-05
 * @foundation V34-S2-FLOW-002-PP-03
 * @foundation V34-S3-FLOW-003-PP-04
 * @foundation V34-S9-FLOW-004-PP-04
 * @foundation V34-S11-FLOW-005-PP-03
 */

import { route, RouteDef } from "./apiRouter";
import { getFlowRegistry } from "./handlers/flowRegistryHandler";
import { 
  createSkuFlow, 
  submitSkuForReview, 
  reviewSku, 
  approveSku, 
  getSkuFlow, 
  listSkuFlows 
} from "./handlers/skuFlowHandlers";
import {
  createBatchFlow,
  approveBatchFlow,
  startBatchFlow,
  completeBatchFlow,
  cancelBatchFlow,
  getBatchFlow,
  listBatchFlows
} from "./handlers/batchFlowHandlers";
import {
  createInboundFlow,
  serializeInbound,
  submitInboundQc,
  completeInboundQc,
  releaseInbound,
  scrapInbound,
  getInboundFlow,
  listInboundFlows
} from "./handlers/inboundFlowHandlers";
import {
  createFinalQa,
  submitFinalQa,
  approveFinalQa,
  rejectFinalQa,
  reworkFinalQa,
  getFinalQa,
  listFinalQa
} from "./handlers/finalQaFlowHandlers";
import {
  createDispatch,
  approveDispatch,
  dispatchShipment,
  recordDelivery,
  closeDispatch,
  cancelDispatch,
  getDispatch,
  listDispatch
} from "./handlers/dispatchFlowHandlers";

export const SIM_API_ROUTES: RouteDef[] = [
  /**
   * GET /api/health
   * Connectivity check for the in-app simulator.
   */
  route("GET", "EXACT", "/api/health", async () => ({
    status: 200,
    body: {
      ok: true,
      data: {
        status: "ok",
        mode: "sim-inapp",
        timestamp: new Date().toISOString()
      }
    }
  })),

  /**
   * GET /api/flows/registry
   * Returns the list of planned MES Pilot flows.
   */
  route("GET", "EXACT", "/api/flows/registry", getFlowRegistry),

  /**
   * SKU Flow (FLOW-001) - Live Simulated Handlers
   */
  route("POST", "EXACT", "/api/flows/sku/create", createSkuFlow),
  route("POST", "EXACT", "/api/flows/sku/submit", submitSkuForReview),
  route("POST", "EXACT", "/api/flows/sku/review", reviewSku),
  route("POST", "EXACT", "/api/flows/sku/approve", approveSku),
  route("GET", "EXACT", "/api/flows/sku/get", getSkuFlow),
  route("GET", "EXACT", "/api/flows/sku/list", listSkuFlows),

  /**
   * Batch Flow (FLOW-002) - Live Simulated Handlers
   */
  route("POST", "EXACT", "/api/flows/batch/create", createBatchFlow),
  route("POST", "EXACT", "/api/flows/batch/approve", approveBatchFlow),
  route("POST", "EXACT", "/api/flows/batch/start", startBatchFlow),
  route("POST", "EXACT", "/api/flows/batch/complete", completeBatchFlow),
  route("POST", "EXACT", "/api/flows/batch/cancel", cancelBatchFlow),
  route("GET", "EXACT", "/api/flows/batch/get", getBatchFlow),
  route("GET", "EXACT", "/api/flows/batch/list", listBatchFlows),

  /**
   * Inbound Flow (FLOW-003) - Live Simulated Handlers
   */
  route("POST", "EXACT", "/api/flows/inbound/create", createInboundFlow),
  route("POST", "EXACT", "/api/flows/inbound/serialize", serializeInbound),
  route("POST", "EXACT", "/api/flows/inbound/submit-qc", submitInboundQc),
  route("POST", "EXACT", "/api/flows/inbound/complete-qc", completeInboundQc),
  route("POST", "EXACT", "/api/flows/inbound/release", releaseInbound),
  route("POST", "EXACT", "/api/flows/inbound/scrap", scrapInbound),
  route("GET", "EXACT", "/api/flows/inbound/get", getInboundFlow),
  route("GET", "EXACT", "/api/flows/inbound/list", listInboundFlows),

  /**
   * Final QA Flow (FLOW-004) - Live Simulated Handlers
   */
  route("POST", "EXACT", "/api/flows/final-qa/create", createFinalQa),
  route("POST", "EXACT", "/api/flows/final-qa/submit", submitFinalQa),
  route("POST", "EXACT", "/api/flows/final-qa/approve", approveFinalQa),
  route("POST", "EXACT", "/api/flows/final-qa/reject", rejectFinalQa),
  route("POST", "EXACT", "/api/flows/final-qa/rework", reworkFinalQa),
  route("GET", "EXACT", "/api/flows/final-qa/get", getFinalQa),
  route("GET", "EXACT", "/api/flows/final-qa/list", listFinalQa),

  /**
   * Dispatch Flow (FLOW-005) - Live Simulated Handlers
   */
  route("POST", "EXACT", "/api/flows/dispatch/create", createDispatch),
  route("POST", "EXACT", "/api/flows/dispatch/approve", approveDispatch),
  route("POST", "EXACT", "/api/flows/dispatch/dispatch", dispatchShipment),
  route("POST", "EXACT", "/api/flows/dispatch/deliver", recordDelivery),
  route("POST", "EXACT", "/api/flows/dispatch/close", closeDispatch),
  route("POST", "EXACT", "/api/flows/dispatch/cancel", cancelDispatch),
  route("GET", "EXACT", "/api/flows/dispatch/get", getDispatch),
  route("GET", "EXACT", "/api/flows/dispatch/list", listDispatch),
];