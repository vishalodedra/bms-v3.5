/**
 * System Health Read Model
 * 
 * Defines the shape of system monitoring data aggregated for dashboard display.
 * @seam V33-CORE-BP-41
 */

export type SystemStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'MAINTENANCE';

export interface SystemHealthRM {
  readonly status: SystemStatus;
  readonly uptimePercentage: number;
  readonly lastSyncTimestamp: string; // ISO 8601
  readonly activeSessionCount: number;
  readonly buildVersion: string;
  readonly services: {
    name: string;
    status: 'UP' | 'DOWN';
    latencyMs: number;
  }[];
}
