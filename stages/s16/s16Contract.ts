/**
 * S16 Audit & Governance - Stage Contract
 * Defines the data shape for the Audit context.
 */

export interface S16Context {
  auditsOpenCount: number;
  auditsClosedCount: number;
  findingsOpenCount: number;
  findingsResolvedCount: number;
  lastAuditReviewedAt: string;
  auditStatus: 'IDLE' | 'REVIEWING' | 'FINDINGS' | 'RESOLVED' | 'CLOSED';
  complianceDependency: 'OK' | 'BLOCKED'; // Dependency on S15
}

/**
 * Returns deterministic mock data for S16 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS16Context = (): S16Context => ({
  auditsOpenCount: 2,
  auditsClosedCount: 15,
  findingsOpenCount: 4,
  findingsResolvedCount: 32,
  lastAuditReviewedAt: '2026-01-17 09:30 IST',
  auditStatus: 'REVIEWING',
  complianceDependency: 'OK'
});
