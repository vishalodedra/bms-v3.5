/**
 * Flow Static Skeleton Handlers
 * Provides placeholder responses for planned flow endpoints.
 * @foundation V34-FND-BP-09
 */

import type { ApiHandler } from "../apiTypes";
import type { ApiResult } from "../../../types";

const STATIC_MSG = "Static skeleton. Store not wired yet.";

/**
 * GET /api/flows/sku (FLOW-001)
 */
export const getSkuFlowStatic: ApiHandler = async () => ({
  status: 200,
  body: {
    ok: true,
    data: { flowId: "FLOW-001", status: "PLANNED", message: STATIC_MSG }
  }
});

/**
 * GET /api/flows/batch (FLOW-002)
 */
export const getBatchFlowStatic: ApiHandler = async () => ({
  status: 200,
  body: {
    ok: true,
    data: { flowId: "FLOW-002", status: "PLANNED", message: STATIC_MSG }
  }
});

/**
 * GET /api/flows/inbound (FLOW-003)
 */
export const getInboundFlowStatic: ApiHandler = async () => ({
  status: 200,
  body: {
    ok: true,
    data: { flowId: "FLOW-003", status: "PLANNED", message: STATIC_MSG }
  }
});

/**
 * GET /api/flows/final-qa (FLOW-004)
 */
export const getFinalQaFlowStatic: ApiHandler = async () => ({
  status: 200,
  body: {
    ok: true,
    data: { flowId: "FLOW-004", status: "PLANNED", message: STATIC_MSG }
  }
});

/**
 * GET /api/flows/dispatch (FLOW-005)
 */
export const getDispatchFlowStatic: ApiHandler = async () => ({
  status: 200,
  body: {
    ok: true,
    data: { flowId: "FLOW-005", status: "PLANNED", message: STATIC_MSG }
  }
});
