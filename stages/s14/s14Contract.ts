/**
 * S14 Refurbish & Recycle - Stage Contract
 * Defines the data shape for the Circular Economy / End-of-Life context.
 * 
 * NOTE: S14 manages the decision and execution of Refurbishment vs Recycling
 * for units returned via S13.
 */

export interface S14Context {
  packsEligibleForRefurbishCount: number;
  packsSentForRefurbishCount: number;
  packsSentForRecycleCount: number;
  refurbishInProgressCount: number;
  lastCircularActionAt: string;
  circularStatus: 'IDLE' | 'INSPECTION' | 'REFURBISH' | 'RECYCLE' | 'COMPLETED';
  serviceDependency: 'OK' | 'BLOCKED'; // Dependency on S13 Service/Returns
}

/**
 * Returns deterministic mock data for S14 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS14Context = (): S14Context => ({
  packsEligibleForRefurbishCount: 5,
  packsSentForRefurbishCount: 12,
  packsSentForRecycleCount: 45,
  refurbishInProgressCount: 3,
  lastCircularActionAt: '2026-01-16 11:00 IST',
  circularStatus: 'REFURBISH',
  serviceDependency: 'OK'
});
