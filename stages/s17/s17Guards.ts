import { UserRole } from '../../types';
import { S17Context } from './s17Contract';

/**
 * S17 Action Identifiers
 * Lifecycle operations for System Closure & Archiving.
 */
export type S17ActionId = 
  | 'PREPARE_ARCHIVE'
  | 'START_ARCHIVE'
  | 'COMPLETE_ARCHIVE'
  | 'EXPORT_CLOSURE_PACKAGE'
  | 'CLOSE_PROGRAM';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S17 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Flow: IDLE -> READY -> ARCHIVING -> ARCHIVED -> CLOSED
 * 
 * Rules:
 * - PREPARE: Compliance, Admin. IDLE only. Requires Audit (S16) OK.
 * - START: Compliance, Admin. READY only.
 * - COMPLETE: Compliance, Admin. ARCHIVING only.
 * - EXPORT: Compliance, Management, Admin. ARCHIVED only.
 * - CLOSE_PROGRAM: Management (Director), Admin. ARCHIVED only.
 */
export const getS17ActionState = (role: UserRole, context: S17Context, action: S17ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isCompliance = role === UserRole.COMPLIANCE || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.auditDependency === 'BLOCKED' && action === 'PREPARE_ARCHIVE') {
    return { enabled: false, reason: 'Audit (S16) Not Cleared' };
  }

  switch (action) {
    case 'PREPARE_ARCHIVE':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Role' };
      if (context.closureStatus !== 'IDLE') return { enabled: false, reason: 'Preparation already done' };
      return { enabled: true };

    case 'START_ARCHIVE':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Role' };
      if (context.closureStatus !== 'READY') return { enabled: false, reason: 'Not Ready for Archival' };
      return { enabled: true };

    case 'COMPLETE_ARCHIVE':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Role' };
      if (context.closureStatus !== 'ARCHIVING') return { enabled: false, reason: 'Archiving not in progress' };
      return { enabled: true };

    case 'EXPORT_CLOSURE_PACKAGE':
      if (!isManagement && !isCompliance) return { enabled: false, reason: 'Requires Mgmt/Compliance' };
      if (context.closureStatus !== 'ARCHIVED') return { enabled: false, reason: 'Not Archived' };
      return { enabled: true };

    case 'CLOSE_PROGRAM':
      if (!isManagement) return { enabled: false, reason: 'Requires Plant Director' };
      if (context.closureStatus !== 'ARCHIVED') return { enabled: false, reason: 'Archive Incomplete' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
