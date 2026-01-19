
import { NavView } from '../types';

/**
 * Path Registry
 * Maps internal NavView IDs to URL paths for routing.
 * @foundation V34-S3-GOV-FP-24
 */

export const PATH_MAP: Record<NavView, string> = {
  dashboard: '/',
  control_tower: '/govern/control-tower',
  runbook_detail: '/govern/runbook/:id',
  exceptions_view: '/govern/exceptions',
  
  // System Setup
  system_setup: '/system/setup',
  sku_blueprint: '/system/sku',

  // Procurement & Inbound
  procurement: '/procurement/orders',
  inbound_receipt: '/stores/inbound',

  // Production
  batch_planning: '/s4/batches', 
  module_assembly: '/s5/modules', 
  module_create: '/s5/batches/:batchId/modules/assemble', // V34-S5-SPA-FP-39: Changed to /assemble
  module_qa: '/production/module-qa',
  pack_assembly: '/production/pack-assembly',
  pack_review: '/production/pack-review',

  // Trace & Identity
  battery_registry: '/trace/registry',
  bms_provisioning: '/trace/provisioning',

  // Logistics
  finished_goods: '/logistics/finished-goods',
  packaging_aggregation: '/logistics/packaging',
  dispatch_authorization: '/logistics/dispatch-auth',
  dispatch_execution: '/logistics/dispatch-exec',

  // Track & Lifecycle
  service_warranty: '/lifecycle/service',
  recycling_recovery: '/lifecycle/recycling',

  // Governance
  compliance_audit: '/govern/audit',

  // System
  documentation: '/system/docs',
  live_status: '/system/live',
  system_inventory: '/system/inventory',
  production_line: '/system/production-line',
  system_logs: '/system/logs',
  system_reports: '/system/reports',
  
  // Debug
  debug_smoke: '/debug/smoke'
};

/**
 * Reverse lookup to find NavView from current path.
 * Used for Sidebar highlighting.
 */
export const getNavViewFromPath = (path: string): NavView => {
  // Exact match
  const entry = Object.entries(PATH_MAP).find(([_, p]) => p === path);
  if (entry) return entry[0] as NavView;

  // Prefix match (for nested routes like /stores/inbound/123)
  const sortedPaths = Object.entries(PATH_MAP)
    .filter(([_, p]) => p !== '/') // Ignore root
    .sort((a, b) => b[1].length - a[1].length); // Longest first

  for (const [view, p] of sortedPaths) {
    if (path.startsWith(p)) return view as NavView;
  }

  // Handle special dynamic match for module assemble which might not match prefix due to :batchId
  if (path.match(/\/s5\/batches\/.*\/modules\/assemble/)) {
    return 'module_create' as NavView;
  }

  return 'dashboard';
};
