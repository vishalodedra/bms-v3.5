import React, { useState, useContext } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  Layers, 
  Activity, 
  Zap, 
  Wrench, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  PauseCircle, 
  StopCircle, 
  BarChart3, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  AlertOctagon,
  PlayCircle,
  Layout
} from 'lucide-react';

// --- Types ---

interface Station {
  id: string;
  name: string;
  state: 'Ready' | 'Running' | 'Blocked' | 'Idle';
  blockedReason?: string;
}

interface LineData {
  id: string;
  name: string;
  type: string;
  mode: 'Running' | 'Idle' | 'Blocked' | 'Maintenance';
  runbookRef: string;
  lastUpdate: string;
  health: 'OK' | 'Attention' | 'Critical';
  stations: Station[];
}

// --- Mock Data ---

const LINES: LineData[] = [
  {
    id: 'line-a',
    name: 'Line A (Modules)',
    type: 'Automated Assembly',
    mode: 'Running',
    runbookRef: 'Manufacturing Runbook (S5)',
    lastUpdate: '2026-01-13 11:38',
    health: 'OK',
    stations: [
      { id: 'st-01', name: 'Cell Load', state: 'Running' },
      { id: 'st-02', name: 'OCV Test', state: 'Running' },
      { id: 'st-03', name: 'Stacking', state: 'Running' },
      { id: 'st-04', name: 'Busbar Weld', state: 'Running' },
      { id: 'st-05', name: 'Visual QA', state: 'Ready' }
    ]
  },
  {
    id: 'line-b',
    name: 'Line B (High Voltage)',
    type: 'Manual Assembly',
    mode: 'Maintenance',
    runbookRef: 'Scheduled Maint. (WO-992)',
    lastUpdate: '2026-01-13 09:00',
    health: 'Attention',
    stations: [
      { id: 'st-01', name: 'HV Prep', state: 'Idle' },
      { id: 'st-02', name: 'Harnessing', state: 'Idle' },
      { id: 'st-03', name: 'Enclosure', state: 'Idle' },
      { id: 'st-04', name: 'Testing', state: 'Idle' }
    ]
  },
  {
    id: 'line-pack',
    name: 'Pack Assembly Line',
    type: 'Final Integration',
    mode: 'Blocked',
    runbookRef: 'Manufacturing Runbook (S7)',
    lastUpdate: '2026-01-13 11:35',
    health: 'Critical',
    stations: [
      { id: 'st-01', name: 'Module Insert', state: 'Running' },
      { id: 'st-02', name: 'BMS Mount', state: 'Running' },
      { id: 'st-03', name: 'Thermal', state: 'Blocked', blockedReason: 'Safety Curtain Triggered' },
      { id: 'st-04', name: 'Sealing', state: 'Idle' },
      { id: 'st-05', name: 'EOL Test', state: 'Idle' }
    ]
  }
];

// --- Components ---

