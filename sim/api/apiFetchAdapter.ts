/**
 * apiFetch Adapter
 * Bridges standard fetch(url, init) calls to the internal ApiRouter.
 * @foundation V34-FND-BP-05
 */

import type { ApiRequest, ApiResponse, HttpMethod } from "./apiTypes";
import { dispatch } from "./apiRouter";
import { SIM_API_ROUTES } from "./apiRoutes";

/**
 * Parses URL search params into a record
 */
function parseUrl(input: string): { path: string; query: Record<string, string> } {
  const url = new URL(input, window.location.origin);
  const query: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    query[key] = val;
  });
  return { path: url.pathname, query };
}

/**
 * Simulates a fetch response by routing through the internal dispatcher.
 */
export async function simulateFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlStr: string;
  let method: string = "GET";

  // Resolve URL and Method
  if (typeof input === "string") {
    urlStr = input;
    method = init?.method ?? "GET";
  } else if (input instanceof URL) {
    urlStr = input.toString();
    method = init?.method ?? "GET";
  } else {
    urlStr = input.url;
    method = init?.method ?? input.method ?? "GET";
  }

  const { path, query } = parseUrl(urlStr);

  const req: ApiRequest = {
    method: method.toUpperCase() as HttpMethod,
    path,
    query,
    headers: init?.headers as Record<string, string>,
    body: init?.body
  };

  console.debug(`[API-SIM] Dispatching: ${req.method} ${req.path}`);
  const apiRes = await dispatch(req, SIM_API_ROUTES);

  return new Response(JSON.stringify(apiRes.body ?? null), {
    status: apiRes.status,
    headers: {
      "content-type": "application/json",
      ...(apiRes.headers || {})
    }
  });
}
