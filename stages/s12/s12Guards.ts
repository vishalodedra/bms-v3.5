import { UserRole } from '../../types';
import { S12Context } from './s12Contract';

/**
 * S12 Action Identifiers
 * Lifecycle operations for Warranty & Service.
 */
export type S12ActionId = 
  | 'VIEW_WARRANTY_DETAILS'
  | 'INITIATE_WARRANTY_CLAIM'
  | 'APPROVE_WARRANTY_CLAIM'
  | 'REJECT_WARRANTY_CLAIM'
  | 'CLOSE_WARRANTY';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S12 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - INITIATE: Service or Admin. Requires ACTIVE status.
 * - APPROVE/REJECT: Management or Admin. Requires CLAIM status.
 * - CLOSE: Management or Admin. Requires EXPIRED status.
 */
export const getS12ActionState = (role: UserRole, context: S12Context, action: S12ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isService = role === UserRole.SERVICE || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.dispatchDependency === 'BLOCKED') {
    return { enabled: false, reason: 'Dispatch (S11) Incomplete' };
  }

  switch (action) {
    case 'VIEW_WARRANTY_DETAILS':
      if (isService || isManagement) return { enabled: true };
      return { enabled: false, reason: 'Access Denied' };

    case 'INITIATE_WARRANTY_CLAIM':
      if (!isService) return { enabled: false, reason: 'Requires Service Role' };
      if (context.lifecycleStatus !== 'ACTIVE') return { enabled: false, reason: 'Warranty Not Active' };
      return { enabled: true };

    case 'APPROVE_WARRANTY_CLAIM':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (context.lifecycleStatus !== 'CLAIM') return { enabled: false, reason: 'No Active Claim' };
      return { enabled: true };

    case 'REJECT_WARRANTY_CLAIM':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (context.lifecycleStatus !== 'CLAIM') return { enabled: false, reason: 'No Active Claim' };
      return { enabled: true };

    case 'CLOSE_WARRANTY':
      if (!isManagement) return { enabled: false, reason: 'Requires Plant Director' };
      if (context.lifecycleStatus !== 'EXPIRED') return { enabled: false, reason: 'Warranty Not Expired' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
