import React, { useContext, useState } from 'react';
import { UserContext, UserRole, NavView, PATCH_ID } from '../types';
import { 
  Activity, 
  Battery, 
  Factory, 
  Truck, 
  Recycle, 
  Users, 
  Package, 
  Scale, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  BarChart3,
  PieChart,
  Info,
  AlertOctagon,
  FileBadge,
  User,
  MapPin,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileCheck,
  Gavel,
  LayoutDashboard,
  TrendingUp,
  ArrowRight,
  Zap,
  BarChart,
  Server,
  GitBranch,
  Database,
  Link,
  Terminal,
  FileText,
  ClipboardList,
  Radar,
  Lock
} from 'lucide-react';
import { 
  SimpleLineChart, 
  SimpleBarChart, 
  SimpleDonutChart, 
  GroupedBarChart, 
  ChartCard 
} from './charts/SimpleCharts';
import { 
  TREND_DATA, 
  STAGE_DISTRIBUTION, 
  EXCEPTION_DATA, 
  THROUGHPUT_DATA, 
  CUSTODY_DATA 
} from '../data/dashboardMetrics';

// --- Helper for Demo Caption ---
const DemoCaption: React.FC = () => (
  <span className="text-[10px] text-slate-400 font-normal normal-case bg-slate-100 px-2 py-0.5 rounded ml-2 border border-slate-200 cursor-help" title="Data is mocked for frontend demonstration. In production, this is driven by the backend.">
    Demo Data — Backend Driven
  </span>
);

// --- Operator Components ---

const ShiftFocusStrip: React.FC = () => (
  <div className="bg-slate-800 text-white rounded-lg p-4 shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
          <User size={10} aria-hidden="true" /> Active Shift
        </span>
        <div className="text-lg font-bold text-white flex items-center gap-2">
          Line A <span className="text-slate-500">/</span> Station 04
        </div>
      </div>
      
      <div className="hidden md:block w-px h-8 bg-slate-600"></div>

      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
          <Layers size={10} aria-hidden="true" /> Current Runbook
        </span>
        <div className="text-lg font-mono text-brand-400">
          S5: Module Assembly
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4 w-full md:w-auto">
       <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded border border-slate-600 justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-300 uppercase">Station Active</span>
       </div>
       <div className="flex-1 md:flex-none flex items-center gap-2 bg-red-900/30 px-3 py-2 rounded border border-red-900/50 justify-center">
          <AlertTriangle size={14} className="text-red-400" aria-hidden="true" />
          <span className="text-xs font-bold text-red-200">2 Exceptions</span>
       </div>
    </div>
  </div>
);

const OperatorAttention: React.FC = () => (
  <div className="bg-white rounded-lg border-l-4 border-amber-500 shadow-sm border-y border-r border-industrial-border p-4 animate-in fade-in duration-300">
     <div className="flex items-center gap-2 mb-3">
        <AlertOctagon size={18} className="text-amber-600" aria-hidden="true" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Attention Required</h3>
     </div>
     <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-amber-50 rounded border border-amber-100 text-sm gap-2">
           <div className="flex items-center gap-2">
              <span className="font-bold text-amber-800">S5 Gate Locked</span>
              <span className="text-amber-700">- Enclosure Seal Integrity Check Failed</span>
           </div>
           <button className="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded hover:bg-amber-100 transition-colors font-medium w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-amber-500">
              View QC Log
           </button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-sm gap-2">
           <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Waiting for Material</span>
              <span className="text-slate-500">- Station 04 Starved (Thermal Pads)</span>
           </div>
           <span className="text-xs text-slate-400 font-mono self-end sm:self-auto">ETA: 10m</span>
        </div>
     </div>
  </div>
);

// --- Supervisor / QA Components (EXT-PP-031) ---

