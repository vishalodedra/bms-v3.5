
/**
 * S4 Batch Planning - Stage Contract
 * Defines the data shape for the Production Planning context.
 */

export interface S4Context {
  plannedBatchCount: number;
  activeBatchCount: number;
  unallocatedInventoryCount: number;
  lastBatchPlannedAt: string;
  // Removed global 'planningStatus' to support concurrent batch-scoped planning (V34-S4-FIX-01)
  inboundDependency: 'OK' | 'BLOCKED';
}

/**
 * Returns deterministic mock data for S4 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS4Context = (): S4Context => ({
  plannedBatchCount: 12,
  activeBatchCount: 3,
  unallocatedInventoryCount: 450,
  lastBatchPlannedAt: '2026-01-13 10:00 IST',
  inboundDependency: 'OK'
});
