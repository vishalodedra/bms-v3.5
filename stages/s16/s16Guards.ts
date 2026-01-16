import { UserRole } from '../../types';
import { S16Context } from './s16Contract';

/**
 * S16 Action Identifiers
 * Lifecycle operations for Audit & Governance.
 */
export type S16ActionId = 
  | 'START_AUDIT_REVIEW'
  | 'RAISE_FINDING'
  | 'MARK_FINDING_RESOLVED'
  | 'CLOSE_AUDIT'
  | 'EXPORT_AUDIT_PACK';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S16 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START_AUDIT_REVIEW: Auditor (Mgmt) or Admin. IDLE only. Requires S15 OK.
 * - RAISE_FINDING: Auditor (Mgmt) or Admin. REVIEWING only.
 * - MARK_FINDING_RESOLVED: Compliance Officer or Admin. FINDINGS only.
 * - CLOSE_AUDIT: Plant Director (Mgmt) or Admin. RESOLVED only.
 * - EXPORT_AUDIT_PACK: Auditor or Admin. Any state except IDLE.
 */
export const getS16ActionState = (role: UserRole, context: S16Context, action: S16ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  // Auditor roles: Management (External/Internal Auditor)
  const isAuditor = role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE || isAdmin;
  const isCompliance = role === UserRole.COMPLIANCE || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.complianceDependency === 'BLOCKED' && action === 'START_AUDIT_REVIEW') {
    return { enabled: false, reason: 'Compliance Report (S15) Missing' };
  }

  switch (action) {
    case 'START_AUDIT_REVIEW':
      if (!isAuditor) return { enabled: false, reason: 'Requires Auditor Role' };
      if (context.auditStatus !== 'IDLE') return { enabled: false, reason: 'Audit already active' };
      return { enabled: true };

    case 'RAISE_FINDING':
      if (!isAuditor) return { enabled: false, reason: 'Requires Auditor Role' };
      if (context.auditStatus !== 'REVIEWING') return { enabled: false, reason: 'Not in Review phase' };
      return { enabled: true };

    case 'MARK_FINDING_RESOLVED':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Officer' };
      if (context.auditStatus !== 'FINDINGS') return { enabled: false, reason: 'No active findings' };
      return { enabled: true };

    case 'CLOSE_AUDIT':
      if (!isManagement) return { enabled: false, reason: 'Requires Director Signoff' };
      if (context.auditStatus !== 'RESOLVED') return { enabled: false, reason: 'Findings not resolved' };
      return { enabled: true };

    case 'EXPORT_AUDIT_PACK':
      if (!isAuditor) return { enabled: false, reason: 'Requires Auditor Role' };
      if (context.auditStatus === 'IDLE') return { enabled: false, reason: 'No audit data generated' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