const OversightFocusStrip: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-red-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Blocked Gates</div>
              <div className="text-2xl font-bold text-slate-800">2 <span className="text-xs font-normal text-slate-400">Total</span></div>
          </div>
          <AlertOctagon size={24} className="text-red-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-amber-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">On Hold</div>
              <div className="text-2xl font-bold text-slate-800">15 <span className="text-xs font-normal text-slate-400">Items</span></div>
          </div>
          <AlertTriangle size={24} className="text-amber-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-slate-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Exceptions</div>
              <div className="text-2xl font-bold text-slate-800">5 <span className="text-xs font-normal text-slate-400">Open</span></div>
          </div>
          <Activity size={24} className="text-slate-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-blue-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">SLA Risk</div>
              <div className="text-2xl font-bold text-slate-800">Low</div>
          </div>
          <Clock size={24} className="text-blue-200" aria-hidden="true" />
      </div>
  </div>
);

const ApprovalsList: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
              <Gavel size={16} className="text-brand-600" aria-hidden="true" />
              Approvals & Gating Attention
          </div>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">3 Pending</span>
      </div>
      <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                      <th className="px-4 py-2 text-xs font-bold uppercase">Context</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">Stage</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">Reason / Block</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">Age</th>
                      <th className="px-4 py-2 text-xs font-bold uppercase">Owner</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-700">Manufacturing Runbook</td>
                      <td className="px-4 py-2">S5 Module Assembly</td>
                      <td className="px-4 py-2 text-red-600 font-bold flex items-center gap-1"><AlertOctagon size={12} aria-hidden="true" /> Seal Integrity Check</td>
                      <td className="px-4 py-2 font-mono text-xs">2h 15m</td>
                      <td className="px-4 py-2 text-xs bg-slate-100 rounded w-fit px-2">Supervisor</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-700">Material Receipt</td>
                      <td className="px-4 py-2">S3 QC Inspection</td>
                      <td className="px-4 py-2 text-amber-600 font-bold flex items-center gap-1"><AlertTriangle size={12} aria-hidden="true" /> Quality Deviation</td>
                      <td className="px-4 py-2 font-mono text-xs">4h 30m</td>
                      <td className="px-4 py-2 text-xs bg-slate-100 rounded w-fit px-2">QC Engineer</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-700">Dispatch Chain</td>
                      <td className="px-4 py-2">S13 Authorization</td>
                      <td className="px-4 py-2 text-slate-600 font-medium flex items-center gap-1"><Clock size={12} aria-hidden="true" /> Pending Gate Pass</td>
                      <td className="px-4 py-2 font-mono text-xs">45m</td>
                      <td className="px-4 py-2 text-xs bg-slate-100 rounded w-fit px-2">Supervisor</td>
                  </tr>
              </tbody>
          </table>
      </div>
      <div className="p-2 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
          Read-only view. Use Control Tower to execute decisions.
      </div>
  </div>
);

// --- Plant Head Components (EXT-PP-032) ---

const PlantHealthStrip: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-md border border-slate-600 flex flex-col justify-between h-20">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
             <Factory size={10} aria-hidden="true" /> Active Lines
          </div>
          <div className="flex items-end justify-between">
             <div className="text-2xl font-bold">1<span className="text-slate-500 text-lg">/2</span></div>
             <div className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded border border-green-500/30">Running</div>
          </div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
             <BarChart3 size={10} aria-hidden="true" /> Throughput (Today)
          </div>
          <div className="flex items-end justify-between">
             <div className="text-2xl font-bold text-slate-800">1,240</div>
             <div className="text-[10px] text-green-600 font-bold flex items-center">
                <TrendingUp size={10} className="mr-0.5" aria-hidden="true" /> +4.2%
             </div>
          </div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-red-500 border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-red-600 uppercase font-bold tracking-wider">Blocked Gates</div>
          <div className="text-2xl font-bold text-slate-800">2</div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-amber-500 border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Exceptions</div>
          <div className="text-2xl font-bold text-slate-800">5</div>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg shadow-inner border border-slate-200 flex flex-col justify-between h-20 opacity-80 col-span-2 md:col-span-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
             <Zap size={10} aria-hidden="true" /> OEE (Aggregated)
          </div>
          <div className="text-lg font-mono font-bold text-slate-400">--- %</div>
          <div className="text-[9px] text-slate-400">Backend Computed</div>
      </div>
  </div>
);

