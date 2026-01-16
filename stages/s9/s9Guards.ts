import { UserRole } from '../../types';
import { S9Context } from './s9Contract';

/**
 * S9 Action Identifiers
 * Lifecycle operations for Final QA & Registry.
 */
export type S9ActionId = 
  | 'START_FINAL_QA'
  | 'COMPLETE_FINAL_QA'
  | 'MARK_FINAL_APPROVE'
  | 'MARK_FINAL_REJECT'
  | 'RELEASE_TO_PACKING';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S9 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START_FINAL_QA: QA or Admin, when IDLE. Requires S8 Aging dependency OK.
 * - COMPLETE/MARK: QA or Admin, when CHECKING.
 * - RELEASE: Management or Admin, when APPROVED.
 */
export const getS9ActionState = (role: UserRole, context: S9Context, action: S9ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isQA = role === UserRole.QA_ENGINEER || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.agingDependency === 'BLOCKED' && action === 'START_FINAL_QA') {
    return { enabled: false, reason: 'Aging (S8) Incomplete' };
  }

  switch (action) {
    case 'START_FINAL_QA':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.finalQaStatus !== 'IDLE') return { enabled: false, reason: 'Session Active or Complete' };
      return { enabled: true };

    case 'COMPLETE_FINAL_QA':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.finalQaStatus !== 'CHECKING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'MARK_FINAL_APPROVE':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.finalQaStatus !== 'CHECKING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'MARK_FINAL_REJECT':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.finalQaStatus !== 'CHECKING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'RELEASE_TO_PACKING':
      if (!isManagement) return { enabled: false, reason: 'Requires Management/Lead' };
      if (context.finalQaStatus !== 'APPROVED') return { enabled: false, reason: 'Pack Not Approved' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
