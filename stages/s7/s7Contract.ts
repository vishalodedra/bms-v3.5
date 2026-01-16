/**
 * S7 Pack Assembly - Stage Contract
 * Defines the data shape for the Pack Assembly context.
 * 
 * NOTE: In V3.3 Architecture, S7 is Pack Assembly (Integration of Modules + BMS + Enclosure).
 * This stage consumes output from S6 (Module QA).
 */

export interface S7Context {
  packsPlannedCount: number;
  packsInProgressCount: number;
  packsCompletedCount: number;
  activeLineId: string;
  lastAssemblyAt: string;
  assemblyStatus: 'IDLE' | 'ASSEMBLING' | 'PAUSED' | 'COMPLETED';
  moduleQaDependency: 'OK' | 'BLOCKED'; // Dependency on S6
}

/**
 * Returns deterministic mock data for S7 context.
 * Represents the current state of the Pack Assembly line.
 */
export const getMockS7Context = (): S7Context => ({
  packsPlannedCount: 125,
  packsInProgressCount: 1,
  packsCompletedCount: 30,
  activeLineId: 'Line A',
  lastAssemblyAt: '2026-01-16 15:30 IST',
  assemblyStatus: 'ASSEMBLING',
  moduleQaDependency: 'OK'
});
