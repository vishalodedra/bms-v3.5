
/**
 * In-memory Store Implementation
 * Minimal API for managing simulated flow data.
 * Resets on page reload by design (Foundation Phase A).
 * @foundation V34-FND-BP-10
 */

import type { AnyFlowInstance, FlowId, IsoDateTime, EntityId } from "../../types";
import type { StoreSnapshot } from "./storeTypes";
import type { SkuFlowInstance } from "../../flows/sku";
import type { InboundFlowInstance } from "../../flows/inbound";
import type { BatchFlowInstance } from "../../flows/batch";

let SNAPSHOT: StoreSnapshot;

/**
 * Helper to generate current timestamp
 */
function nowIso(): IsoDateTime {
  return new Date().toISOString();
}

/**
 * Seed Data for Pilot Scenarios (V34-DATA-PRE-MOCK-40)
 * Ensures downstream flows (S4, S11) have upstream data (S1, S3) to reference immediately.
 */
const SEEDED_FLOWS: AnyFlowInstance[] = [
  // S1: Active SKUs
  {
    flowId: "FLOW-001",
    instanceId: "SKU-SEED-001",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Active",
    draft: {
      skuCode: "BP-LFP-48V-2.5K",
      skuName: "E-Scooter Standard Pack",
      chemistry: "LFP",
      formFactor: "Cylindrical",
      nominalVoltage: 48,
      capacityAh: 50,
      cellsPerModule: 12, // V34-S1-SKU-DEF-41
      notes: "Seeded Active SKU for Pilot (Small)"
    },
    approvedBy: "System Admin",
    approvedAt: nowIso()
  } as SkuFlowInstance,
  {
    flowId: "FLOW-001",
    instanceId: "SKU-SEED-002",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Active",
    draft: {
      skuCode: "BP-LFP-48V-5K",
      skuName: "E-Auto Extended Pack",
      chemistry: "LFP",
      formFactor: "Cylindrical",
      nominalVoltage: 48,
      capacityAh: 100,
      cellsPerModule: 24, // V34-S1-SKU-DEF-41
      notes: "Seeded Active SKU for Pilot (Large)"
    },
    approvedBy: "System Admin",
    approvedAt: nowIso()
  } as SkuFlowInstance,

  // S3: Inbound Receipt (Released Inventory)
  {
    flowId: "FLOW-003",
    instanceId: "INB-SEED-001",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Released",
    receipt: {
      grnNumber: "GRN-001",
      supplierName: "LFP Cell Supplier Pvt Ltd", // Matches S2 mock
      poNumber: "PO-001",
      supplierLotNumber: "LOT-LFP-A",
      materialCode: "CELL-LFP-21700",
      quantityReceived: 100,
      uom: "Units",
      receivedDate: nowIso()
    },
    serializedItems: Array.from({ length: 100 }).map((_, i) => ({
      serialNumber: `CELL-LFP-${String(i + 1).padStart(4, '0')}`,
      status: "PASSED",
      disposition: "RELEASED",
      poNumber: "PO-001",
      supplierLotNumber: "LOT-LFP-A"
    })),
    qcBy: "QA Engineer",
    qcAt: nowIso(),
    releasedAt: nowIso()
  } as InboundFlowInstance,

  // S4: Batches
  // Batch A: Completed (Closed)
  {
    flowId: "FLOW-002",
    instanceId: "B-01",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "Completed", // Mapping UI 'Completed' to API logic
    draft: {
      batchName: "B-01 (History)",
      skuCode: "BP-LFP-48V-2.5K",
      plannedQuantity: 3,
      allocatedInventoryIds: [
        // Consumed cells 1-36
        ...Array.from({ length: 36 }).map((_, i) => `CELL-LFP-${String(i + 1).padStart(4, '0')}`)
      ]
    },
    approvedBy: "Supervisor",
    approvedAt: nowIso(),
    startedAt: nowIso(),
    completedAt: nowIso()
  } as unknown as BatchFlowInstance,

  // Batch B: In Progress (Active for S5)
  {
    flowId: "FLOW-002",
    instanceId: "B-02",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: "InProgress",
    draft: {
      batchName: "B-02 (Active)",
      skuCode: "BP-LFP-48V-2.5K",
      plannedQuantity: 3,
      allocatedInventoryIds: [
        // Allocated cells 37-72
        ...Array.from({ length: 36 }).map((_, i) => `CELL-LFP-${String(i + 37).padStart(4, '0')}`)
      ]
    },
    approvedBy: "Supervisor",
    approvedAt: nowIso(),
    startedAt: nowIso()
  } as unknown as BatchFlowInstance
];

/**
 * Initializes/Resets the internal store to empty state.
 */
export function resetStore(): StoreSnapshot {
  const flowMap: Record<string, AnyFlowInstance> = {};
  
  // Apply Seeds
  SEEDED_FLOWS.forEach(flow => {
    flowMap[flow.instanceId] = flow;
  });

  SNAPSHOT = {
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    db: {
      flows: flowMap
    }
  };
  console.debug("[STORE] In-memory store reset with seeds.", Object.keys(flowMap).length, "items.");
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
