import { UserRole } from '../../types';
import { S3Context } from './s3Contract';

/**
 * S3 Action Identifiers
 * Lifecycle operations for Inbound Receipt & Serialization.
 */
export type S3ActionId = 
  | 'RECORD_RECEIPT'
  | 'START_INSPECTION'
  | 'COMPLETE_INSPECTION'
  | 'START_SERIALIZATION'
  | 'MOVE_TO_STORAGE';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S3 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 */
export const getS3ActionState = (role: UserRole, context: S3Context, action: S3ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isStores = role === UserRole.STORES || isAdmin;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;
  const isQA = role === UserRole.QA_ENGINEER || isAdmin;
  
  // Dependency Check
  if (context.procurementDependency === 'BLOCKED') {
      return { enabled: false, reason: 'Procurement Dependency Blocked' };
  }

  switch (action) {
    case 'RECORD_RECEIPT':
      if (!isStores && !isSupervisor) return { enabled: false, reason: 'Requires Stores Role' };
      if (context.inboundStatus !== 'AWAITING_RECEIPT') return { enabled: false, reason: 'Receipt already recorded' };
      return { enabled: true };

    case 'START_INSPECTION':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA Role' };
      if (context.inboundStatus !== 'INSPECTION') return { enabled: false, reason: 'Not ready for Inspection' };
      return { enabled: true };

    case 'COMPLETE_INSPECTION':
        if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA Role' };
        if (context.inboundStatus !== 'INSPECTION') return { enabled: false, reason: 'Inspection not active' };
        return { enabled: true };

    case 'START_SERIALIZATION':
      // Operator or Stores can serialize
      if (!isStores && !isSupervisor && role !== UserRole.OPERATOR) return { enabled: false, reason: 'Requires Stores/Ops Role' };
      if (context.inboundStatus !== 'SERIALIZATION') return { enabled: false, reason: 'Serialization not active' };
      return { enabled: true };

    case 'MOVE_TO_STORAGE':
      if (!isStores && !isSupervisor) return { enabled: false, reason: 'Requires Stores Role' };
      if (context.inboundStatus !== 'STORED') return { enabled: false, reason: 'Not ready for Storage' };
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
