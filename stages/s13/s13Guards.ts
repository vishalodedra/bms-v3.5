import { UserRole } from '../../types';
import { S13Context } from './s13Contract';

/**
 * S13 Action Identifiers
 * Lifecycle operations for Service & Returns (S13).
 */
export type S13ActionId = 
  | 'OPEN_SERVICE_REQUEST'
  | 'CLOSE_SERVICE_REQUEST'
  | 'INITIATE_RETURN'
  | 'CONFIRM_RETURN_RECEIPT'
  | 'CLOSE_SERVICE_CASE';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S13 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - OPEN_SERVICE_REQUEST: Service, Admin. IDLE only.
 * - CLOSE_SERVICE_REQUEST: Service, Admin. SERVICE_OPEN only.
 * - INITIATE_RETURN: Sustainability (Returns Mgr), Service, Admin. SERVICE_OPEN only.
 * - CONFIRM_RETURN_RECEIPT: Sustainability, Admin. RETURN_IN_PROGRESS only.
 * - CLOSE_SERVICE_CASE: Management, Admin. CLOSED only.
 */
export const getS13ActionState = (role: UserRole, context: S13Context, action: S13ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isService = role === UserRole.SERVICE || isAdmin;
  const isSustainability = role === UserRole.SUSTAINABILITY || isAdmin; // Acts as Returns Manager
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency: Warranty must be OK to open new requests
  if (context.warrantyDependency === 'BLOCKED' && action === 'OPEN_SERVICE_REQUEST') {
    return { enabled: false, reason: 'Warranty (S12) Blocked or Expired' };
  }

  switch (action) {
    case 'OPEN_SERVICE_REQUEST':
      if (!isService) return { enabled: false, reason: 'Requires Service Role' };
      if (context.serviceStatus !== 'IDLE') return { enabled: false, reason: 'Service Active' };
      return { enabled: true };

    case 'CLOSE_SERVICE_REQUEST':
      if (!isService) return { enabled: false, reason: 'Requires Service Role' };
      if (context.serviceStatus !== 'SERVICE_OPEN') return { enabled: false, reason: 'No Open Request' };
      return { enabled: true };

    case 'INITIATE_RETURN':
      // Service or Returns Mgr can initiate return
      if (!isSustainability && !isService) return { enabled: false, reason: 'Requires Svc/Returns Role' };
      if (context.serviceStatus !== 'SERVICE_OPEN') return { enabled: false, reason: 'No Open Request' };
      return { enabled: true };

    case 'CONFIRM_RETURN_RECEIPT':
      if (!isSustainability) return { enabled: false, reason: 'Requires Returns Mgr' };
      if (context.serviceStatus !== 'RETURN_IN_PROGRESS') return { enabled: false, reason: 'No Return In Transit' };
      return { enabled: true };

    case 'CLOSE_SERVICE_CASE':
      if (!isManagement) return { enabled: false, reason: 'Requires Management Role' };
      if (context.serviceStatus !== 'CLOSED') return { enabled: false, reason: 'Case Not Closed' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
