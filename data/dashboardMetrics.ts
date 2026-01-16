// Deterministic Mock Data for Dashboard Charts (EXT-PP-023)
// Reconciles with hardcoded KPI numbers in Dashboard.tsx

// A. WIP Trend (7 Days)
export const TREND_DATA = [
  { label: 'Mon', value: 145 },
  { label: 'Tue', value: 132 },
  { label: 'Wed', value: 168 },
  { label: 'Thu', value: 155 },
  { label: 'Fri', value: 182 },
  { label: 'Sat', value: 140 },
  { label: 'Sun', value: 115 },
];

// B. Stage Distribution (Reconciles with 1240 Total)
export const STAGE_DISTRIBUTION = [
  { label: 'S0-S2 (Plan)', value: 120, color: '#94a3b8' }, // Slate
  { label: 'S3-S4 (Inbound)', value: 210, color: '#60a5fa' }, // Blue
  { label: 'S5-S8 (Mfg)', value: 350, color: '#818cf8' }, // Indigo
  { label: 'S9-S10 (Trace)', value: 110, color: '#a78bfa' }, // Purple
  { label: 'S11+ (Out)', value: 450, color: '#34d399' }, // Emerald (Finished)
];

// C. Exceptions by Severity (Total 15 as per KPI)
export const EXCEPTION_DATA = [
  { label: 'Low', value: 8, color: '#94a3b8' },
  { label: 'Medium', value: 5, color: '#f59e0b' },
  { label: 'High', value: 2, color: '#ef4444' },
];

// D. Throughput vs Plan
export const THROUGHPUT_DATA = [
  { label: 'Line A', value: 420, value2: 450 }, // Actual vs Plan
  { label: 'Line B', value: 310, value2: 300 }, // Overachieved
  { label: 'Pack', value: 125, value2: 150 }, // Under
];

// E. Custody Distribution (Matches KPI A3)
export const CUSTODY_DATA = [
  { label: 'Warehouse', value: 450, color: '#3b82f6' },
  { label: 'Transit', value: 60, color: '#f59e0b' },
  { label: 'Customer', value: 790, color: '#10b981' },
  { label: 'EOL/Recycle', value: 15, color: '#64748b' },
];
