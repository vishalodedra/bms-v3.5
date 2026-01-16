/**
 * S10 BMS Provisioning - Stage Contract
 * Defines the data shape for the BMS Provisioning context.
 * 
 * NOTE: This stage handles firmware flashing and identity binding (Traceability).
 */

export interface S10Context {
  packsQueuedCount: number;
  packsInProgressCount: number;
  packsCompletedCount: number;
  firmwareRepoStatus: 'ONLINE' | 'OFFLINE';
  lastProvisionedAt: string;
  provisioningStatus: 'IDLE' | 'PROVISIONING' | 'VERIFYING' | 'COMPLETED';
  registryDependency: 'OK' | 'BLOCKED'; // Dependency on S9 Battery Registry
}

/**
 * Returns deterministic mock data for S10 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS10Context = (): S10Context => ({
  packsQueuedCount: 8,
  packsInProgressCount: 1,
  packsCompletedCount: 42,
  firmwareRepoStatus: 'ONLINE',
  lastProvisionedAt: '2026-01-16 16:45 IST',
  provisioningStatus: 'IDLE',
  registryDependency: 'OK'
});
