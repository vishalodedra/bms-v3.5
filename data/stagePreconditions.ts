export type PreconditionStatus = 'MET' | 'NOT_MET' | 'NA';

export interface PreconditionItem {
  id: string;
  label: string;
  status: PreconditionStatus;
  note?: string;
}

export const STAGE_PRECONDITIONS: Record<string, PreconditionItem[]> = {
  'S0': [
    { id: 'p1', label: 'Admin Authentication', status: 'MET', note: 'Session Valid' },
    { id: 'p2', label: 'Configuration Write Access', status: 'MET', note: 'Role Check Passed' }
  ],
  'S1': [
    { id: 'p1', label: 'Engineering Change Request (ECR)', status: 'MET', note: 'Approved' },
    { id: 'p2', label: 'PLM Synchronization', status: 'MET', note: 'Last Sync: 10m ago' },
    { id: 'p3', label: 'Regulatory Database Link', status: 'NOT_MET', note: 'AIS-156 DB Offline' }
  ],
  'S2': [
    { id: 'p1', label: 'Vendor Qualification', status: 'MET', note: 'Active Status' },
    { id: 'p2', label: 'Budget Allocation', status: 'MET', note: 'Q1 CapEx' },
    { id: 'p3', label: 'ERP Integration', status: 'NOT_MET', note: 'Connector Timeout' }
  ],
  'S3': [
    { id: 'p1', label: 'Purchase Order Exists', status: 'MET', note: 'PO-9921 Found' },
    { id: 'p2', label: 'Dock Door Assignment', status: 'MET', note: 'Door 4 Reserved' },
    { id: 'p3', label: 'Scanner Connectivity', status: 'MET' }
  ],
  'S4': [
    { id: 'p1', label: 'Demand Signal Received', status: 'MET', note: 'ERP Push' },
    { id: 'p2', label: 'BOM Validation', status: 'MET', note: 'Rev A.2' },
    { id: 'p3', label: 'Line Capacity Check', status: 'NOT_MET', note: 'Line B Maintenance' }
  ],
  'S5': [
    { id: 'p1', label: 'Line Clearance', status: 'MET', note: 'Shift Handoff OK' },
    { id: 'p2', label: 'Material Feed', status: 'MET', note: 'Kitting Complete' },
    { id: 'p3', label: 'Operator Certification', status: 'MET', note: 'Level 2 Required' },
    { id: 'p4', label: 'Torque Tool Calibration', status: 'NOT_MET', note: 'Tool ID #442 Expired' }
  ],
  'S6': [
    { id: 'p1', label: 'Module Completion Signal', status: 'MET', note: 'From S5' },
    { id: 'p2', label: 'Test Equipment Ready', status: 'MET', note: 'Hi-Pot / IR' },
    { id: 'p3', label: 'QA Environment', status: 'MET', note: 'Temp/Humidity OK' }
  ],
  'S7': [
    { id: 'p1', label: 'Module Batches QA Cleared', status: 'MET', note: '4/4 Modules OK' },
    { id: 'p2', label: 'Enclosure Sealant Prep', status: 'MET', note: 'Robot Ready' },
    { id: 'p3', label: 'Safety Curtain Active', status: 'NOT_MET', note: 'Sensor Clean Req' }
  ],
  'S8': [
    { id: 'p1', label: 'EOL Test Data Uploaded', status: 'MET', note: '100% Coverage' },
    { id: 'p2', label: 'Visual Inspection Images', status: 'MET', note: 'Archived' },
    { id: 'p3', label: 'Final Weight Check', status: 'MET', note: 'Within Tolerance' }
  ],
  'S9': [
    { id: 'p1', label: 'Production Ledger Finalized', status: 'MET', note: 'S8 Handoff' },
    { id: 'p2', label: 'Digital Twin Schema', status: 'MET', note: 'V2.1 Valid' },
    { id: 'p3', label: 'Cloud Sync', status: 'MET', note: 'Connected' }
  ],
  'S10': [
    { id: 'p1', label: 'BMS Hardware ID Scan', status: 'MET', note: 'Verified' },
    { id: 'p2', label: 'Firmware Binary Loaded', status: 'MET', note: 'v2.4.1 Cached' },
    { id: 'p3', label: 'CAN-BUS Link', status: 'NOT_MET', note: 'No Heartbeat' }
  ],
  'S11': [
    { id: 'p1', label: 'Warehouse Zone Allocation', status: 'MET', note: 'Zone C Open' },
    { id: 'p2', label: 'Pallet ID Generation', status: 'MET', note: 'Sequence OK' }
  ],
  'S12': [
    { id: 'p1', label: 'Picking Order', status: 'MET', note: 'Pick List #402' },
    { id: 'p2', label: 'Packaging Material', status: 'MET', note: 'Box Type D Available' },
    { id: 'p3', label: 'Label Printer', status: 'MET', note: 'Online' }
  ],
  'S13': [
    { id: 'p1', label: 'Shipment Manifest Finalized', status: 'MET', note: 'Weight Verified' },
    { id: 'p2', label: 'Customer Credit Check', status: 'MET', note: 'Finance API' },
    { id: 'p3', label: 'E-Way Bill Generation', status: 'NOT_MET', note: 'GST Portal Lag' }
  ],
  'S14': [
    { id: 'p1', label: 'Gate Pass Authorized', status: 'MET', note: 'Security Clearance' },
    { id: 'p2', label: 'Vehicle Verification', status: 'MET', note: 'Plate # Matches' },
    { id: 'p3', label: 'Driver Authentication', status: 'MET', note: 'ID Scanned' }
  ],
  'S15': [
    { id: 'p1', label: 'RMA Request Valid', status: 'MET', note: 'Ticket #992' },
    { id: 'p2', label: 'Warranty Entitlement Check', status: 'MET', note: 'Coverage Active' },
    { id: 'p3', label: 'Safety Intake Form', status: 'NOT_MET', note: 'Pending Hazmat Check' }
  ],
  'S16': [
    { id: 'p1', label: 'Hazardous Waste Permit', status: 'MET', note: 'Valid 2026' },
    { id: 'p2', label: 'Chemist On-Site', status: 'MET', note: 'Shift A' },
    { id: 'p3', label: 'Sorting Bin Capacity', status: 'NOT_MET', note: 'Bin A Full' }
  ],
  'S17': [
    { id: 'p1', label: 'Audit Log Integrity', status: 'MET', note: 'Chain Valid' },
    { id: 'p2', label: 'Regulatory Schema', status: 'MET', note: 'Latest Definitions' }
  ]
};
