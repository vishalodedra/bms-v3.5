/**
 * S0 System Setup - Stage Contract
 * Defines the data shape for the System Setup context.
 */

export interface S0Context {
  plantId: string;
  plantName: string;
  region: string;
  activeSopVersion: string;
  configLastUpdated: string;
  status: 'READY' | 'CONFIGURING' | 'MAINTENANCE';
  activeLines: number;
}

/**
 * Returns deterministic mock data for S0 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS0Context = (): S0Context => ({
  plantId: 'FAC-IND-WB-001-A',
  plantName: 'Gigafactory 1 - Bengal Unit',
  region: 'Kolkata, WB, India (IST Zone)',
  activeSopVersion: 'V3.3.0-RC1',
  configLastUpdated: '2026-01-16 09:00 IST',
  status: 'READY',
  activeLines: 2
});
