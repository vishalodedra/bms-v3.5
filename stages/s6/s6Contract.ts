/**
 * S6 Module Quality Assurance - Stage Contract
 * Defines the data shape for the Module QA context.
 * 
 * NOTE: S6 is Module QA in the V3.3 Architecture.
 * (S7 is Pack Assembly).
 */

export interface S6Context {
  modulesPendingCount: number;
  modulesInReviewCount: number;
  modulesClearedCount: number;
  modulesRejectedCount: number;
  qaStatus: 'IDLE' | 'INSPECTING' | 'BLOCKED';
  assemblyDependency: 'OK' | 'BLOCKED'; // Dependency on S5
  lastInspectionAt: string;
}

/**
 * Returns deterministic mock data for S6 context.
 * Represents the current state of the Module QA station.
 */
export const getMockS6Context = (): S6Context => ({
  modulesPendingCount: 45,
  modulesInReviewCount: 1,
  modulesClearedCount: 420,
  modulesRejectedCount: 3,
  qaStatus: 'INSPECTING',
  assemblyDependency: 'OK',
  lastInspectionAt: '2026-01-16 14:45 IST'
});
