
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
 * Updates (V34-S4-FIX-01):
 * - Removed global 'planningStatus' checks. Planning is now batch-scoped.
 * - Create/Edit/Lock/Release availability is now determined by Role and Upstream Dependencies.
 * - Specific batch state validation (Draft vs Approved) is handled by BatchFlowGuards.
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
      // Always enabled if role is correct and upstream is OK. Batch isolation allows parallel planning.
      return { enabled: true };

    case 'EDIT_BATCH_PLAN':
      if (!isPlanner) return { enabled: false, reason: 'Requires Production Planner Role' };
      return { enabled: true };

    case 'LOCK_BATCH_PLAN':
      if (!isDirector) return { enabled: false, reason: 'Requires Plant Director Role' };
      return { enabled: true };

    case 'RELEASE_BATCHES_TO_LINE':
      if (!isDirector) return { enabled: false, reason: 'Requires Plant Director Role' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
