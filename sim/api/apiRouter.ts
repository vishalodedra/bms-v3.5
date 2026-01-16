/**
 * In-app API Router Logic
 * Handles matching and dispatching for internal simulated endpoints.
 * @foundation V34-FND-BP-04
 */

import { HttpMethod, ApiRequest, ApiResponse, ApiHandler } from "./apiTypes";

export interface RouteDef {
  method: HttpMethod;
  match: "EXACT" | "PREFIX";
  path: string;
  handler: ApiHandler;
}

/**
 * Route definition helper
 */
export function route(
  method: HttpMethod,
  match: "EXACT" | "PREFIX",
  path: string,
  handler: ApiHandler
): RouteDef {
  return { method, match, path, handler };
}

/**
 * Dispatches an ApiRequest to the first matching route.
 */
export async function dispatch(
  req: ApiRequest,
  routes: RouteDef[]
): Promise<ApiResponse> {
  const match = routes.find((r) => {
    const methodMatch = r.method === req.method;
    if (!methodMatch) return false;

    if (r.match === "EXACT") {
      return req.path === r.path;
    } else {
      return req.path.startsWith(r.path);
    }
  });

  if (match) {
    try {
      return await match.handler(req);
    } catch (err) {
      console.error("[API-SIM] Handler error:", err);
      return {
        status: 500,
        body: {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: err instanceof Error ? err.message : "Simulated handler crashed",
          },
        },
      };
    }
  }

  return {
    status: 404,
    body: {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: `No simulated route for ${req.method} ${req.path}`,
      },
    },
  };
}
