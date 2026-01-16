/**
 * S12 Warranty & Lifecycle - Stage Contract
 * Defines the data shape for the Warranty tracking & Lifecycle context.
 * 
 * NOTE: Maps to "Warranty & Lifecycle" intent.
 */

export interface S12Context {
  packsUnderWarrantyCount: number;
  packsOutOfWarrantyCount: number;
  activeClaimsCount: number;
  warrantyActiveFrom: string;
  lifecycleStatus: 'ACTIVE' | 'CLAIM' | 'EXPIRED';
  dispatchDependency: 'OK' | 'BLOCKED'; // Dependency on S11/S14 Dispatch
}

/**
 * Returns deterministic mock data for S12 context.
 * Represents the current state of the Warranty & Lifecycle stage.
 */
export const getMockS12Context = (): S12Context => ({
  packsUnderWarrantyCount: 850,
  packsOutOfWarrantyCount: 45,
  activeClaimsCount: 3,
  warrantyActiveFrom: '2025-01-01',
  lifecycleStatus: 'ACTIVE',
  dispatchDependency: 'OK'
});
