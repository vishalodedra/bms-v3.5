/**
 * Runbook Read Model
 * 
 * Defines the shape of operational workflows (Runbooks) for the Control Tower visibility layer.
 * @seam V33-CORE-BP-41
 */

export type RunbookStatus = 'IDLE' | 'RUNNING' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type GateStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface RunbookGateRM {
  readonly gateId: string;
  readonly type: 'APPROVAL' | 'VALIDATION' | 'SYSTEM_CHECK';
  readonly label: string;
  readonly status: GateStatus;
  readonly requiredRole?: string;
}

export interface RunbookStageRM {
  readonly stageId: string;
  readonly label: string;
  readonly sequenceOrder: number;
  readonly status: 'PENDING' | 'ACTIVE' | 'DONE' | 'SKIPPED';
  readonly activeWorkerCount: number;
  readonly gates: RunbookGateRM[];
}

export interface RunbookRM {
  readonly runbookId: string;
  readonly title: string;
  readonly description: string;
  readonly status: RunbookStatus;
  readonly progressPercentage: number;
  readonly ownerRole: string;
  readonly currentStageId?: string;
  readonly stages: RunbookStageRM[];
  readonly startedAt?: string; // ISO 8601
  readonly lastActivityAt: string; // ISO 8601
}
