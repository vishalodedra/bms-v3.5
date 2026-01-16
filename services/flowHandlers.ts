/**
 * V3.4 Flow Handlers (Simulated API Logic)
 * Intercepts /api/flows/* requests and manages local state.
 * @foundation V34-API-BP-03
 */

import { ApiResult, AnyFlowInstance, FlowId, IsoDateTime } from '../types';

const STORAGE_KEY = 'bpm_simulated_api_data';

interface ApiStore {
  instances: AnyFlowInstance[];
}

const getStore = (): ApiStore => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return { instances: [] };
  try {
    return JSON.parse(data);
  } catch {
    return { instances: [] };
  }
};

const saveStore = (store: ApiStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getTimestamp = (): IsoDateTime => new Date().toISOString();

/**
 * Main Router for Simulated Flow API
 */
export const handleFlowRequest = async (url: string, init?: RequestInit): Promise<Response> => {
  const store = getStore();
  const path = url.replace('/api/flows/', '');
  const method = init?.method || 'GET';

  // GET /api/flows/instances?flowId=FLOW-001
  if (path.startsWith('instances') && method === 'GET') {
    const urlObj = new URL(url, window.location.origin);
    const flowId = urlObj.searchParams.get('flowId') as FlowId;
    
    const filtered = flowId 
      ? store.instances.filter(i => i.flowId === flowId)
      : store.instances;
      
    return mockJsonResponse({ ok: true, data: filtered });
  }

  // POST /api/flows/create
  if (path === 'create' && method === 'POST') {
    const body = JSON.parse(init?.body as string || '{}');
    const newInstance: AnyFlowInstance = {
      flowId: body.flowId,
      instanceId: `inst_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      state: body.initialState,
      ...body.data
    } as AnyFlowInstance;

    store.instances.push(newInstance);
    saveStore(store);
    return mockJsonResponse({ ok: true, data: newInstance });
  }

  return mockJsonResponse({ 
    ok: false, 
    error: { code: 'NOT_FOUND', message: `Endpoint ${method} ${url} not implemented in simulator.` } 
  }, 404);
};

const mockJsonResponse = (data: ApiResult<any>, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};
