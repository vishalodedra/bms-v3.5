import React, { useContext, useMemo, useState } from 'react';
import { 
  Radar, 
  PlayCircle, 
  AlertOctagon, 
  AlertTriangle, 
  Activity, 
  ArrowRight,
  User,
  CheckCircle2,
  Lock,
  PauseCircle,
  Truck,
  Box,
  Layers,
  Zap,
  RotateCcw,
  BarChart,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Eye,
  Link,
  Stamp,
  LifeBuoy,
  Map,
  ChevronRight,
  X
} from 'lucide-react';
import { UserContext, UserRole, APP_VERSION, NavView } from '../types';
import { STAGE_STATUS_MAP } from '../data/stageState';

// Lifecycle Navigation Map
const LIFECYCLE_MAP: { id: string; label: string; route: NavView }[] = [
  { id: 'S0', label: 'System Setup', route: 'system_setup' },
  { id: 'S1', label: 'SKU & Blueprint', route: 'sku_blueprint' },
  { id: 'S2', label: 'Procurement', route: 'procurement' },
  { id: 'S3', label: 'Inbound Receipt', route: 'inbound_receipt' },
  { id: 'S4', label: 'Batch Planning', route: 'batch_planning' },
  { id: 'S5', label: 'Module Assembly', route: 'module_assembly' },
  { id: 'S6', label: 'Module QA', route: 'module_qa' },
  { id: 'S7', label: 'Pack Assembly', route: 'pack_assembly' },
  { id: 'S8', label: 'Pack Review', route: 'pack_review' },
  { id: 'S9', label: 'Battery Registry', route: 'battery_registry' },
  { id: 'S10', label: 'BMS Provisioning', route: 'bms_provisioning' },
  { id: 'S11', label: 'Finished Goods', route: 'finished_goods' },
  { id: 'S12', label: 'Packaging', route: 'packaging_aggregation' },
  { id: 'S13', label: 'Dispatch Auth', route: 'dispatch_authorization' },
  { id: 'S14', label: 'Dispatch Exec', route: 'dispatch_execution' },
  { id: 'S15', label: 'Service & Warranty', route: 'service_warranty' },
  { id: 'S16', label: 'Recycling', route: 'recycling_recovery' },
  { id: 'S17', label: 'Audit & Closure', route: 'compliance_audit' },
];

interface RunbookProps {
  id: string;
  title: string;
  range: string;
  purpose: string;
  roles: string[];
  status: 'Healthy' | 'Degraded' | 'Blocked' | 'Idle' | 'Running';
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  isEmphasized?: boolean;
  isDeemphasized?: boolean;
}