const ModeBadge: React.FC<{ mode: LineData['mode'] }> = ({ mode }) => {
  const styles = {
    'Running': 'bg-green-100 text-green-700 border-green-200',
    'Idle': 'bg-slate-100 text-slate-500 border-slate-200',
    'Blocked': 'bg-red-100 text-red-700 border-red-200',
    'Maintenance': 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const icons = {
    'Running': PlayCircle,
    'Idle': PauseCircle,
    'Blocked': AlertOctagon,
    'Maintenance': Wrench
  };
  const Icon = icons[mode];

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border flex items-center gap-1 ${styles[mode]}`}>
      <Icon size={12} />
      {mode}
    </span>
  );
};

const StationNode: React.FC<{ station: Station; isLast: boolean; role: UserRole }> = ({ station, isLast, role }) => {
  const isSupervisor = role === UserRole.SUPERVISOR || role === UserRole.QA_ENGINEER;
  const isBlocked = station.state === 'Blocked';

  const styles = {
    'Running': 'bg-green-500 border-green-600',
    'Ready': 'bg-blue-400 border-blue-500',
    'Blocked': 'bg-red-500 border-red-600',
    'Idle': 'bg-slate-300 border-slate-400'
  };

  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-2">
        <div className={`w-4 h-4 rounded-full border-2 z-10 ${styles[station.state]} ${station.state === 'Running' ? 'animate-pulse' : ''}`} />
        {!isLast && <div className="w-0.5 h-12 bg-slate-200 -my-1" />}
      </div>
      <div className={`pb-6 ${isBlocked ? 'text-red-700' : 'text-slate-600'}`}>
        <div className="text-sm font-bold flex items-center gap-2">
          {station.name}
          <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${
             station.state === 'Running' ? 'bg-green-50 text-green-700 border-green-200' :
             station.state === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200' :
             'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {station.state}
          </span>
        </div>
        {isBlocked && (
          <div className="mt-1 text-xs bg-red-50 border border-red-100 p-2 rounded flex items-start gap-2 max-w-xs">
             <AlertCircle size={12} className="mt-0.5 shrink-0" />
             <span>
               <strong>STOPPAGE:</strong> {station.blockedReason || 'Unknown Error'}
               {isSupervisor && <div className="mt-1 text-[10px] underline cursor-pointer">View Incident Report</div>}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductionLine: React.FC = () => {
  const { role } = useContext(UserContext);
  const [selectedLine, setSelectedLine] = useState<LineData>(LINES[0]);

  const isAuditor = role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE;
  const isPlantHead = role === UserRole.MANAGEMENT;

  // Counts for Summary Strip
  const counts = {
    Running: LINES.filter(l => l.mode === 'Running').length,
    Blocked: LINES.filter(l => l.mode === 'Blocked').length,
    Idle: LINES.filter(l => l.mode === 'Idle').length,
    Maintenance: LINES.filter(l => l.mode === 'Maintenance').length,
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Manufacturing
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Layers className="text-brand-600" size={24} />
             Production Line Visibility
           </h1>
           <p className="text-slate-500 text-sm mt-1">Real-time operational readiness and station-level status.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded border border-slate-200 text-xs flex items-center gap-2">
                <Info size={14} className="text-blue-500" />
                <span>Line views reflect <strong>Operational Readiness (TRACK)</strong>. Traceability remains in Trace & Identity.</span>
            </div>
            
            {isAuditor && (
                <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded border border-slate-700 text-xs font-bold uppercase flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Auditor View
                </div>
            )}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
         <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-green-500 border-y-slate-200 border-r-slate-200 flex justify-between items-center">
            <div>
               <div className="text-xs text-slate-500 uppercase font-bold">Lines Running</div>
               <div className="text-xl font-bold text-slate-800">{counts.Running}</div>
            </div>
            <PlayCircle className="text-green-100" size={32} />
         </div>
         <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-red-500 border-y-slate-200 border-r-slate-200 flex justify-between items-center">
            <div>
               <div className="text-xs text-slate-500 uppercase font-bold">Lines Blocked</div>
               <div className="text-xl font-bold text-slate-800">{counts.Blocked}</div>
            </div>
            <AlertOctagon className="text-red-100" size={32} />
         </div>
         <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-slate-400 border-y-slate-200 border-r-slate-200 flex justify-between items-center">
            <div>
               <div className="text-xs text-slate-500 uppercase font-bold">Lines Idle</div>
               <div className="text-xl font-bold text-slate-800">{counts.Idle}</div>
            </div>
            <PauseCircle className="text-slate-100" size={32} />
         </div>
         <div className="bg-white p-3 rounded-lg shadow-sm border border-l-4 border-l-amber-500 border-y-slate-200 border-r-slate-200 flex justify-between items-center">
            <div>
               <div className="text-xs text-slate-500 uppercase font-bold">Maintenance</div>
               <div className="text-xl font-bold text-slate-800">{counts.Maintenance}</div>
            </div>
            <Wrench className="text-amber-100" size={32} />
         </div>
      </div>

      {/* Master-Detail Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
         
         {/* Master List */}
         <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
            {LINES.map(line => (
               <div 
                  key={line.id}
                  onClick={() => setSelectedLine(line)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                     selectedLine.id === line.id 
                     ? 'bg-white border-brand-500 ring-1 ring-brand-500 shadow-md' 
                     : 'bg-white border-industrial-border hover:border-brand-200 hover:shadow-sm'
                  }`}
               >
                  <div className="flex justify-between items-start mb-2">
                     <h3 className={`font-bold text-sm ${selectedLine.id === line.id ? 'text-brand-700' : 'text-slate-800'}`}>
                        {line.name}
                     </h3>
                     {line.health === 'Critical' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Critical Health" />}
                     {line.health === 'Attention' && <div className="w-2 h-2 rounded-full bg-amber-500" title="Attention Needed" />}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                     <ModeBadge mode={line.mode} />
                     <span className="text-[10px] text-slate-400 font-mono">ID: {line.id}</span>
                  </div>

                  <div className="text-xs text-slate-500 mb-1">
                     <span className="font-semibold">Runbook:</span> {line.runbookRef}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                     <Clock size={10} /> Updated: {line.lastUpdate}
                  </div>
               </div>
            ))}
         </div>

         {/* Detail Panel */}
         <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
            
            {/* Panel Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <Layout size={18} className="text-brand-600" />
                     <h2 className="text-lg font-bold text-slate-800">{selectedLine.name}</h2>
                  </div>
                  <p className="text-sm text-slate-500">{selectedLine.type}</p>
               </div>
               <div className="flex flex-col items-end">
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Operational Mode</div>
                  <ModeBadge mode={selectedLine.mode} />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               
               {/* OEE Section (Visual Contract) */}
               <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                     <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <BarChart3 size={14} />
                        OEE Components (Backend Computed)
                     </h3>
                     <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">Read-Only Placeholder</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                     <div className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Availability</div>
                        <div className="text-lg font-mono font-bold text-slate-300">— %</div>
                        <div className="text-[10px] text-slate-400 italic">Backend Computed</div>
                     </div>
                     <div className="text-center border-l border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Performance</div>
                        <div className="text-lg font-mono font-bold text-slate-300">— %</div>
                        <div className="text-[10px] text-slate-400 italic">Backend Computed</div>
                     </div>
                     <div className="text-center border-l border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Quality</div>
                        <div className="text-lg font-mono font-bold text-slate-300">— %</div>
                        <div className="text-[10px] text-slate-400 italic">Backend Computed</div>
                     </div>
                  </div>
                  
                  {isPlantHead && (
                     <div className="mt-3 p-2 bg-blue-50 text-blue-700 text-[10px] text-center rounded border border-blue-100">
                        Plant Head Note: OEE data aggregation pipeline is managed by the Data Engineering service.
                     </div>
                  )}
               </section>

               {/* Station Map */}
               <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Activity size={16} className="text-brand-500" />
                     Station Readiness Map
                  </h3>
                  <div className="pl-2">
                     {selectedLine.stations.map((station, idx) => (
                        <StationNode 
                           key={station.id} 
                           station={station} 
                           isLast={idx === selectedLine.stations.length - 1} 
                           role={role}
                        />
                     ))}
                  </div>
               </section>

               {/* Footer Action */}
               <section className="pt-6 border-t border-slate-100">
                  <button className="w-full py-3 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                     <span>View Operational Runbook</span>
                     <ArrowRight size={16} />
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-2">
                     Navigates to detailed SOP execution view (Control Tower).
                  </p>
               </section>

            </div>
         </div>

      </div>
    </div>
  );
};