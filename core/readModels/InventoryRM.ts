/**
 * Inventory Read Model
 * 
 * Defines the shape of inventory data for high-level tracking and reporting.
 * Separate from transactional write models used in execution stages.
 * @seam V33-CORE-BP-41
 */

export interface InventoryCategorySummaryRM {
  readonly categoryId: string;
  readonly label: string;
  readonly totalCount: number;
  readonly trendDirection: 'UP' | 'DOWN' | 'FLAT';
  readonly statusDistribution: {
    good: number;
    hold: number;
    blocked: number;
    quarantine: number;
  };
}

export interface InventoryItemRM {
  readonly id: string;
  readonly sku: string;
  readonly description: string;
  readonly locationRef: string;
  readonly status: 'Good' | 'Hold' | 'Blocked' | 'Quarantine';
  readonly batchRef?: string;
  readonly entryDate: string; // ISO 8601
  readonly lastMovementDate?: string; // ISO 8601
  readonly tags: string[];
}
