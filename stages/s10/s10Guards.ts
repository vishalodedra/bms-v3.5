import { UserRole } from '../../types';
import { S10Context } from './s10Contract';

/**
 * S10 Action Identifiers
 * Lifecycle operations for BMS Provisioning (Firmware & Identity).
 */
export type S10ActionId = 
  | 'START_SESSION'
  | 'FLASH_FIRMWARE'
  | 'VERIFY_CONFIG'
  | 'COMPLETE_PROVISIONING';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S10 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Domain Mapping (vs Prompt):
 * - Stock Check -> Firmware Repo Status
 * - Packing Actions -> Provisioning Actions
 * 
 * Rules:
 * - START_SESSION: Engineering, Supervisor, Admin. Requires S9 OK and Online Repo.
 * - FLASH_FIRMWARE: Operator, Engineering (Execution). Requires PROVISIONING state.
 * - VERIFY_CONFIG: Engineering, QA (Validation). Requires VERIFYING state.
 * - COMPLETE_PROVISIONING: Supervisor, Admin. Requires COMPLETED state (or end of Verify).
 */
export const getS10ActionState = (role: UserRole, context: S10Context, action: S10ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isEngineering = role === UserRole.ENGINEERING || isAdmin;
  const isSupervisor = role === UserRole.SUPERVISOR || isAdmin;
  const isOperator = role === UserRole.OPERATOR || isAdmin;
  const isQA = role === UserRole.QA_ENGINEER || isAdmin;

  // Global Dependencies
  if (context.registryDependency === 'BLOCKED') {
    return { enabled: false, reason: 'Registry (S9) Pre-requisites Not Met' };
  }

  switch (action) {
    case 'START_SESSION':
      if (!isEngineering && !isSupervisor) return { enabled: false, reason: 'Requires Engineering/Sup Role' };
      if (context.provisioningStatus !== 'IDLE') return { enabled: false, reason: 'Session Active or Complete' };
      if (context.firmwareRepoStatus === 'OFFLINE') return { enabled: false, reason: 'Firmware Repo Offline' };
      return { enabled: true };

    case 'FLASH_FIRMWARE':
      if (!isOperator && !isEngineering) return { enabled: false, reason: 'Requires Operator/Eng Role' };
      if (context.provisioningStatus !== 'PROVISIONING') return { enabled: false, reason: 'Not in Provisioning Mode' };
      return { enabled: true };

    case 'VERIFY_CONFIG':
      if (!isEngineering && !isQA) return { enabled: false, reason: 'Requires Engineering/QA Role' };
      // Allow verification during provisioning phase transition or specifically verifying
      if (context.provisioningStatus !== 'VERIFYING') return { enabled: false, reason: 'Flash Not Verified' };
      return { enabled: true };

    case 'COMPLETE_PROVISIONING':
      if (!isSupervisor && !isEngineering) return { enabled: false, reason: 'Requires Supervisor Signoff' };
      if (context.provisioningStatus !== 'COMPLETED' && context.provisioningStatus !== 'VERIFYING') {
         return { enabled: false, reason: 'Validation Incomplete' };
      }
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