const OEEReferencePanel: React.FC<{ onNavigate?: (view: NavView) => void }> = ({ onNavigate }) => (
  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between animate-in fade-in duration-300 gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
             <BarChart size={20} aria-hidden="true" />
          </div>
          <div>
             <h3 className="text-sm font-bold text-slate-800">OEE Performance Contract</h3>
             <p className="text-xs text-slate-500">Live calculation managed by backend data engineering.</p>
          </div>
      </div>
      
      <div className="flex gap-6 w-full md:w-auto justify-around">
          <div className="text-center">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Availability</div>
             <div className="font-mono font-bold text-slate-300">--- %</div>
          </div>
          <div className="text-center border-l border-slate-200 pl-6">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Performance</div>
             <div className="font-mono font-bold text-slate-300">--- %</div>
          </div>
          <div className="text-center border-l border-slate-200 pl-6">
             <div className="text-[10px] text-slate-400 uppercase font-bold">Quality</div>
             <div className="font-mono font-bold text-slate-300">--- %</div>
          </div>
      </div>

      <button 
         onClick={() => onNavigate && onNavigate('production_line')}
         className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded font-medium flex items-center gap-1 transition-colors w-full md:w-auto justify-center focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
         View Lines <ArrowRight size={12} aria-hidden="true" />
      </button>
  </div>
);

// --- Admin Components (EXT-PP-033) ---

const SystemGovernanceStrip: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-md border border-slate-600 flex flex-col justify-between h-20">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
             <Server size={10} aria-hidden="true" /> System Health
          </div>
          <div className="flex items-end justify-between">
             <div className="text-2xl font-bold text-emerald-400">99.9%</div>
             <div className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">OK</div>
          </div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
             <GitBranch size={10} aria-hidden="true" /> Build Version
          </div>
          <div className="flex items-end justify-between">
             <div className="text-sm font-mono font-bold text-slate-800 truncate">{PATCH_ID}</div>
             <div className="text-[10px] text-slate-400">Frontend V3.1</div>
          </div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-amber-500 border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Open Exceptions</div>
          <div className="text-2xl font-bold text-slate-800">5</div>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-blue-500 border-industrial-border flex flex-col justify-between h-20">
          <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Log Volume (24h)</div>
          <div className="text-2xl font-bold text-slate-800">12.4k</div>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg shadow-inner border border-slate-200 flex flex-col justify-between h-20 col-span-2 md:col-span-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
             <Link size={10} aria-hidden="true" /> Integrations
          </div>
          <div className="text-lg font-bold text-slate-600">3 <span className="text-xs font-normal text-slate-400">Pending</span></div>
      </div>
  </div>
);

const IntegrityReadinessPanel: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Database size={16} className="text-blue-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Data Integrity Signals (Placeholder)</h3>
          </div>
          <div className="space-y-2">
              <div className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Missing Trace IDs</span>
                  <span className="font-mono text-green-600 font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Orphaned Inventory Items</span>
                  <span className="font-mono text-slate-400">—</span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Custody Handshake Mismatches</span>
                  <span className="font-mono text-slate-400">—</span>
              </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 italic text-center">
              *Backend owned. Not asserted by frontend UI state.
          </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Terminal size={16} className="text-purple-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Integration Readiness</h3>
          </div>
          <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Dashboard Metrics API</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">PLANNED</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Logs Ingestion Stream</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">PLANNED</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Report Generation Service</span>
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">PLANNED</span>
              </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 italic text-center">
              Contract placeholders defined in docs/artifacts.ts
          </div>
      </div>
  </div>
);

// --- Auditor / Regulator Components (EXT-PP-034) ---

const AuditReadOnlyBanner: React.FC = () => (
  <div className="bg-slate-800 text-slate-200 p-3 rounded-lg border-l-4 border-l-emerald-500 shadow-md flex flex-col sm:flex-row items-center justify-between animate-in slide-in-from-top-2 duration-300 gap-2">
      <div className="flex items-center gap-3">
          <Lock size={20} className="text-emerald-400" aria-hidden="true" />
          <div>
              <div className="text-sm font-bold text-white uppercase tracking-wide">Read-only Audit View</div>
              <div className="text-xs text-slate-400">No operational actions available in this mode.</div>
          </div>
      </div>
      <div className="text-[10px] text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 w-full sm:w-auto text-center">
          Values are demo placeholders until backend evidence integration.
      </div>
  </div>
);

