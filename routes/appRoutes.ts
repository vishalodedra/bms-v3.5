import { NavView } from '../types';

/**
 * Global App Route Registry
 * Maps to currentView state in App.tsx.
 * @foundation V33-DOC-HO-92
 */
export const APP_ROUTES: NavView[] = [
  'dashboard',
  'control_tower',
  'system_setup',
  'sku_blueprint',
  'procurement',
  'inbound_receipt',
  'batch_planning',
  'module_assembly',
  'module_qa',
  'pack_assembly',
  'pack_review',
  'battery_registry',
  'bms_provisioning',
  'finished_goods',
  'packaging_aggregation',
  'dispatch_authorization',
  'dispatch_execution',
  'service_warranty',
  'recycling_recovery',
  'compliance_audit',
  'documentation',
  'live_status',
  'system_inventory',
  'production_line',
  'system_logs',
  'system_reports',
  'debug_smoke'
];