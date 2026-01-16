/**
 * S2 Commercial Procurement - Stage Contract
 * Defines the data shape for the Procurement context.
 */

export interface S2Context {
  activePoCount: number;
  pendingApprovalsCount: number;
  vendorCatalogCount: number;
  lastPoCreatedAt: string;
  procurementStatus: 'IDLE' | 'RAISING_PO' | 'WAITING_APPROVAL' | 'APPROVED';
  blueprintDependency: 'OK' | 'BLOCKED';
}

/**
 * Returns deterministic mock data for S2 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS2Context = (): S2Context => ({
  activePoCount: 5,
  pendingApprovalsCount: 2,
  vendorCatalogCount: 14,
  lastPoCreatedAt: '2026-01-16 11:45 IST',
  procurementStatus: 'WAITING_APPROVAL',
  blueprintDependency: 'OK'
});
