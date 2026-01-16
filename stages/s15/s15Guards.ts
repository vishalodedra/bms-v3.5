import { UserRole } from '../../types';
import { S15Context } from './s15Contract';

/**
 * S15 Action Identifiers
 * Lifecycle operations for Compliance & ESG Reporting.
 */
export type S15ActionId = 
  | 'VIEW_COMPLIANCE_SNAPSHOT'
  | 'GENERATE_SNAPSHOT'
  | 'REQUEST_MISSING_EVIDENCE'
  | 'MARK_EVIDENCE_COLLECTED'
  | 'SUBMIT_COMPLIANCE_REPORT';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S15 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - VIEW: All authorized roles.
 * - GENERATE: Compliance, ESG (Sustainability), Admin. IDLE only.
 * - REQUEST/MARK EVIDENCE: Compliance, Admin. NEEDS_EVIDENCE only.
 * - SUBMIT: Compliance, Management (Director), Admin. READY only.
 * 
 * Dependencies:
 * - S14 (Circular Economy) must be cleared (OK) for generation.
 * - Submitted reports are locked (read-only).
 */
export const getS15ActionState = (role: UserRole, context: S15Context, action: S15ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isCompliance = role === UserRole.COMPLIANCE || isAdmin;
  const isESG = role === UserRole.SUSTAINABILITY || isAdmin;
  const isManagement = role === UserRole.MANAGEMENT || isAdmin;

  // Global Dependency Check
  if (context.circularDependency === 'BLOCKED' && action !== 'VIEW_COMPLIANCE_SNAPSHOT') {
    return { enabled: false, reason: 'S14 Circular Process Incomplete' };
  }

  // Submitted State Lock
  if (context.complianceStatus === 'SUBMITTED' && action !== 'VIEW_COMPLIANCE_SNAPSHOT') {
    return { enabled: false, reason: 'Report Already Submitted' };
  }

  switch (action) {
    case 'VIEW_COMPLIANCE_SNAPSHOT':
      return { enabled: true };

    case 'GENERATE_SNAPSHOT':
      if (!isCompliance && !isESG) return { enabled: false, reason: 'Requires Compliance/ESG Role' };
      if (context.complianceStatus !== 'IDLE') return { enabled: false, reason: 'Snapshot already active' };
      return { enabled: true };

    case 'REQUEST_MISSING_EVIDENCE':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Role' };
      if (context.complianceStatus !== 'NEEDS_EVIDENCE') return { enabled: false, reason: 'No evidence pending' };
      return { enabled: true };

    case 'MARK_EVIDENCE_COLLECTED':
      if (!isCompliance) return { enabled: false, reason: 'Requires Compliance Role' };
      if (context.complianceStatus !== 'NEEDS_EVIDENCE') return { enabled: false, reason: 'No evidence pending' };
      return { enabled: true };

    case 'SUBMIT_COMPLIANCE_REPORT':
      if (!isCompliance && !isManagement) return { enabled: false, reason: 'Requires Compliance/Director' };
      if (context.complianceStatus !== 'READY') return { enabled: false, reason: 'Report not ready' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
