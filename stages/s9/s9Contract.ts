/**
 * S9 Final QA & Registry - Stage Contract
 * Defines the data shape for the Final Quality Assurance context.
 * This stage acts as the gatekeeper before units are fully registered as Digital Twins.
 */

export interface S9Context {
  packsQueuedForFinalQaCount: number;
  packsUnderFinalQaCount: number;
  packsFinalApprovedCount: number;
  packsFinalRejectedCount: number;
  lastFinalQaAt: string;
  finalQaStatus: 'IDLE' | 'CHECKING' | 'APPROVED' | 'REJECTED';
  agingDependency: 'OK' | 'BLOCKED'; // Dependency on S8 Aging & Soak
}

/**
 * Returns deterministic mock data for S9 context.
 * Represents the current state of the Final QA station / Registry intake.
 */
export const getMockS9Context = (): S9Context => ({
  packsQueuedForFinalQaCount: 15,
  packsUnderFinalQaCount: 1,
  packsFinalApprovedCount: 415,
  packsFinalRejectedCount: 2,
  lastFinalQaAt: '2026-01-16 16:15 IST',
  finalQaStatus: 'IDLE',
  agingDependency: 'OK'
});
