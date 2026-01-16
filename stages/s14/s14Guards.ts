import { UserRole } from '../../types';
import { S14Context } from './s14Contract';

/**
 * S14 Action Identifiers
 * Lifecycle operations for Circular Economy / Refurbish & Recycle.
 */
export type S14ActionId = 
  | 'START_INSPECTION'
  | 'MARK_FOR_REFURBISH'
  | 'MARK_FOR_RECYCLE'
  | 'COMPLETE_REFURBISH'
  | 'CLOSE_CIRCULAR_CASE';

/**
 * Action State Interface
 */
export interface ActionState {
  enabled: boolean;
  reason?: string;
}

/**
 * S14 Action Guard
 * Determines if a specific action is allowed based on Role and Context.
 * 
 * Rules:
 * - START_INSPECTION: Engineering (Ops), Admin. IDLE only.
 * - MARK_FOR_REFURBISH/RECYCLE: Sustainability (Mgr), Admin. INSPECTION only.
 * - COMPLETE_REFURBISH: Engineering, Admin. REFURBISH only.
 * - CLOSE_CIRCULAR_CASE: Management, Admin. RECYCLE or COMPLETED only.
 */
export const getS14ActionState = (role: UserRole, context: S14Context, action: S14ActionId): ActionState => {
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  const isEngineering = role === UserRole.ENGINEERING || isAdmin; // Circular Ops Engineer
  const isSustainability = role === UserRole.SUSTAINABILITY || isAdmin; // Recycling Manager
  const isManagement = role === UserRole.MANAGEMENT || isAdmin; // Plant Director

  // Global Dependency: Cannot start if Service/Returns (S13) is not cleared/ok
  if (context.serviceDependency === 'BLOCKED' && action === 'START_INSPECTION') {
    return { enabled: false, reason: 'Service/Returns (S13) dependency not met' };
  }

  switch (action) {
    case 'START_INSPECTION':
      if (!isEngineering) return { enabled: false, reason: 'Requires Engineering Role' };
      if (context.circularStatus !== 'IDLE') return { enabled: false, reason: 'Process already active' };
      return { enabled: true };

    case 'MARK_FOR_REFURBISH':
      if (!isSustainability) return { enabled: false, reason: 'Requires Sustainability Role' };
      if (context.circularStatus !== 'INSPECTION') return { enabled: false, reason: 'Not in Inspection' };
      return { enabled: true };

    case 'MARK_FOR_RECYCLE':
      if (!isSustainability) return { enabled: false, reason: 'Requires Sustainability Role' };
      if (context.circularStatus !== 'INSPECTION') return { enabled: false, reason: 'Not in Inspection' };
      return { enabled: true };

    case 'COMPLETE_REFURBISH':
      if (!isEngineering) return { enabled: false, reason: 'Requires Engineering Role' };
      if (context.circularStatus !== 'REFURBISH') return { enabled: false, reason: 'Refurbish not active' };
      return { enabled: true };

    case 'CLOSE_CIRCULAR_CASE':
      if (!isManagement) return { enabled: false, reason: 'Requires Director Role' };
      if (context.circularStatus !== 'RECYCLE' && context.circularStatus !== 'COMPLETED') {
        return { enabled: false, reason: 'Process not finalized' };
      }
      return { enabled: true };

    default:
      return { enabled: false, reason: 'Unknown Action' };
  }
};
