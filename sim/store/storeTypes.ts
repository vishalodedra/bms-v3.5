/**
 * In-memory Store Types
 * Defines the shape of the simulated backend database.
 * @foundation V34-FND-BP-10
 */

import type { AnyFlowInstance, FlowId, IsoDateTime, EntityId } from "../../types";

export type StoreEntityKey = "flows";

export interface InMemoryDb {
  flows: Record<string, AnyFlowInstance>;   // key = instanceId
}

export interface StoreSnapshot {
  version: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  db: InMemoryDb;
}
