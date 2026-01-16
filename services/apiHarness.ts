/**
 * V3.4 API Interceptor Harness
 * Provides an exported apiFetch wrapper instead of patching window.fetch.
 * Required for compatibility with AI Studio sandbox.
 * @hotfix V34-HOTFIX-BP-00
 * @foundation V34-FND-BP-05
 */

import { simulateFetch } from '../sim/api/apiFetchAdapter';

export type ApiFetch = typeof fetch;

const nativeFetch: ApiFetch = (...args) => fetch(...args);

/**
 * apiFetch Wrapper
 * Use this instead of global fetch for MES Pilot flow calls.
 */
export const apiFetch: ApiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : 
                 input instanceof URL ? input.toString() : 
                 input.url;

  const url = new URL(urlStr, window.location.origin);

  // Route any /api path to the internal simulation router
  if (url.pathname.startsWith('/api/')) {
    return simulateFetch(input, init);
  }

  // Pass through all other requests to native fetch
  return nativeFetch(input, init);
};

/**
 * NO-OP initializer for backward compatibility.
 * Global patching is blocked by sandbox environment.
 */
export const initApiHarness = () => {
  console.info('BPM-OS: API Harness initialized in wrapper-mode (Sandbox restricted global fetch).');
  return { installed: false, reason: "Sandbox blocks overriding window.fetch. Use apiFetch wrapper instead." };
};
