import React, { useContext, useMemo } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  Activity, 
  Server, 
  Zap, 
  AlertTriangle, 
  PlayCircle, 
  AlertOctagon, 
  CheckCircle2, 
  Layers, 
  PauseCircle, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Eye,
  Radar
} from 'lucide-react';

// --- MOCK DATA STRUCTURES ---

interface SystemMetric {
  label: string;
  value: string | number;
  status: 'OK' | 'Warning' | 'Critical' | 'Info';
  icon: React.ElementType;
}

interface RunbookSnapshot {
  id: string;
  name: string;
  stage: string;
  status: 'Running' | 'Blocked' | 'Idle' | 'Maintenance';
  reason?: string;
  lastUpdate: string;
}

interface LineSnapshot {
  id: string;
  name: string;
  mode: 'Running' | 'Idle' | 'Blocked' | 'Maintenance';
  stations: { id: string; status: 'Ready' | 'Running' | 'Blocked' | 'Idle' }[];
}

interface AttentionItem {
  id: string;
  type: 'Block' | 'Exception' | 'Risk' | 'Compliance';
  title: string;
  location: string;
  age: string;
  targetRoles: UserRole[];
}

// --- MOCK DATA ---

const METRICS: SystemMetric[] = [
  { label: 'System Health', value: '98% OK', status: 'OK', icon: Activity },
  { label: 'Active Runbooks', value: 2, status: 'Info', icon: PlayCircle },
  { label: 'Active Lines', value: '1/2', status: 'Warning', icon: Layers },
  { label: 'Blocked Gates', value: 2, status: 'Critical', icon: AlertOctagon },
  { label: 'Open Exceptions', value: 5, status: 'Warning', icon: AlertTriangle },
];

const RUNBOOKS: RunbookSnapshot[] = [
  { id: 'manufacturing', name: 'Manufacturing Execution', stage: 'S5: Module Assembly', status: 'Blocked', reason: 'Gate Interlock (Seal Check)', lastUpdate: '10 mins ago' },
  { id: 'material', name: 'Material Receipt', stage: 'S3: QC Inspection', status: 'Running', lastUpdate: '2 mins ago' },
  { id: 'dispatch', name: 'Dispatch & Custody', stage: 'S13: Authorization', status: 'Idle', reason: 'Waiting for Allocation', lastUpdate: '45 mins ago' },
  { id: 'warranty', name: 'Warranty Lifecycle', stage: 'S15: Triage', status: 'Idle', lastUpdate: '2 hours ago' },
];

const LINES: LineSnapshot[] = [
  { 
    id: 'line-a', 
    name: 'Line A (Modules)', 
    mode: 'Running', 
    stations: [
      { id: 'S1', status: 'Running' }, 
      { id: 'S2', status: 'Running' }, 
      { id: 'S3', status: 'Blocked' }, 
      { id: 'S4', status: 'Idle' }
    ] 
  },
  { 
    id: 'line-b', 
    name: 'Line B (High Voltage)', 
    mode: 'Maintenance', 
    stations: [
      { id: 'S1', status: 'Idle' }, 
      { id: 'S2', status: 'Idle' }, 
      { id: 'S3', status: 'Idle' }
    ] 
  }
];

const ATTENTION_ITEMS: AttentionItem[] = [
  { 
    id: 'att-01', 
    type: 'Block', 
    title: 'S5 Gate Locked: Seal Integrity', 
    location: 'Line A - Station 03', 
    age: '15m', 
    targetRoles: [UserRole.OPERATOR, UserRole.SUPERVISOR] 
  },
  { 
    id: 'att-02', 
    type: 'Exception', 
    title: 'S3 QC Deviation: AQL Fail', 
    location: 'Inbound Dock', 
    age: '2h', 
    targetRoles: [UserRole.QA_ENGINEER, UserRole.SUPERVISOR, UserRole.STORES] 
  },
  { 
    id: 'att-03', 
    type: 'Compliance', 
    title: 'S14 Handover: Missing Signature', 
    location: 'Dispatch Bay', 
    age: '45m', 
    targetRoles: [UserRole.LOGISTICS, UserRole.COMPLIANCE, UserRole.MANAGEMENT] 
  },
  { 
    id: 'att-04', 
    type: 'Risk', 
    title: 'S15 SLA Breach Warning', 
    location: 'Service Center', 
    age: '1d', 
    targetRoles: [UserRole.SERVICE, UserRole.MANAGEMENT] 
  }
];

