import { UserRole } from '../../types';
import { S0Context } from './s0Contract';

/**
 * S0 Action Identifiers
 * Enumerates distinct operations available within the System Setup stage.
 */
export type S0ActionId = 
  | 'EDIT_PLANT_DETAILS'
  | 'MANAGE_LINES'
  | 'UPDATE_REGULATIONS'
  | 'SYNC_SOP';

/**
 * Action State Interface
 * Describes whether an action is permissible and the reasoning if blocked.
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S0 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * Pure logic function; does not execute side effects.
 * 
 * @param role The current user's role
 * @param context The current S0 stage context (e.g. status)
 * @param action The specific action being requested
 */
export const getS0ActionState = (role: UserRole, context: S0Context, action: S0ActionId): ActionState => {
  // 1. Global Safety Interlock: Maintenance Mode
  // If the system is in maintenance, essentially all configuration is locked.
  if (context.status === 'MAINTENANCE') {
    return { enabled: false, reason: 'System is in Maintenance Mode' };
  }

  // 2. Role-Based Access Control (RBAC) per Action
  switch (action) {
    case 'EDIT_PLANT_DETAILS':
      // Critical infrastructure details: Admin only.
      if (role === UserRole.SYSTEM_ADMIN) {
        return { enabled: true };
      }
      return { enabled: false, reason: 'Requires System Admin Privileges' };
    
    case 'MANAGE_LINES':
      // Operational configuration: Admin or Plant Management.
      if (role === UserRole.SYSTEM_ADMIN || role === UserRole.MANAGEMENT) {
        return { enabled: true };
      }
      return { enabled: false, reason: 'Restricted to Admin & Management' };

    case 'UPDATE_REGULATIONS':
      // Compliance settings: Admin, Management, or Compliance Officer.
      if (
        role === UserRole.SYSTEM_ADMIN || 
        role === UserRole.MANAGEMENT || 
        role === UserRole.COMPLIANCE
      ) {
        return { enabled: true };
      }
      return { enabled: false, reason: 'Requires Compliance or Admin Role' };

    case 'SYNC_SOP':
      // Technical sync: Admin only.
      if (role === UserRole.SYSTEM_ADMIN) {
        return { enabled: true };
      }
      return { enabled: false, reason: 'Admin Only' };
      
    default:
      return { enabled: false, reason: 'Unknown Action ID' };
  }
};
