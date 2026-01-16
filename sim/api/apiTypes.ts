/**
 * In-app API Simulation Types
 * Defines the contract for the internal routing system.
 * @foundation V34-FND-BP-04
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequest {
  method: HttpMethod;
  path: string; // e.g. "/api/flows/registry"
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number; // 200, 201, 400, 404, 500
  headers?: Record<string, string>;
  body?: unknown;
}

export type ApiHandler = (req: ApiRequest) => Promise<ApiResponse> | ApiResponse;
