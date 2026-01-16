/**
 * S15 Compliance & ESG - Stage Contract
 * Defines the data shape for the Compliance Reporting & ESG context.
 */

export interface S15Context {
  complianceSnapshotCount: number;
  missingEvidenceCount: number;
  esgScorePreview: number; // 0-100
  carbonFootprintKgCo2e: number;
  lastComplianceRunAt: string;
  complianceStatus: 'IDLE' | 'READY' | 'NEEDS_EVIDENCE' | 'SUBMITTED';
  circularDependency: 'OK' | 'BLOCKED'; // Dependency on S14
}

/**
 * Returns deterministic mock data for S15 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS15Context = (): S15Context => ({
  complianceSnapshotCount: 12,
  missingEvidenceCount: 3,
  esgScorePreview: 88,
  carbonFootprintKgCo2e: 4250,
  lastComplianceRunAt: '2026-01-16 18:30 IST',
  complianceStatus: 'NEEDS_EVIDENCE',
  circularDependency: 'OK'
});
