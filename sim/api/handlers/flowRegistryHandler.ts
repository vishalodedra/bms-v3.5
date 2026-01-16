/**
 * Flow Registry API Handler
 * Returns the static flow registry definitions.
 * @foundation V34-FND-BP-06
 */

import { FLOW_REGISTRY_SEED } from "../../flowRegistrySeed";
import type { ApiHandler } from "../apiTypes";
import type { ApiResult, FlowRegistry } from "../../../types";

/**
 * GET /api/flows/registry
 */
export const getFlowRegistry: ApiHandler = async () => {
  const data: FlowRegistry = FLOW_REGISTRY_SEED;
  const body: ApiResult<FlowRegistry> = { ok: true, data };
  return { status: 200, body };
};
