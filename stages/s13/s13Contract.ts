/**
 * S13 Service & Returns - Stage Contract
 * Defines the data shape for the Service Intake & Returns context.
 * 
 * NOTE: Maps to "Service / Returns" intent. 
 * In the V3.1 architecture, this aligns with the Recycling & Recovery flow (Reverse Logistics).
 */

export interface S13Context {
  serviceRequestsOpenCount: number;
  serviceRequestsClosedCount: number;
  returnsInitiatedCount: number;
  returnsInTransitCount: number;
  lastServiceEventAt: string;
  serviceStatus: 'IDLE' | 'SERVICE_OPEN' | 'RETURN_IN_PROGRESS' | 'CLOSED';
  warrantyDependency: 'OK' | 'BLOCKED'; // Dependency on S12 Warranty
}

/**
 * Returns deterministic mock data for S13 context.
 * Represents the current state of Service & Returns.
 */
export const getMockS13Context = (): S13Context => ({
  serviceRequestsOpenCount: 5,
  serviceRequestsClosedCount: 12,
  returnsInitiatedCount: 3,
  returnsInTransitCount: 1,
  lastServiceEventAt: '2026-01-16 10:30 IST',
  serviceStatus: 'SERVICE_OPEN',
  warrantyDependency: 'OK'
});
