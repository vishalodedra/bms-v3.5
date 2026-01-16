import { UserRole } from '../../types';
import { S5Context } from './s5Contract';

/**
 * S5 Action Identifiers
 * Lifecycle operations for Module Assembly.
 */
export type S5ActionId = 
  | 'START_ASSEMBLY'
  | 'PAUSE_ASSEMBLY'
  | 'RESUME_ASSEMBLY'
  | 'COMPLETE_MODULE'
  | 'HANDOVER_TO_QA';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S5 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START/PAUSE/RESUME: Supervisor or Admin.
 * - COMPLETE_MODULE: Operator (Execution) or Admin.
 * - HANDOVER_TO_QA: Supervisor (Validation) or Admin.
 * 
 * Status Dependencies:
 * - IDLE -> START
 * - ASSEMBLING -> PAUSE, COMPLETE
 * - PAUSED -> RESUME
 * - COMPLETED -> HANDOVER
 */
export const getS5ActionState = (role: UserRole, context: S5Context, action: S5ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;
  const isOperator = role === UserRole.OPERATOR || isAdmin;

  // Global Dependency Check
  if (context.planningDependency === 'BLOCKED' && action === 'START_ASSEMBLY') {
    return { enabled: false, reason: 'Planning (S4) Not Ready' };
  }

  switch (action) {
    case 'START_ASSEMBLY':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Role' };
      if (context.assemblyStatus !== 'IDLE') return { enabled: false, reason: 'Line not IDLE' };
      return { enabled: true };

    case 'PAUSE_ASSEMBLY':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Role' };
      if (context.assemblyStatus !== 'ASSEMBLING') return { enabled: false, reason: 'Line not running' };
      return { enabled: true };

    case 'RESUME_ASSEMBLY':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Role' };
      if (context.assemblyStatus !== 'PAUSED') return { enabled: false, reason: 'Line not paused' };
      return { enabled: true };

    case 'COMPLETE_MODULE':
      if (!isOperator) return { enabled: false, reason: 'Requires Operator Role' };
      if (context.assemblyStatus !== 'ASSEMBLING') return { enabled: false, reason: 'Line not running' };
      return { enabled: true };

    case 'HANDOVER_TO_QA':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Role' };
      if (context.assemblyStatus !== 'COMPLETED') return { enabled: false, reason: 'Batch not completed' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
