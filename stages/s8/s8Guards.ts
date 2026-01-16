import { UserRole } from '../../types';
import { S8Context } from './s8Contract';

/**
 * S8 Action Identifiers
 * Lifecycle operations for Aging & Soak process.
 */
export type S8ActionId = 
  | 'START_AGING_CYCLE'
  | 'START_SOAK_CYCLE'
  | 'COMPLETE_SOAK'
  | 'RELEASE_FROM_AGING';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S8 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START_AGING: QA or Supervisor, when IDLE. Dependency on S7.
 * - START_SOAK: QA or Supervisor, when AGING is done.
 * - COMPLETE_SOAK: QA or Supervisor, when SOAKING.
 * - RELEASE: Management or QA, when COMPLETED.
 */
export const getS8ActionState = (role: UserRole, context: S8Context, action: S8ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isQA = role === UserRole.QA_ENGINEER || isAdmin;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.s7Dependency === 'BLOCKED' && action === 'START_AGING_CYCLE') {
    return { enabled: false, reason: 'Pack Assembly (S7) Not Ready' };
  }

  switch (action) {
    case 'START_AGING_CYCLE':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA/Sup Role' };
      if (context.agingStatus !== 'IDLE') return { enabled: false, reason: 'Chamber Not IDLE' };
      return { enabled: true };

    case 'START_SOAK_CYCLE':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA/Sup Role' };
      if (context.agingStatus !== 'AGING') return { enabled: false, reason: 'Aging Phase Incomplete' };
      return { enabled: true };

    case 'COMPLETE_SOAK':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA/Sup Role' };
      if (context.agingStatus !== 'SOAKING') return { enabled: false, reason: 'Soak Phase Not Active' };
      return { enabled: true };

    case 'RELEASE_FROM_AGING':
      if (!isQA && !isManagement) return { enabled: false, reason: 'Requires QA Lead/Mgmt' };
      if (context.agingStatus !== 'COMPLETED') return { enabled: false, reason: 'Cycles Not Completed' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
