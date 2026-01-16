/**
 * In-memory Store Implementation
 * Minimal API for managing simulated flow data.
 * Resets on page reload by design (Foundation Phase A).
 * @foundation V34-FND-BP-10
 */

import type { AnyFlowInstance, FlowId, IsoDateTime, EntityId } from "../../types";
import type { StoreSnapshot } from "./storeTypes";

let SNAPSHOT: StoreSnapshot;

/**
 * Helper to generate current timestamp
 */
function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

/**
 * Initializes/Resets the internal store to empty state.
 */
export function resetStore(): StoreSnapshot {
  SNAPSHOT = {
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    db: {
      flows: {}
    }
  };
  console.debug("[STORE] In-memory store reset.");
  return SNAPSHOT;
}

/**
 * Returns the current store snapshot.
 * Auto-initializes if not present.
 */
export function getStore(): StoreSnapshot {
  if (!SNAPSHOT) {
    return resetStore();
  }
  return SNAPSHOT;
}

/**
 * Adds or updates a flow instance in the store.
 */
export function upsertFlow(instance: AnyFlowInstance): StoreSnapshot {
  const store = getStore();
  store.db.flows[instance.instanceId] = instance;
  store.version += 1;
  store.updatedAt = nowIso();
  console.debug(`[STORE] Upserted flow: ${instance.flowId} (${instance.instanceId})`);
  return store;
}

/**
 * Retrieves a single flow instance by ID.
 */
export function getFlow(instanceId: EntityId): AnyFlowInstance | undefined {
  const store = getStore();
  return store.db.flows[instanceId];
}

/**
 * Lists flow instances, optionally filtered by FlowId.
 */
export function listFlows(flowId?: FlowId): AnyFlowInstance[] {
  const store = getStore();
  const allFlows = Object.values(store.db.flows);
  if (!flowId) return allFlows;
  return allFlows.filter(f => f.flowId === flowId);
}

/**
 * Removes a flow instance from the store.
 */
export function deleteFlow(instanceId: EntityId): StoreSnapshot {
  const store = getStore();
  if (store.db.flows[instanceId]) {
    delete store.db.flows[instanceId];
    store.version += 1;
    store.updatedAt = nowIso();
    console.debug(`[STORE] Deleted flow: ${instanceId}`);
  }
  return store;
}

// Automatic initialization on module load
resetStore();