const AuditSnapshotStrip: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-purple-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Trace Coverage</div>
              <div className="text-2xl font-bold text-slate-800">100%</div>
          </div>
          <FileBadge size={24} className="text-purple-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-blue-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Custody Visibility</div>
              <div className="text-2xl font-bold text-slate-800">High</div>
          </div>
          <Users size={24} className="text-blue-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-amber-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Compliance Flags</div>
              <div className="text-2xl font-bold text-slate-800">3</div>
          </div>
          <ShieldCheck size={24} className="text-amber-200" aria-hidden="true" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-slate-500 border-industrial-border flex items-center justify-between">
          <div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Last Evidence Sync</div>
              <div className="text-lg font-mono font-bold text-slate-800">14:00 IST</div>
          </div>
          <Clock size={24} className="text-slate-200" aria-hidden="true" />
      </div>
  </div>
);

const EvidencePointers: React.FC<{ onNavigate: (view: NavView) => void }> = ({ onNavigate }) => (
  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <Link size={16} className="text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Evidence Pointers & References</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate('system_logs')}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
              <ClipboardList size={20} className="text-blue-500" aria-hidden="true" />
              <span className="text-xs font-bold">Inspect Logs (Audit Trail)</span>
          </button>
          <button 
            onClick={() => onNavigate('system_reports')}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
              <FileText size={20} className="text-purple-500" aria-hidden="true" />
              <span className="text-xs font-bold">Inspect Reports (Snapshots)</span>
          </button>
          <button 
            onClick={() => onNavigate('control_tower')}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
              <Radar size={20} className="text-brand-500" aria-hidden="true" />
              <span className="text-xs font-bold">Reference Runbooks (Process)</span>
          </button>
          <button 
            onClick={() => onNavigate('documentation')}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
              <ShieldCheck size={20} className="text-green-500" aria-hidden="true" />
              <span className="text-xs font-bold">Reference Rules & Contracts</span>
          </button>
      </div>
  </div>
);

// Data
const BOTTLENECK_DATA = [
  { label: 'Inbound', value: 12, color: '#94a3b8' },
  { label: 'Assembly', value: 45, color: '#f59e0b' }, // High accumulation
  { label: 'QA', value: 8, color: '#3b82f6' },
  { label: 'Pkg', value: 5, color: '#10b981' },
];

const EVENT_VOLUME_DATA = [
  { label: 'Workflow', value: 450, color: '#3b82f6' },
  { label: 'System', value: 1200, color: '#64748b' },
  { label: 'Compliance', value: 85, color: '#8b5cf6' },
  { label: 'Security', value: 12, color: '#ef4444' },
];

// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  const handleNav = (view: NavView) => {
     console.log("Navigating to", view); 
  };

  const { role } = useContext(UserContext);
  const [expandAnalytics, setExpandAnalytics] = useState(false);

  // Role Logic
  const isAuditor = role === UserRole.COMPLIANCE; // Strict Auditor
  const isPlantHead = role === UserRole.MANAGEMENT; // Plant Head
  const isOperator = role === UserRole.OPERATOR;
  const isSupervisor = role === UserRole.SUPERVISOR || role === UserRole.QA_ENGINEER;
  const isAdmin = role === UserRole.SYSTEM_ADMIN;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      
      {/* AUDITOR: Read-Only Banner */}
      {isAuditor && <AuditReadOnlyBanner />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System Overview <span className="text-slate-300">/</span> {isOperator ? 'My Station' : 'Track'}
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Activity className="text-brand-600" size={24} aria-hidden="true" />
             {isOperator ? 'Operator Dashboard' : 
              isSupervisor ? 'Supervisor Oversight' : 
              isPlantHead ? 'Plant Head Dashboard' : 
              isAdmin ? 'System Admin Dashboard' :
              isAuditor ? 'Auditor / Regulator Dashboard' :
              'System Dashboard'}
           </h1>
           <p className="text-slate-500 text-sm mt-1 max-w-2xl">
             {isOperator 
               ? 'Operational focus and station readiness. Identity/Trace is handled in S9 Registry.'
               : isPlantHead 
               ? 'Operational dashboard (Track). Identity & regulatory trace evidence is governed under Trace & Identity / Compliance views.'
               : isAdmin
               ? 'Operational governance (Track). Trace evidence is reviewed under Trace & Identity / Compliance.'
               : isAuditor
               ? 'Regulatory oversight view. Operational state (Track) vs Evidence lineage (Trace) is highlighted.'
               : 'Operational tracking and executive snapshot. (Not for Trace/Identity lookup)'
             }
           </p>
        </div>
        
        {isAuditor ? (
          <div className="bg-slate-800 text-slate-200 px-4 py-1.5 rounded text-xs font-bold border border-slate-700 uppercase flex items-center gap-2 shadow-sm w-fit">
            <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
            Auditor / Regulator Mode
          </div>
        ) : isOperator ? (
           <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded text-xs font-bold border border-brand-200 uppercase flex items-center gap-2 w-fit">
             <PlayCircle size={14} aria-hidden="true" />
             Execution Mode
           </div>
        ) : isSupervisor ? (
            <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded text-xs font-bold border border-amber-200 uppercase flex items-center gap-2 w-fit">
             <Briefcase size={14} aria-hidden="true" />
             Oversight Mode
           </div>
        ) : isPlantHead ? (
            <div className="bg-slate-800 text-white px-3 py-1 rounded text-xs font-bold border border-slate-600 uppercase flex items-center gap-2 shadow-sm w-fit">
             <LayoutDashboard size={14} aria-hidden="true" />
             Executive View
           </div>
        ) : isAdmin ? (
            <div className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold border border-slate-700 uppercase flex items-center gap-2 shadow-sm w-fit">
             <Server size={14} aria-hidden="true" />
             Admin Console
           </div>
        ) : (
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold border border-slate-200 uppercase w-fit">
            Executive Foundation
          </div>
        )}
      </div>

      {/* AUDITOR: Audit Snapshot Strip */}
      {isAuditor && <AuditSnapshotStrip />}

      {/* ADMIN: Governance Strip */}
      {isAdmin && <SystemGovernanceStrip />}

      {/* PLANT HEAD: Health Strip */}
      {isPlantHead && <PlantHealthStrip />}

      {/* SUPERVISOR: Oversight Focus Strip */}
      {isSupervisor && <OversightFocusStrip />}

      {/* OPERATOR: Shift Focus Strip */}
      {isOperator && <ShiftFocusStrip />}

      {/* SECTION 1: EXECUTIVE SNAPSHOT (Cards) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider">
            <Layers size={16} aria-hidden="true" />
            {isOperator ? 'Shift Context (Snapshot)' : 'Executive Snapshot (Real-time Track)'}
            <DemoCaption />
        </div>

        {/* Row 1: Manufacturing KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border group">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Planned</span>
                    <Clock size={16} className="text-slate-400" aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold text-slate-800">12</div>
                <div className="text-xs text-slate-400 mt-1">
                    Batches
                    {isAdmin && <span className="text-[10px] text-blue-600 ml-1 font-medium bg-blue-50 px-1 rounded">Data Sync: OK</span>}
                    {isAuditor && <span className="text-[10px] text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">Operational Metric</span>}
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border group">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Built</span>
                    <Factory size={16} className="text-blue-500" aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold text-slate-800">1,240</div>
                <div className="text-xs text-slate-400 mt-1">
                    Packs 
                    {isPlantHead && <span className="text-[10px] text-green-600 ml-1 font-medium bg-green-50 px-1 rounded">+ Release velocity</span>}
                    {isAuditor && <span className="text-[10px] text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">Track Only</span>}
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border group">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Yield</span>
                    <CheckCircle2 size={16} className="text-green-500" aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold text-slate-800">95.1%</div>
                <div className="text-xs text-green-600 mt-1">
                    1,180 OK
                    {isAuditor && <span className="text-[10px] text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-black">Quality Context</span>}
                </div>
            </div>
            <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border ${isSupervisor ? 'border-amber-300 bg-amber-50/30' : ''} group`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Hold</span>
                    <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
                </div>
                <div className="text-2xl font-bold text-slate-800">15</div>
                <div className="text-xs text-amber-600 mt-1">
                    Review 
                    {isSupervisor && '(High)'}
                    {isPlantHead && <span className="text-[10px] text-amber-700 ml-1 font-medium bg-amber-50 px-1 rounded">WIP pressure</span>}
                    {isAdmin && <span className="text-[10px] text-amber-700 ml-1 font-medium bg-amber-50 px-1 rounded">Pending Integrations</span>}
                    {isAuditor && <span className="text-[10px] text-amber-700 ml-1 font-medium bg-amber-50 px-1 rounded">Risk Indicator</span>}
                </div>
            </div>
        </div>

        {/* AUDITOR: Evidence Pointers */}
        {isAuditor && <EvidencePointers onNavigate={handleNav} />}

        {/* Row 2: Consolidated Summary - Simplified/Collapsed for Operator */}
        {!isOperator && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cards Normalized to p-4 padding for consistency */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                              <Battery size={18} className="text-brand-600" aria-hidden="true" />
                              Asset Trackability
                          </h3>
                          <p className="text-xs text-slate-400">Total System Assets: <span className="font-bold text-slate-600">1,500</span></p>
                      </div>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-1">
                          <span className="text-slate-600 flex items-center gap-2"><Factory size={14} aria-hidden="true" /> Manufacturing</span>
                          <span className="font-mono font-bold">125</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-1">
                          <span className="text-slate-600 flex items-center gap-2"><Truck size={14} aria-hidden="true" /> Field Deployed</span>
                          <span className="font-mono font-bold">850</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 flex items-center gap-2"><Recycle size={14} aria-hidden="true" /> End-of-Life</span>
                          <span className="font-mono font-bold">15</span>
                      </div>
                  </div>
                  {isPlantHead && <div className="mt-2 text-[10px] text-right text-slate-400 italic">Field exposure monitored</div>}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                              <Users size={18} className="text-brand-600" aria-hidden="true" />
                              Custody Status
                          </h3>
                          <p className="text-xs text-slate-400">Legal Possession <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded ml-1 cursor-help" title="Custodian of record impacts compliance liability.">Track</span></p>
                      </div>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-1">
                          <span className="text-slate-600 flex items-center gap-2"><Package size={14} aria-hidden="true" /> Warehouse</span>
                          <span className="font-mono font-bold">450</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-1">
                          <span className="text-slate-600 flex items-center gap-2"><Truck size={14} aria-hidden="true" /> In Transit</span>
                          <span className="font-mono font-bold">60</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 flex items-center gap-2"><Users size={14} aria-hidden="true" /> Customer</span>
                          <span className="font-mono font-bold">790</span>
                      </div>
                  </div>
                  {isAuditor && (
                      <div className="mt-3 text-[10px] text-right text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => handleNav('dispatch_execution')}>
                          Reference Dispatch & Custody Runbook →
                      </div>
                  )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                              <Scale size={18} className="text-brand-600" aria-hidden="true" />
                              Material Lifecycle
                          </h3>
                          <p className="text-xs text-slate-400">EPR Tracking</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <div className="text-xl font-mono font-bold text-slate-800">28t</div>
                          <div className="text-[10px] text-slate-500 uppercase">System Mass</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <div className="text-xl font-mono font-bold text-slate-800">450kg</div>
                          <div className="text-[10px] text-slate-500 uppercase">Recycling Queue</div>
                      </div>
                  </div>
                  <div className="mt-2 text-center">
                      <div className="text-xs text-green-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} aria-hidden="true" /> 100% EPR Compliant
                      </div>
                  </div>
              </div>
          </div>
        )}
      </section>

      {/* SUPERVISOR: Approvals List */}
      {isSupervisor && <ApprovalsList />}

      {/* OPERATOR: Attention Required */}
      {isOperator && <OperatorAttention />}

      {/* PLANT HEAD: OEE Readiness */}
      {isPlantHead && <OEEReferencePanel onNavigate={handleNav} />}

      {/* ADMIN: Integrity & Readiness */}
      {isAdmin && <IntegrityReadinessPanel />}

      {/* 
         AUDITOR REORDERING LOGIC:
         If Auditor, show Lifecycle/Custody (Section 3/4) BEFORE Operational Trends (Section 2).
         Otherwise, show in standard order.
      */}

      {/* SECTION 3 & 4 (Lifecycle & Risk) - Rendered EARLY for Auditor */}
      {isAuditor && (
        <>
          <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider border-t border-slate-200 pt-6">
                  <PieChart size={16} aria-hidden="true" />
                  Lifecycle & Custody Distribution
                  <DemoCaption />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Asset Lifecycle Phase" subtitle="Volume by Stage">
                      <SimpleBarChart data={STAGE_DISTRIBUTION} color="#818cf8" />
                  </ChartCard>

                  <ChartCard title="Custody Distribution" subtitle="Ownership Split">
                      <SimpleDonutChart data={CUSTODY_DATA} height={180} />
                  </ChartCard>
              </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider border-t border-slate-200 pt-6">
                <ShieldCheck size={16} aria-hidden="true" />
                Compliance & Risk Signals
                <DemoCaption />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-red-800 uppercase">Open Exceptions</div>
                        <div className="text-xl font-bold text-red-900">5</div>
                    </div>
                    <AlertOctagon size={24} className="text-red-300" aria-hidden="true" />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-amber-800 uppercase">Warranty Claims</div>
                        <div className="text-xl font-bold text-amber-900">3</div>
                    </div>
                    <AlertTriangle size={24} className="text-amber-300" aria-hidden="true" />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-blue-800 uppercase">EU Passports</div>
                        <div className="text-xl font-bold text-blue-900">45</div>
                    </div>
                    <FileBadge size={24} className="text-blue-300" aria-hidden="true" />
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-green-800 uppercase">Regulatory Audit</div>
                        <div className="text-sm font-bold text-green-900">Passed</div>
                    </div>
                    <CheckCircle2 size={24} className="text-green-300" aria-hidden="true" />
                </div>
            </div>
          </section>
        </>
      )}

      {/* SECTION 2: OPERATIONAL TRENDS (Graphs) */}
      <section className="space-y-4">
         <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider border-t border-slate-200 pt-6">
            <BarChart3 size={16} aria-hidden="true" />
            {isOperator ? 'Relevant Trends' : isAuditor ? 'Operational Context (Track)' : 'Operational Trends'}
            <DemoCaption />
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WIP Trend - Critical for everyone */}
            <ChartCard title="WIP Output Trend" subtitle="Last 7 Days (Units)">
               <SimpleLineChart data={TREND_DATA} />
            </ChartCard>

            {/* Exceptions - Critical for everyone */}
            <ChartCard title="Exception Severity" subtitle="Open Issues Count">
               <SimpleBarChart data={EXCEPTION_DATA} />
            </ChartCard>

            {/* Throughput / Bottleneck - Role Specific */}
            {!isOperator && (
                <>
                    {isPlantHead ? (
                        <ChartCard title="Bottleneck by Stage" subtitle="WIP Accumulation (Units)">
                            <SimpleBarChart data={BOTTLENECK_DATA} color="#f59e0b" />
                        </ChartCard>
                    ) : isAdmin ? (
                        <ChartCard title="Event Volume by Category" subtitle="Last 24 Hours">
                            <SimpleBarChart data={EVENT_VOLUME_DATA} color="#64748b" />
                        </ChartCard>
                    ) : (
                        <ChartCard title="Line Throughput" subtitle="Plan vs Actual (Units)">
                            <GroupedBarChart data={THROUGHPUT_DATA} />
                        </ChartCard>
                    )}
                </>
            )}
         </div>
      </section>

      {/* OPERATOR: Progressive Disclosure for More Analytics */}
      {isOperator && (
        <div className="border rounded-lg border-slate-200 bg-slate-50 overflow-hidden">
           <button 
              onClick={() => setExpandAnalytics(!expandAnalytics)}
              className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-expanded={expandAnalytics}
           >
              <div className="flex items-center gap-2">
                 <PieChart size={16} aria-hidden="true" />
                 <span>More Analytics (Throughput, Distribution & Risk)</span>
              </div>
              {expandAnalytics ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
           </button>
           
           {expandAnalytics && (
              <div className="p-4 border-t border-slate-200 space-y-6 bg-white animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ChartCard title="Line Throughput" subtitle="Plan vs Actual (Units)">
                          <GroupedBarChart data={THROUGHPUT_DATA} />
                      </ChartCard>
                      <ChartCard title="Asset Lifecycle Phase" subtitle="Volume by Stage">
                          <SimpleBarChart data={STAGE_DISTRIBUTION} color="#818cf8" />
                      </ChartCard>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                      {/* Risk Tiles Reused from Foundation */}
                      <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center justify-between">
                          <div>
                              <div className="text-xs font-bold text-red-800 uppercase">Exceptions</div>
                              <div className="text-xl font-bold text-red-900">5</div>
                          </div>
                          <AlertOctagon size={24} className="text-red-300" aria-hidden="true" />
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded flex items-center justify-between">
                          <div>
                              <div className="text-xs font-bold text-amber-800 uppercase">Warranty</div>
                              <div className="text-xl font-bold text-amber-900">3</div>
                          </div>
                          <AlertTriangle size={24} className="text-amber-300" aria-hidden="true" />
                      </div>
                  </div>
              </div>
           )}
        </div>
      )}

      {/* SECTION 3 & 4 (Lifecycle & Risk) - Standard Order for Non-Auditors */}
      {!isOperator && !isAuditor && (
        <>
          <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider border-t border-slate-200 pt-6">
                  <PieChart size={16} aria-hidden="true" />
                  Lifecycle & Custody Distribution
                  <DemoCaption />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Asset Lifecycle Phase" subtitle="Volume by Stage">
                      <SimpleBarChart data={STAGE_DISTRIBUTION} color="#818cf8" />
                  </ChartCard>

                  <ChartCard title="Custody Distribution" subtitle="Ownership Split">
                      <SimpleDonutChart data={CUSTODY_DATA} height={180} />
                  </ChartCard>
              </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase tracking-wider border-t border-slate-200 pt-6">
                <ShieldCheck size={16} aria-hidden="true" />
                Compliance & Risk Signals
                <DemoCaption />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-red-800 uppercase">Open Exceptions</div>
                        <div className="text-xl font-bold text-red-900">5</div>
                    </div>
                    <AlertOctagon size={24} className="text-red-300" aria-hidden="true" />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-amber-800 uppercase">Warranty Claims</div>
                        <div className="text-xl font-bold text-amber-900">3</div>
                    </div>
                    <AlertTriangle size={24} className="text-amber-300" aria-hidden="true" />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-blue-800 uppercase">EU Passports</div>
                        <div className="text-xl font-bold text-blue-900">45</div>
                    </div>
                    <FileBadge size={24} className="text-blue-300" aria-hidden="true" />
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-green-800 uppercase">Regulatory Audit</div>
                        <div className="text-sm font-bold text-green-900">Passed</div>
                    </div>
                    <CheckCircle2 size={24} className="text-green-300" aria-hidden="true" />
                </div>
            </div>
          </section>
        </>
      )}

      {/* Footer Info */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-100">
          <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          <p>
              <strong>Dashboard Semantics:</strong> This dashboard represents the <strong>TRACK</strong> state (current operational location and status). 
              For immutable history and provenance, consult the <strong>Battery Registry (TRACE)</strong>.
              All data is aggregated from backend microservices.
          </p>
      </div>

    </div>
  );
};