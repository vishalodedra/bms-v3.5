import { UserRole } from '../../types';
import { S1Context } from './s1Contract';

/**
 * S1 Action Identifiers
 * Lifecycle operations for Product Definition.
 */
export type S1ActionId = 
  | 'CREATE_SKU'
  | 'EDIT_BLUEPRINT'
  | 'SUBMIT_FOR_REVIEW'
  | 'APPROVE_BLUEPRINT'
  | 'PUBLISH_SKU_BLUEPRINT';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S1 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - EDIT/SUBMIT: Engineering only, DRAFT only.
 * - APPROVE: Management/Compliance, REVIEW only.
 * - PUBLISH: Management/Admin, APPROVED only.
 */
export const getS1ActionState = (role: UserRole, context: S1Context, action: S1ActionId): ActionState => {
  const isEngineering = role === UserRole.ENGINEERING || role === UserRole.SYSTEM_ADMIN;
  const isApprover = role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE || role === UserRole.SYSTEM_ADMIN;
  const isPublisher = role === UserRole.MANAGEMENT || role === UserRole.SYSTEM_ADMIN;

  switch (action) {
    case 'CREATE_SKU':
      // Creation allowed in any state, but restricted by role
      if (isEngineering) return { enabled: true };
      return { enabled: false, reason: 'Requires Engineering or Admin Role' };

    case 'EDIT_BLUEPRINT':
      if (!isEngineering) return { enabled: false, reason: 'Requires Engineering Role' };
      if (context.approvalStatus !== 'DRAFT') return { enabled: false, reason: `Locked in ${context.approvalStatus} State` };
      return { enabled: true };

    case 'SUBMIT_FOR_REVIEW':
      if (!isEngineering) return { enabled: false, reason: 'Requires Engineering Role' };
      if (context.approvalStatus !== 'DRAFT') return { enabled: false, reason: 'Not in Draft State' };
      return { enabled: true };

    case 'APPROVE_BLUEPRINT':
      if (!isApprover) return { enabled: false, reason: 'Requires Approver Role' };
      if (context.approvalStatus !== 'REVIEW') return { enabled: false, reason: 'Nothing to Review' };
      return { enabled: true };

    case 'PUBLISH_SKU_BLUEPRINT':
      if (!isPublisher) return { enabled: false, reason: 'Requires Management Role' };
      if (context.approvalStatus !== 'APPROVED') return { enabled: false, reason: 'Blueprint Not Approved' };
      return { enabled: true };
      
    default:
      return { enabled: false, reason: 'Unknown Action ID' };
  }
};
