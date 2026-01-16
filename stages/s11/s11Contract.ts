/**
 * S11 Finished Goods Inventory - Stage Contract
 * Defines the data shape for the Warehouse & Inventory context.
 * 
 * NOTE: Maps to "Dispatch & Custody" intent from prompt, localized to the 
 * Finished Goods Warehouse stage (S11) in the V3.3 Architecture.
 */

export interface S11Context {
  stockReadyCount: number;      // Items available for allocation
  stockReservedCount: number;   // Items allocated to orders
  totalDispatchedCount: number; // Items completed delivery
  custodyHandoverPendingCount: number; // Items awaiting physical handover
  consignmentsInTransitCount: number; // Items currently on the road
  lastMovementAt: string;
  warehouseStatus: 'IDLE' | 'OPERATIONAL' | 'AUDIT_LOCK';
  dispatchStatus: 'IDLE' | 'READY' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  provisioningDependency: 'OK' | 'BLOCKED'; // Dependency on S10
}

/**
 * Returns deterministic mock data for S11 context.
 * Represents the current state of the Finished Goods Warehouse.
 */
export const getMockS11Context = (): S11Context => ({
  stockReadyCount: 450,
  stockReservedCount: 60,
  totalDispatchedCount: 125,
  custodyHandoverPendingCount: 12,
  consignmentsInTransitCount: 5,
  lastMovementAt: '2026-01-16 17:30 IST',
  warehouseStatus: 'OPERATIONAL',
  dispatchStatus: 'IDLE',
  provisioningDependency: 'OK'
});