const RunbookCard: React.FC<RunbookProps> = ({ 
  id, title, range, purpose, roles, status, onNavigate, children, isEmphasized, isDeemphasized 
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNavigate(id);
    }
  };

  return (
    <div 
      onClick={() => onNavigate(id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View Runbook: ${title}, Status: ${status}`}
      className={`
        bg-white rounded-lg overflow-hidden flex flex-col transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
        ${isEmphasized ? 'ring-2 ring-brand-500 shadow-md scale-[1.01]' : 'border border-industrial-border shadow-sm hover:shadow-md'}
        ${isDeemphasized ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}
      `}
    >
      <div className={`p-4 border-b flex justify-between items-start ${isEmphasized ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
        <div>
          <h3 className={`font-bold text-lg ${isEmphasized ? 'text-brand-900' : 'text-slate-800'}`}>{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">{range}</span>
            <span 
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                status === 'Healthy' || status === 'Running' ? 'bg-green-100 text-green-700' :
                status === 'Degraded' ? 'bg-amber-100 text-amber-700' :
                status === 'Blocked' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-500'
              }`}
              title={`Runbook Status: ${status}`}
            >
              {status}
            </span>
          </div>
        </div>
        <button 
          className={`transition-colors p-1 rounded border ${isEmphasized ? 'bg-white text-brand-600 border-brand-200' : 'text-slate-400 bg-white border-slate-200 group-hover:text-brand-600'}`}
          title="View Runbook Detail"
          aria-hidden="true" // Hidden because the card itself handles the click
          tabIndex={-1}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      
      <div className="p-4 bg-white border-b border-slate-50">
        <p className="text-xs text-slate-500">{purpose}</p>
      </div>

      {/* Density Adjustment: p-6 -> p-5, Added overflow-x-auto for tablet responsiveness */}
      <div className="flex-1 p-5 flex flex-col justify-center overflow-x-auto custom-scrollbar">
          {/* Visualization Spine */}
          <div className="min-w-[400px]">
             {children}
          </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
        {roles.map((role, idx) => (
          <span key={idx} className="flex items-center gap-1 text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">
            <User size={10} aria-hidden="true" /> {role}
          </span>
        ))}
      </div>
    </div>
  );
};

const StageNode: React.FC<{ label: string; icon: React.ElementType; status: 'Done' | 'Active' | 'Pending' | 'Hold' }> = ({ label, icon: Icon, status }) => (
  <div className="flex flex-col items-center gap-2 z-10 w-24 shrink-0" title={`Stage: ${label} (${status})`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
      status === 'Done' ? 'bg-green-50 border-green-500 text-green-600' :
      status === 'Active' ? 'bg-blue-50 border-blue-500 text-blue-600' :
      status === 'Hold' ? 'bg-red-50 border-red-500 text-red-600' :
      'bg-slate-50 border-slate-300 text-slate-300'
    }`}>
      <Icon size={18} aria-hidden="true" />
    </div>
    <span className={`text-[10px] font-bold text-center leading-tight ${
      status === 'Pending' ? 'text-slate-400' : 'text-slate-700'
    }`}>
      {label}
    </span>
  </div>
);

const GateNode: React.FC<{ status: 'Open' | 'Closed' | 'Locked' }> = ({ status }) => (
  <div className="flex items-center justify-center w-8 -mx-2 z-0 shrink-0" title={`Validation Gate: ${status}`}>
    <div className={`h-0.5 w-full ${status === 'Locked' ? 'bg-slate-200' : 'bg-slate-300'}`}></div>
    <div className={`absolute w-5 h-5 rotate-45 border-2 flex items-center justify-center bg-white ${
      status === 'Open' ? 'border-green-500' : 
      status === 'Closed' ? 'border-slate-300' : 
      'border-red-500'
    }`}>
        {status === 'Open' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
        {status === 'Locked' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
    </div>
  </div>
);

interface ControlTowerProps {
  onNavigate: (runbookId: string | NavView) => void;
  onViewExceptions?: () => void;
}

export const ControlTower: React.FC<ControlTowerProps> = ({ onNavigate, onViewExceptions }) => {
  const { role } = useContext(UserContext);
  const [walkthroughMode, setWalkthroughMode] = useState(false);

  // Role Logic Configuration
  const roleConfig = useMemo(() => {
    switch (role) {
      case UserRole.OPERATOR:
        return {
          viewName: 'Operator View',
          label: 'Operator',
          message: 'Your current operational focus',
          highlightMetrics: ['blocked'],
          highlightRunbooks: ['manufacturing'],
          readOnly: false,
          auditMode: false
        };
      case UserRole.SUPERVISOR:
      case UserRole.QA_ENGINEER:
        return {
          viewName: 'Supervisor / QA View',
          label: 'Supervisor',
          message: 'Oversight & quality control focus',
          highlightMetrics: ['exceptions', 'blocked'],
          highlightRunbooks: ['material', 'manufacturing', 'dispatch'],
          readOnly: false,
          auditMode: false
        };
      case UserRole.MANAGEMENT: // Plant Head context
        return {
          viewName: 'Plant Head View',
          label: 'Management',
          message: 'Plant-level operational health',
          highlightMetrics: ['sla', 'health'],
          highlightRunbooks: [], // Balanced view
          readOnly: true,
          auditMode: false
        };
      case UserRole.COMPLIANCE: // Auditor context
      case UserRole.SUSTAINABILITY:
        return {
          viewName: 'Auditor / Regulator View',
          label: 'Auditor',
          message: 'Read-only audit & compliance view',
          highlightMetrics: ['compliance'],
          highlightRunbooks: ['warranty', 'dispatch'],
          readOnly: true,
          auditMode: true
        };
      case UserRole.SYSTEM_ADMIN:
      default:
        return {
          viewName: 'System Admin View',
          label: 'Admin',
          message: 'Full system visibility',
          highlightMetrics: [],
          highlightRunbooks: [],
          readOnly: false,
          auditMode: false
        };
    }
  }, [role]);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Govern <span className="text-slate-300">/</span> Orchestration
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Radar className="text-brand-600" size={24} aria-hidden="true" />
             Control Tower
           </h1>
           <p className="text-slate-500 text-sm mt-1">Operational visibility and orchestration across plant workflows.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                <button
                    onClick={() => setWalkthroughMode(!walkthroughMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border uppercase shadow-sm transition-colors ${
                        walkthroughMode 
                        ? 'bg-brand-600 text-white border-brand-700' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Map size={14} />
                    <span>Walkthrough Mode</span>
                </button>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border uppercase shadow-sm ${
                    roleConfig.auditMode 
                    ? 'bg-slate-800 text-slate-200 border-slate-700' 
                    : 'bg-white text-slate-600 border-slate-200'
                }`}>
                    {roleConfig.auditMode ? <ShieldCheck size={14} className="text-emerald-400" /> : <Eye size={14} />}
                    <span>Viewing as: {roleConfig.label}</span>
                </div>
            </div>
            {roleConfig.auditMode && (
                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                    Read-Only Mode Active
                </div>
            )}
        </div>
      </div>

      {/* Lifecycle Walkthrough Panel */}
      {walkthroughMode && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 animate-in slide-in-from-top-4 shadow-sm">
              <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                      <Map size={16} className="text-brand-600" />
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Global SOP Lifecycle Map</h3>
                  </div>
                  <button 
                    onClick={() => setWalkthroughMode(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                      <X size={16} />
                  </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                  {LIFECYCLE_MAP.map((stage) => {
                      const status = STAGE_STATUS_MAP[stage.id] || { state: 'WAITING' };
                      return (
                          <button
                              key={stage.id}
                              onClick={() => {
                                  // Hack: casting to any to allow direct NavView jump from here
                                  // ControlTower typically navigates to Runbook IDs, but we want direct screen access for walkthrough
                                  onNavigate(stage.route);
                              }}
                              className="flex items-center gap-2 p-2 rounded border bg-white hover:bg-brand-50 hover:border-brand-200 transition-colors text-left group"
                          >
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  status.state === 'RUNNING' ? 'bg-green-500 animate-pulse' :
                                  status.state === 'READY' ? 'bg-blue-400' :
                                  status.state === 'BLOCKED' ? 'bg-red-500' :
                                  'bg-slate-300'
                              }`}></div>
                              <div className="min-w-0">
                                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-brand-500 font-bold">{stage.id}</div>
                                  <div className="text-xs font-medium text-slate-700 truncate">{stage.label}</div>
                              </div>
                              <ChevronRight size={12} className="ml-auto text-slate-300 group-hover:text-brand-400 opacity-0 group-hover:opacity-100" />
                          </button>
                      )
                  })}
              </div>
          </div>
      )}

      {/* Role Context Banner */}
      <div className={`px-4 py-3 rounded-md border flex justify-between items-center text-sm ${
          roleConfig.auditMode ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-brand-50 border-brand-100 text-brand-800'
      }`}>
          <div className="flex items-center gap-2 font-medium">
              <Activity size={16} className={roleConfig.auditMode ? 'text-slate-500' : 'text-brand-600'} aria-hidden="true" />
              {roleConfig.message}
          </div>
          <span className="text-xs opacity-75">Visibility adjusted by role — no actions enabled</span>
      </div>

      {/* Global Attention Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Blocked Gates - Critical */}
        <div 
          onClick={onViewExceptions}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewExceptions && onViewExceptions();
            }
          }}
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-l-4 border-y border-r shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-red-500 ${
              roleConfig.highlightMetrics.includes('blocked') 
              ? 'border-l-red-500 border-slate-300 ring-2 ring-red-100' 
              : 'bg-white border-l-red-500 border-slate-200'
          }`}
        >
           <div>
              <div className="text-xs text-red-600 uppercase font-bold flex items-center gap-1">
                Blocked Gates
                <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-bold text-slate-800">2</div>
           </div>
           <div className="p-2 bg-red-50 rounded-full text-red-500">
              <AlertOctagon size={24} aria-hidden="true" />
           </div>
        </div>

        {/* Exceptions - Warning */}
        <div 
          onClick={onViewExceptions}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewExceptions && onViewExceptions();
            }
          }}
          role="button"
          tabIndex={0}
          className={`p-3 rounded-lg border-l-4 border-y border-r shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              roleConfig.highlightMetrics.includes('exceptions') 
              ? 'border-l-amber-500 border-slate-300 ring-2 ring-amber-100' 
              : 'bg-white border-l-amber-500 border-slate-200'
          }`}
        >
           <div>
              <div className="text-xs text-amber-600 uppercase font-bold flex items-center gap-1">
                Exceptions Open
                <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-bold text-slate-800">5</div>
           </div>
           <div className="p-2 bg-amber-50 rounded-full text-amber-500">
              <AlertTriangle size={24} aria-hidden="true" />
           </div>
        </div>

        {/* SLA Risk - Info */}
        <div className={`p-3 rounded-lg border-l-4 border-y border-r shadow-sm flex items-center justify-between ${
             roleConfig.highlightMetrics.includes('sla') 
             ? 'border-l-blue-500 border-slate-300 ring-2 ring-blue-100' 
             : 'bg-white border-l-blue-500 border-slate-200'
        }`}>
           <div>
              <div className="text-xs text-blue-600 uppercase font-bold">SLA Risk</div>
              <div className="text-2xl font-bold text-slate-800">1</div>
           </div>
           <div className="p-2 bg-blue-50 rounded-full text-blue-500">
              <TrendingUp size={24} aria-hidden="true" />
           </div>
        </div>

        {/* System Health / OEE Reference */}
        <div className={`p-3 rounded-lg border-l-4 border-y border-r shadow-sm flex items-center justify-between ${
             roleConfig.highlightMetrics.includes('health') 
             ? 'border-l-purple-500 border-slate-300 ring-2 ring-purple-100' 
             : 'bg-white border-l-purple-500 border-slate-200'
        }`}>
           <div>
              <div className="text-xs text-purple-600 uppercase font-bold">Plant Health</div>
              <div className="text-2xl font-bold text-slate-800">98%</div>
           </div>
           <div className="p-2 bg-purple-50 rounded-full text-purple-500">
              <BarChart size={24} aria-hidden="true" />
           </div>
        </div>
      </div>

      {/* Operational Runbooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto pb-4">
        
        {/* A) Material Receipt & Serialization */}
        <RunbookCard 
          id="material"
          title="Material Receipt & Serialization" 
          range="S2 → S4" 
          purpose="Inbound verification, QC, identity generation, and ledger binding."
          roles={['Stores', 'QC Engineer', 'System']}
          status="Healthy"
          onNavigate={onNavigate}
          isEmphasized={roleConfig.highlightRunbooks.includes('material')}
          isDeemphasized={roleConfig.highlightRunbooks.length > 0 && !roleConfig.highlightRunbooks.includes('material')}
        >
           <div className="flex items-center justify-between px-4 relative min-w-max">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-0"></div>
              <StageNode label="ASN Intake" icon={Truck} status="Done" />
              <GateNode status="Open" />
              <StageNode label="Receipt" icon={CheckCircle2} status="Active" />
              <GateNode status="Open" />
              <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap z-20 shadow-sm flex items-center gap-1">
                      <Link size={8} /> Trace Handoff
                  </div>
                  <StageNode label="Serialize" icon={Layers} status="Pending" />
              </div>
           </div>
           {/* Summary Enrichment */}
           <div className="mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded flex justify-between items-center text-xs">
                <div className="text-slate-500">Current Stage: <span className="font-bold text-slate-700">S3 Inbound Receipt</span></div>
                <div className="text-slate-500">Gate Owner: <span className="font-bold text-slate-700">Stores Supervisor</span></div>
           </div>
        </RunbookCard>

        {/* B) Manufacturing Execution */}
        <RunbookCard 
          id="manufacturing"
          title="Manufacturing Execution Run" 
          range="S4 → S9" 
          purpose="Batch planning, assembly execution, QA validation, and release."
          roles={['Planner', 'Operator', 'QA Lead']}
          status="Blocked"
          onNavigate={onNavigate}
          isEmphasized={roleConfig.highlightRunbooks.includes('manufacturing')}
          isDeemphasized={roleConfig.highlightRunbooks.length > 0 && !roleConfig.highlightRunbooks.includes('manufacturing')}
        >
           <div className="flex items-center justify-between px-4 relative min-w-max">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-0"></div>
              <StageNode label="Plan" icon={Layers} status="Done" />
              <GateNode status="Open" />
              {/* Highlight the blocked stage */}
              <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 whitespace-nowrap z-20 shadow-sm">
                      Blocked: Seal Check
                  </div>
                  <StageNode label="Assembly" icon={Zap} status="Hold" />
              </div>
              <GateNode status="Locked" />
              <StageNode label="QA" icon={Activity} status="Pending" />
              <GateNode status="Locked" />
              <StageNode label="Release" icon={CheckCircle2} status="Pending" />
           </div>
           {/* Summary Enrichment */}
           <div className="mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded flex justify-between items-center text-xs">
                <div className="text-slate-500">Current Stage: <span className="font-bold text-slate-700">S5 Module Assembly</span></div>
                <div className="text-slate-500">Gate Owner: <span className="font-bold text-slate-700">Supervisor</span></div>
           </div>
        </RunbookCard>

        {/* C) Dispatch & Custody Chain */}
        <RunbookCard 
          id="dispatch"
          title="Dispatch & Custody Chain" 
          range="S11 → S14" 
          purpose="Packing, gate pass generation, custody transfer, and logistics handover."
          roles={['Logistics', 'Security', 'Transporter']}
          status="Running"
          onNavigate={onNavigate}
          isEmphasized={roleConfig.highlightRunbooks.includes('dispatch')}
          isDeemphasized={roleConfig.highlightRunbooks.length > 0 && !roleConfig.highlightRunbooks.includes('dispatch')}
        >
           <div className="flex items-center justify-between px-4 relative min-w-max">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-0"></div>
              <StageNode label="Ready" icon={Box} status="Done" />
              <GateNode status="Open" />
              <StageNode label="Label" icon={Layers} status="Done" />
              <GateNode status="Open" />
              <StageNode label="Auth" icon={Lock} status="Active" />
              <GateNode status="Closed" />
              <StageNode label="Handover" icon={Truck} status="Pending" />
           </div>
           <div className="mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded flex justify-between items-center text-xs">
                <div className="text-slate-500">Current Custodian: <span className="font-bold text-slate-700">Factory Outbound</span></div>
                <div className="text-slate-500">Stage: <span className="font-bold text-slate-700">S13 Auth</span></div>
           </div>
        </RunbookCard>

        {/* D) Warranty Lifecycle Management */}
        <RunbookCard 
          id="warranty"
          title="Warranty Lifecycle Management" 
          range="S15 → S16" 
          purpose="Service intake, RCA, warranty adjudication, and recovery routing."
          roles={['Service Eng', 'Sustainability', 'Customer']}
          status="Running"
          onNavigate={onNavigate}
          isEmphasized={roleConfig.highlightRunbooks.includes('warranty')}
          isDeemphasized={roleConfig.highlightRunbooks.length > 0 && !roleConfig.highlightRunbooks.includes('warranty')}
        >
           <div className="flex items-center justify-between px-4 relative min-w-max">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-0"></div>
              <StageNode label="Intake" icon={RotateCcw} status="Done" />
              <GateNode status="Open" />
              {/* Highlight active stage */}
              <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap z-20 shadow-sm">
                      In Progress
                  </div>
                  <StageNode label="Resolution" icon={Activity} status="Active" />
              </div>
           </div>
           <div className="mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded flex justify-between items-center text-xs">
                <div className="text-slate-500">Warranty Status: <span className="font-bold text-slate-700">Claim Raised</span></div>
                <div className="text-slate-500">Liability: <span className="font-bold text-purple-700">Performance</span></div>
           </div>
        </RunbookCard>

      </div>

      <div className="text-center text-xs text-slate-400">
         Frontend Demo • Operations Control Layer • {APP_VERSION}
      </div>

    </div>
  );
};
