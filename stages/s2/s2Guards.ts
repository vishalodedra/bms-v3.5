
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
  | 'CLOSE_PROCUREMENT_CYCLE'
  | 'AMEND_PO';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S2 Action Guard (Global)
 * Checks system-wide conditions for S2.
 * 
 * NOTE: For specific PO items, use `validatePoItemAction` instead.
 */
export const getS2ActionState = (role: UserRole, context: S2Context, action: S2ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isProcurement = role === UserRole.PROCUREMENT || isAdmin;

  // Global dependency check
  if (context.blueprintDependency === 'BLOCKED' && action === 'CREATE_PO') {
    return { enabled: false, reason: 'S1 Blueprint Not Ready' };
  }

  // Allow creation unless system is in maintenance (removed single-PO-active check)
  if (action === 'CREATE_PO') {
    if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
    return { enabled: true };
  }

  return { enabled: true };
};

/**
 * Validate PO Item Action
 * Enforces strict state machine for an individual PO.
 * 
 * State Machine:
 * - Draft: Submit, Edit
 * - Submitted: Approve, Reject
 * - Approved: Amend, Close (Issue)
 * - Closed: View only
 */
export const validatePoItemAction = (
  role: UserRole, 
  poStatus: string, 
  action: S2ActionId
): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isProcurement = role === UserRole.PROCUREMENT || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  switch (action) {
    case 'SUBMIT_PO_FOR_APPROVAL':
      if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
      if (poStatus !== 'Draft') return { enabled: false, reason: 'PO must be in Draft state' };
      return { enabled: true };

    case 'APPROVE_PO':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (poStatus !== 'Submitted') return { enabled: false, reason: 'PO not pending approval' };
      return { enabled: true };

    case 'AMEND_PO':
      if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
      if (poStatus !== 'Approved') return { enabled: false, reason: 'Only Approved POs can be amended' };
      return { enabled: true };

    case 'CLOSE_PROCUREMENT_CYCLE':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (poStatus !== 'Approved') return { enabled: false, reason: 'PO not active/approved' };
      return { enabled: true };

    case 'ISSUE_PO_TO_VENDOR':
        // Implicit in approval or manual step for Approved POs
        if (!isProcurement) return { enabled: false, reason: 'Requires Procurement Role' };
        if (poStatus !== 'Approved') return { enabled: false, reason: 'PO not approved' };
        return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown item action' };
  }
};
