/**
 * S8 Aging & Soak - Stage Contract
 * Defines the data shape for the Aging & Soak context.
 * This stage validates pack performance over time before final approval.
 */

export interface S8Context {
  packsUnderAgingCount: number;
  packsCompletedAgingCount: number;
  soakChamberActiveCount: number;
  lastSoakCycleStartedAt: string;
  agingStatus: 'IDLE' | 'AGING' | 'SOAKING' | 'COMPLETED';
  s7Dependency: 'OK' | 'BLOCKED'; // Dependency on S7 Pack Assembly
}

/**
 * Returns deterministic mock data for S8 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS8Context = (): S8Context => ({
  packsUnderAgingCount: 12,
  packsCompletedAgingCount: 18,
  soakChamberActiveCount: 2,
  lastSoakCycleStartedAt: '2026-01-16 16:00 IST',
  agingStatus: 'AGING',
  s7Dependency: 'OK'
});
