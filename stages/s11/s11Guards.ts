import { UserRole } from '../../types';
import { S11Context } from './s11Contract';

/**
 * S11 Action Identifiers
 * Lifecycle operations for Finished Goods Dispatch & Custody.
 */
export type S11ActionId = 
  | 'PREPARE_DISPATCH'
  | 'HANDOVER_TO_LOGISTICS'
  | 'CONFIRM_IN_TRANSIT'
  | 'CONFIRM_DELIVERY'
  | 'CLOSE_CUSTODY';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S11 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - PREPARE_DISPATCH: Stores/Supervisor. Requires OPERATIONAL status. IDLE state.
 * - HANDOVER_TO_LOGISTICS: Stores/Supervisor. Requires READY state.
 * - CONFIRM_IN_TRANSIT: Logistics. Requires DISPATCHED state.
 * - CONFIRM_DELIVERY: Logistics. Requires IN_TRANSIT state.
 * - CLOSE_CUSTODY: Management/Director. Requires DELIVERED state.
 */
export const getS11ActionState = (role: UserRole, context: S11Context, action: S11ActionId): ActionState => {
  // Global Lock
  if (context.warehouseStatus === 'AUDIT_LOCK') {
    return { enabled: false, reason: 'Warehouse under Audit Lock' };
  }

  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isStores = role === UserRole.STORES || isAdmin;
  const isLogistics = role === UserRole.LOGISTICS || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Operational State Check
  const isOperational = context.warehouseStatus === 'OPERATIONAL';
  const hasReadyStock = context.stockReadyCount > 0;

  switch (action) {
    case 'PREPARE_DISPATCH':
      if (!isStores) return { enabled: false, reason: 'Requires Stores Role' };
      if (!isOperational) return { enabled: false, reason: 'Warehouse Not Operational' };
      if (!hasReadyStock) return { enabled: false, reason: 'No Ready Stock' };
      if (context.dispatchStatus !== 'IDLE') return { enabled: false, reason: 'Cycle Already Active' };
      return { enabled: true };

    case 'HANDOVER_TO_LOGISTICS':
      if (!isStores) return { enabled: false, reason: 'Requires Stores Role' };
      if (!isOperational) return { enabled: false, reason: 'Warehouse Not Operational' };
      if (context.dispatchStatus !== 'READY') return { enabled: false, reason: 'Shipment Not Prepared' };
      return { enabled: true };

    case 'CONFIRM_IN_TRANSIT':
      if (!isLogistics) return { enabled: false, reason: 'Requires Logistics Role' };
      if (context.dispatchStatus !== 'DISPATCHED') return { enabled: false, reason: 'Handover Pending' };
      return { enabled: true };

    case 'CONFIRM_DELIVERY':
      if (!isLogistics) return { enabled: false, reason: 'Requires Logistics Role' };
      if (context.dispatchStatus !== 'IN_TRANSIT') return { enabled: false, reason: 'Not In Transit' };
      return { enabled: true };

    case 'CLOSE_CUSTODY':
      if (!isManagement) return { enabled: false, reason: 'Requires Plant Director' };
      if (context.dispatchStatus !== 'DELIVERED') return { enabled: false, reason: 'Delivery Pending' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
