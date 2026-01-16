/**
 * S5 Module Assembly - Stage Contract
 * Defines the data shape for the Module Assembly context.
 */

export interface S5Context {
  modulesPlannedCount: number;
  modulesInProgressCount: number;
  modulesCompletedCount: number;
  workstationActiveCount: number;
  lastAssemblyAt: string;
  assemblyStatus: 'IDLE' | 'ASSEMBLING' | 'PAUSED' | 'COMPLETED';
  planningDependency: 'OK' | 'BLOCKED';
}

/**
 * Returns deterministic mock data for S5 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS5Context = (): S5Context => ({
  modulesPlannedCount: 500,
  modulesInProgressCount: 124,
  modulesCompletedCount: 30,
  workstationActiveCount: 2,
  lastAssemblyAt: '2026-01-13 14:10 IST',
  assemblyStatus: 'ASSEMBLING',
  planningDependency: 'OK'
});
