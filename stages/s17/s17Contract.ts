/**
 * S17 Closure & Archive - Stage Contract
 * Defines the data shape for the System Closure & Archival context.
 */

export interface S17Context {
  recordsReadyToArchiveCount: number;
  recordsArchivedCount: number;
  archiveBatchesCount: number;
  lastArchiveAt: string;
  closureStatus: 'IDLE' | 'READY' | 'ARCHIVING' | 'ARCHIVED';
  auditDependency: 'OK' | 'BLOCKED'; // Dependency on S16 Audit
}

/**
 * Returns deterministic mock data for S17 context.
 * Represents the current state of the Closure & Archive stage.
 */
export const getMockS17Context = (): S17Context => ({
  recordsReadyToArchiveCount: 1540,
  recordsArchivedCount: 12500,
  archiveBatchesCount: 42,
  lastArchiveAt: '2026-01-10 23:00 IST',
  closureStatus: 'IDLE',
  auditDependency: 'OK'
});
