import { UserRole } from '../../types';
import { S4Context } from './s4Contract';

/**
 * S4 Action Identifiers
 * Lifecycle operations for Batch Planning & Scheduling.
 */
export type S4ActionId = 
  | 'CREATE_BATCH_PLAN'
  | 'EDIT_BATCH_PLAN'
  | 'LOCK_BATCH_PLAN'
  | 'RELEASE_BATCHES_TO_LINE';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S4 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - CREATE/EDIT: Production Planner (PLANNER)
 * - LOCK/RELEASE: Plant Director (MANAGEMENT)
 * - Pre-requisite: Inbound Logistics (S3) must not be BLOCKED for creation/release.
 */
export const getS4ActionState = (role: UserRole, context: S4Context, action: S4ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isPlanner = role === UserRole.PLANNER || isAdmin;
  const isDirector = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.inboundDependency === 'BLOCKED' && (action === 'CREATE_BATCH_PLAN' || action === 'RELEASE_BATCHES_TO_LINE')) {
    return { enabled: false, reason: 'Inbound Logistics (S3) Not Ready' };
  }

  switch (action) {
    case 'CREATE_BATCH_PLAN':
      if (!isPlanner) return { enabled: false, reason: 'Requires Production Planner Role' };
      if (context.planningStatus !== 'NOT_PLANNED') return { enabled: false, reason: 'Planning phase already active' };
      return { enabled: true };

    case 'EDIT_BATCH_PLAN':
      if (!isPlanner) return { enabled: false, reason: 'Requires Production Planner Role' };
      if (context.planningStatus !== 'PLANNING') return { enabled: false, reason: 'Plan not in edit mode' };
      return { enabled: true };

    case 'LOCK_BATCH_PLAN':
      if (!isDirector) return { enabled: false, reason: 'Requires Plant Director Role' };
      // Correction: Locking is only possible when we are currently PLANNING.
      if (context.planningStatus !== 'PLANNING') return { enabled: false, reason: 'Plan not ready for lock (Must be in Planning)' };
      return { enabled: true };

    case 'RELEASE_BATCHES_TO_LINE':
      if (!isDirector) return { enabled: false, reason: 'Requires Plant Director Role' };
      if (context.planningStatus !== 'PLANNED') return { enabled: false, reason: 'Plan must be Locked first' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