// --- COMPONENTS ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    'Running': 'bg-green-100 text-green-700 border-green-200',
    'OK': 'bg-green-100 text-green-700 border-green-200',
    'Blocked': 'bg-red-100 text-red-700 border-red-200',
    'Critical': 'bg-red-100 text-red-700 border-red-200',
    'Idle': 'bg-slate-100 text-slate-500 border-slate-200',
    'Info': 'bg-blue-100 text-blue-700 border-blue-200',
    'Warning': 'bg-amber-100 text-amber-700 border-amber-200',
    'Maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status as keyof typeof styles] || styles['Idle']}`}>
      {status}
    </span>
  );
};

const StationDot: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    'Running': 'bg-green-500 animate-pulse',
    'Ready': 'bg-green-400',
    'Blocked': 'bg-red-500',
    'Idle': 'bg-slate-300'
  };
  return <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]}`} title={status} />;
};

export const LiveStatus: React.FC = () => {
  const { role } = useContext(UserContext);

  // Determine Role Context for Emphasis
  const roleConfig = useMemo(() => {
    return {
      isAuditor: role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE,
      isOperator: role === UserRole.OPERATOR,
      isSupervisor: role === UserRole.SUPERVISOR || role === UserRole.QA_ENGINEER,
      isManagement: role === UserRole.MANAGEMENT,
      label: role
    };
  }, [role]);

  // Sort Attention Items based on Role Relevance
  const sortedAttention = useMemo(() => {
    return [...ATTENTION_ITEMS].sort((a, b) => {
      const aRelevant = a.targetRoles.includes(role);
      const bRelevant = b.targetRoles.includes(role);
      if (aRelevant && !bRelevant) return -1;
      if (!aRelevant && bRelevant) return 1;
      return 0;
    });
  }, [role]);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Monitoring
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Activity className="text-brand-600" size={24} />
             Live Status
           </h1>
           <p className="text-slate-500 text-sm mt-1">Real-time operational heartbeat and plant-wide visibility.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border uppercase shadow-sm ${
                roleConfig.isAuditor 
                ? 'bg-slate-800 text-slate-200 border-slate-700' 
                : 'bg-white text-slate-600 border-slate-200'
            }`}>
                {roleConfig.isAuditor ? <ShieldAlert size={14} className="text-emerald-400" /> : <Eye size={14} />}
                <span>Viewing as: {roleConfig.label}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
               Last Sync: Just now
            </div>
        </div>
      </div>

      {/* A) SYSTEM SUMMARY STRIP */}
      <div className="grid grid-cols-5 gap-4">
        {METRICS.map((m, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-industrial-border flex flex-col justify-between h-24">
             <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase">{m.label}</span>
                <m.icon size={16} className={
                  m.status === 'OK' ? 'text-green-500' :
                  m.status === 'Critical' ? 'text-red-500' :
                  m.status === 'Warning' ? 'text-amber-500' : 'text-blue-500'
                } />
             </div>
             <div className="text-2xl font-bold text-slate-800">{m.value}</div>
             <StatusBadge status={m.status} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Operations & Lines */}
        <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
           
           {/* B) RUNNING OPERATIONS SNAPSHOT */}
           <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <PlayCircle size={18} className="text-brand-600" />
                    Running Operations
                 </h3>
                 <span className="text-xs text-slate-400">Snapshot View</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                 {RUNBOOKS.map(runbook => (
                    <div key={runbook.id} className={`p-4 rounded border flex flex-col gap-2 ${
                        runbook.status === 'Blocked' ? 'bg-red-50 border-red-200' : 
                        runbook.status === 'Running' ? 'bg-white border-green-200 shadow-sm' :
                        'bg-slate-50 border-slate-200 opacity-75'
                    }`}>
                       <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-sm">{runbook.name}</h4>
                          <StatusBadge status={runbook.status} />
                       </div>
                       <div className="text-xs text-slate-600 font-medium">{runbook.stage}</div>
                       {runbook.reason && (
                          <div className="text-xs text-red-600 font-bold flex items-center gap-1">
                             <AlertOctagon size={12} /> {runbook.reason}
                          </div>
                       )}
                       <div className="mt-auto pt-2 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100/50">
                          <span className="flex items-center gap-1"><Clock size={10} /> {runbook.lastUpdate}</span>
                          <span className="flex items-center gap-1 text-brand-600 font-medium cursor-help">
                             View Details <ArrowRight size={10} />
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* C) LINE & STATION STATUS SNAPSHOT */}
           <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Layers size={18} className="text-brand-600" />
                    Line Readiness Map
                 </h3>
                 <div className="flex gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Running</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Blocked</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Idle</span>
                 </div>
              </div>
              <div className="p-4 space-y-4">
                 {LINES.map(line => (
                    <div key={line.id} className="flex items-center justify-between p-3 border border-slate-100 rounded hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${
                             line.mode === 'Running' ? 'bg-green-100 text-green-700' :
                             line.mode === 'Blocked' ? 'bg-red-100 text-red-700' :
                             'bg-slate-100 text-slate-500'
                          }`}>
                             <Server size={20} />
                          </div>
                          <div>
                             <div className="text-sm font-bold text-slate-800">{line.name}</div>
                             <div className="text-xs text-slate-500">Mode: {line.mode}</div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                             {line.stations.map((st, idx) => (
                                <React.Fragment key={st.id}>
                                   <StationDot status={st.status} />
                                   {idx !== line.stations.length - 1 && <div className="w-2 h-px bg-slate-200"></div>}
                                </React.Fragment>
                             ))}
                          </div>
                          <div className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                             {line.stations.filter(s => s.status === 'Running').length} / {line.stations.length} Active
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

        {/* Right Column: Attention Required */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
           {/* D) ATTENTION REQUIRED (ROLE-AWARE EMPHASIS) */}
           <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <AlertTriangle size={18} className="text-amber-500" />
                 Attention Required
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                 Prioritized for <span className="font-bold uppercase text-slate-600">{role}</span>
              </p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-slate-100">
                 {sortedAttention.map(item => {
                    const isRelevant = item.targetRoles.includes(role);
                    return (
                       <div key={item.id} className={`p-4 transition-colors ${
                          isRelevant ? 'bg-white border-l-4 border-l-brand-500' : 'bg-slate-50/50 border-l-4 border-l-transparent opacity-60 hover:opacity-100'
                       }`}>
                          <div className="flex justify-between items-start mb-1">
                             <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                item.type === 'Block' ? 'bg-red-50 text-red-700 border-red-100' :
                                item.type === 'Exception' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                item.type === 'Compliance' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                             }`}>
                                {item.type}
                             </div>
                             <span className="text-[10px] text-slate-400">{item.age}</span>
                          </div>
                          <h4 className={`text-sm font-bold mt-2 ${isRelevant ? 'text-slate-800' : 'text-slate-600'}`}>
                             {item.title}
                          </h4>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                             <Zap size={12} />
                             {item.location}
                          </div>
                          {isRelevant && (
                             <div className="mt-3">
                                <button className="w-full text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 py-1.5 rounded transition-colors">
                                   Inspect in Control Tower
                                </button>
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
           
           <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-center text-slate-400 italic">
              Items are sorted by relevance to your active role.
           </div>
        </div>

      </div>
    </div>
  );
};