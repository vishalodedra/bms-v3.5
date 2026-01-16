/**
 * S3 Inbound Receipt - Stage Contract
 * Defines the data shape for the Inbound Logistics context.
 */

export interface S3Context {
  inboundShipmentCount: number;
  lotsAwaitingInspectionCount: number;
  itemsAwaitingSerializationCount: number;
  serializedItemsCount: number;
  lastReceiptAt: string;
  inboundStatus: 'AWAITING_RECEIPT' | 'INSPECTION' | 'SERIALIZATION' | 'STORED';
  procurementDependency: 'OK' | 'BLOCKED';
}

/**
 * Returns deterministic mock data for S3 context.
 * Used for frontend development and vibe coding.
 */
export const getMockS3Context = (): S3Context => ({
  inboundShipmentCount: 3,
  lotsAwaitingInspectionCount: 0,
  itemsAwaitingSerializationCount: 0,
  serializedItemsCount: 4500,
  lastReceiptAt: '2026-01-11 08:30 IST',
  inboundStatus: 'AWAITING_RECEIPT', // Start of flow
  procurementDependency: 'OK'
});
