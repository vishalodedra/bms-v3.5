import { UserRole } from '../../types';
import { S2Context } from './s2Contract';

/**
 * S2 Action Identifiers
 * Lifecycle operations for Commercial Procurement.
 */
export type S2ActionId = 
  | 'CREATE_PO'
  | 'SUBMIT_PO_FOR_APPROVAL'
  | 'APPROVE_PO'
  | 'ISSUE_PO_TO_VENDOR'
  | 'CLOSE_PROCUREMENT_CYCLE';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S2 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Flow: IDLE -> RAISING_PO -> WAITING_APPROVAL -> APPROVED -> ISSUED/CLOSED
 */
export const getS2ActionState = (role: UserRole, context: S2Context, action: S2ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isProcurement = role === UserRole.PROCUREMENT || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global dependency check
  if (context.blueprintDependency === 'BLOCKED' && action === 'CREATE_PO') {
    return { enabled: false, reason: 'S1 Blueprint Not Ready' };
  }

  switch (action) {
    case 'CREATE_PO':
      if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
      // Can start a PO if IDLE or RAISING (to edit)
      if (context.procurementStatus !== 'IDLE' && context.procurementStatus !== 'RAISING_PO') {
         return { enabled: false, reason: 'PO already in workflow' };
      }
      return { enabled: true };

    case 'SUBMIT_PO_FOR_APPROVAL':
      if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
      if (context.procurementStatus !== 'RAISING_PO') {
        return { enabled: false, reason: 'No Active Draft PO' };
      }
      return { enabled: true };

    case 'APPROVE_PO':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (context.procurementStatus !== 'WAITING_APPROVAL') {
        return { enabled: false, reason: 'No PO pending approval' };
      }
      return { enabled: true };

    case 'ISSUE_PO_TO_VENDOR':
      if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
      if (context.procurementStatus !== 'APPROVED') {
        return { enabled: false, reason: 'PO not approved' };
      }
      return { enabled: true };

    case 'CLOSE_PROCUREMENT_CYCLE':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (context.procurementStatus !== 'APPROVED') {
        return { enabled: false, reason: 'Cycle incomplete' };
      }
      return { enabled: true };
      
    default:
      return { enabled: false, reason: 'Unknown Action ID' };
  }
};
