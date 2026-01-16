export type StageState = 'READY' | 'RUNNING' | 'BLOCKED' | 'WAITING' | 'COMPLETE' | 'MAINTENANCE';

export interface StageStatus {
  state: StageState;
  reason: string;
  nextAction: string;
}

export const STAGE_STATUS_MAP: Record<string, StageStatus> = {
  'S0': { state: 'READY', reason: 'System configuration active', nextAction: 'Review facility settings' },
  'S1': { state: 'READY', reason: 'Blueprint revision A.2 active', nextAction: 'Define new SKU' },
  'S2': { state: 'WAITING', reason: 'Awaiting vendor RFQ response', nextAction: 'Check commercial terms' },
  'S3': { state: 'RUNNING', reason: 'Inbound dock operating normally', nextAction: 'Scan incoming manifest' },
  'S4': { state: 'READY', reason: 'Production schedule open', nextAction: 'Create planning batch' },
  'S5': { state: 'RUNNING', reason: 'Shift A active on Line 1', nextAction: 'Monitor assembly metrics' },
  'S6': { state: 'BLOCKED', reason: 'Calibration expired on Stn-04', nextAction: 'Contact Maintenance' },
  'S7': { state: 'RUNNING', reason: 'Pack assembly in progress', nextAction: 'Verify enclosure sealing' },
  'S8': { state: 'WAITING', reason: 'Queue empty', nextAction: 'Wait for S7 output' },
  'S9': { state: 'READY', reason: 'Registry sync online', nextAction: 'Query digital twin' },
  'S10': { state: 'READY', reason: 'Flash tool connected', nextAction: 'Scan BMS for provisioning' },
  'S11': { state: 'READY', reason: 'Warehouse zone C available', nextAction: 'Inbound finished pallets' },
  'S12': { state: 'READY', reason: 'Label printer online', nextAction: 'Aggregate packs to unit' },
  'S13': { state: 'BLOCKED', reason: 'Shift changeover in progress', nextAction: 'Wait for handover' },
  'S14': { state: 'READY', reason: 'Gate pass system active', nextAction: 'Verify driver identity' },
  'S15': { state: 'READY', reason: 'Service desk open', nextAction: 'Triage incoming ticket' },
  'S16': { state: 'WAITING', reason: 'Sorting bin A full', nextAction: 'Clear bin for processing' },
  'S17': { state: 'READY', reason: 'Audit logging active', nextAction: 'Review compliance flags' },
};
