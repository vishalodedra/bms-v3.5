/**
 * View Registry
 * Maps NavView route identifiers to React Components and their configuration.
 * @foundation V34-CORE-FP-05
 */

import React from 'react';
import { NavView } from '../types';

// Standard Components
import { Dashboard } from '../components/Dashboard';
import { ControlTower } from '../components/ControlTower';
import { RunbookDetail } from '../components/RunbookDetail';
import { ExceptionsView } from '../components/ExceptionsView';
import { SystemSetup } from '../components/SystemSetup';
import { SKUBlueprint } from '../components/SKUBlueprint';
import { Procurement } from '../components/Procurement';
import { BatchPlanning } from '../components/BatchPlanning';
import { ModuleAssembly } from '../components/ModuleAssembly';
import { ModuleQA } from '../components/ModuleQA';
import { PackAssembly } from '../components/PackAssembly';
import { PackReview } from '../components/PackReview';
import { BMSProvisioning } from '../components/BMSProvisioning';
import { PackagingAggregation } from '../components/PackagingAggregation';
import { DispatchAuthorization } from '../components/DispatchAuthorization';
import { DispatchExecution } from '../components/DispatchExecution';
import { ServiceWarranty } from '../components/ServiceWarranty';
import { RecyclingRecovery } from '../components/RecyclingRecovery';
import { ComplianceAudit } from '../components/ComplianceAudit';
import { Documentation } from '../components/Documentation';
import { LiveStatus } from '../components/LiveStatus';
import { SystemInventory } from '../components/SystemInventory';
import { ProductionLine } from '../components/ProductionLine';
import { SystemLogs } from '../components/SystemLogs';
import { SystemReports } from '../components/SystemReports';
import { RegressionSmokePanel } from '../screens/debug';

// Generic Flow Wrapper
import { GenericFlowScreen, GenericFlowScreenProps } from '../components/GenericFlowScreen';

// Specific Flow Components (for GenericFlowScreen config)
import { InboundReceipt } from '../components/InboundReceipt';
import { InboundFlowWizard } from '../flows/inbound/ui/InboundFlowWizard';
import { INBOUND_FLOW_ENDPOINTS } from '../flows/inbound';

import { BatteryRegistry } from '../components/BatteryRegistry';
import { FinalQaWizard } from '../flows/finalQa/ui/FinalQaWizard';
import { FINAL_QA_FLOW_ENDPOINTS } from '../flows/finalQa';

import { FinishedGoods } from '../components/FinishedGoods';
import { DispatchWizard } from '../flows/dispatch/ui/DispatchWizard';
import { DISPATCH_FLOW_ENDPOINTS } from '../flows/dispatch';

// Config Types
export interface ViewConfig {
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

// Registry Definition
export const VIEW_REGISTRY: Partial<Record<NavView, ViewConfig>> = {
  // Root
  dashboard: { component: Dashboard },
  
  // Governance
  control_tower: { component: ControlTower }, // requires onNavigate props passed from App
  runbook_detail: { component: RunbookDetail }, // requires runbookId
  exceptions_view: { component: ExceptionsView },

  // System Setup
  system_setup: { component: SystemSetup },
  sku_blueprint: { component: SKUBlueprint },

  // Procurement
  procurement: { component: Procurement },
  
  // FLOW-003: Inbound Receipt (Unified via GenericFlowScreen)
  inbound_receipt: {
    component: GenericFlowScreen,
    props: {
      flowId: 'FLOW-003',
      listEndpoint: INBOUND_FLOW_ENDPOINTS.list,
      listTitle: 'Active Receipts',
      emptyMessage: 'No pending inbound receipts.',
      MainComponent: InboundReceipt,
      WizardComponent: InboundFlowWizard,
      startLabel: 'Start Inbound Flow'
    } as GenericFlowScreenProps
  },

  // Production
  batch_planning: { component: BatchPlanning }, // FLOW-002 (Self-Contained for now)
  module_assembly: { component: ModuleAssembly },
  module_qa: { component: ModuleQA },
  pack_assembly: { component: PackAssembly },
  pack_review: { component: PackReview },

  // Trace & Identity
  // FLOW-004: Final QA (Unified via GenericFlowScreen)
  battery_registry: {
    component: GenericFlowScreen,
    props: {
      flowId: 'FLOW-004',
      listEndpoint: FINAL_QA_FLOW_ENDPOINTS.list,
      listTitle: 'QA Sessions',
      emptyMessage: 'No pending pack QA sessions.',
      MainComponent: BatteryRegistry,
      WizardComponent: FinalQaWizard,
      startLabel: 'Start Final QA Flow'
    } as GenericFlowScreenProps
  },
  bms_provisioning: { component: BMSProvisioning },

  // Logistics
  // FLOW-005: Finished Goods / Dispatch (Unified via GenericFlowScreen)
  finished_goods: {
    component: GenericFlowScreen,
    props: {
      flowId: 'FLOW-005',
      listEndpoint: DISPATCH_FLOW_ENDPOINTS.list,
      listTitle: 'Active Consignments',
      emptyMessage: 'No pending consignments.',
      MainComponent: FinishedGoods,
      WizardComponent: DispatchWizard,
      startLabel: 'Start Dispatch Flow'
    } as GenericFlowScreenProps
  },
  packaging_aggregation: { component: PackagingAggregation },
  dispatch_authorization: { component: DispatchAuthorization },
  dispatch_execution: { component: DispatchExecution },

  // Track & Lifecycle
  service_warranty: { component: ServiceWarranty },
  recycling_recovery: { component: RecyclingRecovery },

  // Audit & Governance
  compliance_audit: { component: ComplianceAudit },

  // System Views
  documentation: { component: Documentation },
  live_status: { component: LiveStatus },
  system_inventory: { component: SystemInventory },
  production_line: { component: ProductionLine },
  system_logs: { component: SystemLogs },
  system_reports: { component: SystemReports },

  // Debug
  debug_smoke: { component: RegressionSmokePanel }
};

/**
 * Helper to retrieve config for a view
 */
export function getViewConfig(view: NavView): ViewConfig | undefined {
  return VIEW_REGISTRY[view];
}
