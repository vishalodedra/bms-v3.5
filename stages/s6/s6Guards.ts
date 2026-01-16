import { UserRole } from '../../types';
import { S6Context } from './s6Contract';

/**
 * S6 Action Identifiers
 * Lifecycle operations for Module Quality Assurance.
 */
export type S6ActionId = 
  | 'START_SESSION'
  | 'LOG_OBSERVATION'
  | 'SUBMIT_PASS'
  | 'SUBMIT_REWORK'
  | 'SUBMIT_REJECT';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S6 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START_SESSION: QA or Admin, when IDLE.
 * - LOG_OBSERVATION: QA or Admin, when INSPECTING.
 * - SUBMIT_PASS: QA or Admin, when INSPECTING.
 * - SUBMIT_REWORK: QA, Supervisor, or Admin, when INSPECTING.
 * - SUBMIT_REJECT: Supervisor or Admin (Escalation), when INSPECTING.
 */
export const getS6ActionState = (role: UserRole, context: S6Context, action: S6ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isQA = role === UserRole.QA_ENGINEER || isAdmin;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;

  // Global Dependency Check: Cannot inspect if S5 (Assembly) is blocked/down
  if (context.assemblyDependency === 'BLOCKED') {
      return { enabled: false, reason: 'Upstream Assembly (S5) Blocked' };
  }

  switch (action) {
    case 'START_SESSION':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.qaStatus !== 'IDLE') return { enabled: false, reason: 'Session already active' };
      return { enabled: true };

    case 'LOG_OBSERVATION': // For checklist items (Thumbs Up/Down)
      if (!isQA) return { enabled: false, reason: 'Read-only view' };
      if (context.qaStatus !== 'INSPECTING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'SUBMIT_PASS':
      if (!isQA) return { enabled: false, reason: 'Requires QA Role' };
      if (context.qaStatus !== 'INSPECTING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'SUBMIT_REWORK':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA/Sup Role' };
      if (context.qaStatus !== 'INSPECTING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    case 'SUBMIT_REJECT':
      if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Authorization' };
      if (context.qaStatus !== 'INSPECTING') return { enabled: false, reason: 'No active inspection' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
