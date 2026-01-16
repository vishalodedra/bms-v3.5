/**
 * S1 SKU & Blueprint - Stage Contract
 * Defines the data shape for the Product Definition context.
 */

export interface S1Context {
  totalSkus: number;
  activeRevision: string;
  lastBlueprintUpdate: string;
  approvalStatus: 'DRAFT' | 'REVIEW' | 'APPROVED';
  complianceReady: boolean;
  engineeringSignoff: string;
}

/**
 * Returns deterministic mock data for S1 context.
 * Represents the current state of product definitions in the system.
 */
export const getMockS1Context = (): S1Context => ({
  totalSkus: 3,
  activeRevision: 'Rev A.3',
  lastBlueprintUpdate: '2026-01-15 14:30 IST',
  approvalStatus: 'APPROVED',
  complianceReady: true,
  engineeringSignoff: 'ENG-LEAD-01'
});
