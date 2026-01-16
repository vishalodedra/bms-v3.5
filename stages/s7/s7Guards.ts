import { UserRole } from '../../types';
import { S7Context } from './s7Contract';

/**
 * S7 Action Identifiers
 * Lifecycle operations for Pack Assembly Workstation.
 * Includes inline Electrical QA checks (Hi-Pot/Insulation).
 */
export type S7ActionId = 
  | 'START_ASSEMBLY'
  | 'PAUSE_ASSEMBLY'
  | 'RESUME_ASSEMBLY'
  | 'COMPLETE_PACK'
  | 'REPORT_ISSUE'
  | 'ABORT_SESSION';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S7 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START/RESUME: Operator, Supervisor (Execution)
 * - PAUSE: Operator, Supervisor (Safety/Process)
 * - COMPLETE_PACK: Operator (Standard Work)
 * - ABORT: Supervisor, Admin (Escalation)
 * 
 * Dependencies:
 * - Module QA (S6) must be OK to start.
 */
export const getS7ActionState = (role: UserRole, context: S7Context, action: S7ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;
  const isOperator = role === UserRole.OPERATOR || isAdmin;

  // Global Dependency Check
  if (context.moduleQaDependency === 'BLOCKED' && action === 'START_ASSEMBLY') {
    return { enabled: false, reason: 'Module QA (S6) Dependency Failed' };
  }

  switch (action) {
    case 'START_ASSEMBLY':
      if (!isOperator && !isSupervisor) return { enabled: false, reason: 'Requires Operator/Sup Role' };
      if (context.assemblyStatus !== 'IDLE') return { enabled: false, reason: 'Line not IDLE' };
      return { enabled: true };

    case 'PAUSE_ASSEMBLY':
      if (!isOperator && !isSupervisor) return { enabled: false, reason: 'Requires Operator/Sup Role' };
      if (context.assemblyStatus !== 'ASSEMBLING') return { enabled: false, reason: 'Line not running' };
      return { enabled: true };

    case 'RESUME_ASSEMBLY':
      if (!isOperator && !isSupervisor) return { enabled: false, reason: 'Requires Operator/Sup Role' };
      if (context.assemblyStatus !== 'PAUSED') return { enabled: false, reason: 'Line not paused' };
      return { enabled: true };

    case 'COMPLETE_PACK':
      if (!isOperator) return { enabled: false, reason: 'Requires Operator Role' };
      if (context.assemblyStatus !== 'ASSEMBLING') return { enabled: false, reason: 'Line not running' };
      return { enabled: true };

    case 'REPORT_ISSUE':
      // Anyone with access can report an issue
      return { enabled: true };

    case 'ABORT_SESSION':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Authorization' };
      if (context.assemblyStatus === 'IDLE') return { enabled: false, reason: 'No active session' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
