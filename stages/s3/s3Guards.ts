
import { UserRole } from '../../types';
import { S3Context } from './s3Contract';

/**
 * S3 Action Identifiers
 * Lifecycle operations for Inbound Receipt & Serialization.
 */
export type S3ActionId = 
  | 'RECORD_RECEIPT'
  | 'VERIFY_SERIALIZATION'
  | 'START_QC'
  | 'COMPLETE_QC'
  | 'RELEASE_INVENTORY'
  | 'BLOCK_INVENTORY'
  | 'SCRAP_INVENTORY';

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
 * 
 * Strict Flow:
 * 1. AWAITING_RECEIPT -> RECORD_RECEIPT -> RECEIVED
 * 2. RECEIVED -> VERIFY_SERIALIZATION -> SERIALIZED
 * 3. SERIALIZED -> START_QC -> QC_PENDING
 * 4. QC_PENDING -> COMPLETE_QC -> DISPOSITION
 * 5. DISPOSITION -> RELEASE/BLOCK/SCRAP -> COMPLETED/BLOCKED
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

    case 'VERIFY_SERIALIZATION':
      // Verify/Generate serials happens AFTER Receipt but BEFORE QC
      if (!isStores && !isSupervisor && role !== UserRole.OPERATOR) return { enabled: false, reason: 'Requires Stores/Ops Role' };
      if (context.inboundStatus !== 'RECEIVED') return { enabled: false, reason: 'Material not received' };
      return { enabled: true };

    case 'START_QC':
      if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA Role' };
      // QC starts only after serialization is verified
      if (context.inboundStatus !== 'SERIALIZED') return { enabled: false, reason: 'Serialization not verified' };
      return { enabled: true };

    case 'COMPLETE_QC':
        if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA Role' };
        if (context.inboundStatus !== 'QC_PENDING') return { enabled: false, reason: 'QC Inspection not active' };
        return { enabled: true };

    case 'RELEASE_INVENTORY':
      if (!isStores && !isSupervisor) return { enabled: false, reason: 'Requires Stores Role' };
      if (context.inboundStatus !== 'DISPOSITION') return { enabled: false, reason: 'Pending QC Disposition' };
      return { enabled: true };

    case 'BLOCK_INVENTORY':
        if (!isQA && !isSupervisor) return { enabled: false, reason: 'Requires QA/Sup Role' };
        if (context.inboundStatus !== 'DISPOSITION') return { enabled: false, reason: 'Pending QC Disposition' };
        return { enabled: true };

    case 'SCRAP_INVENTORY':
        if (!isSupervisor) return { enabled: false, reason: 'Requires Supervisor Role' };
        // Can scrap if blocked or during disposition
        if (context.inboundStatus !== 'DISPOSITION') return { enabled: false, reason: 'Pending QC Disposition' };
        return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
