import React, { useState } from 'react';
import { NavView } from '../types';
import { 
  ArrowLeft, 
  AlertOctagon, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  User, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ExceptionsViewProps {
  onNavigate: (view: NavView) => void;
}

interface Exception {
  id: string;
  type: string;
  runbook: string;
  stage: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  age: string;
  description: string;
  impact: string;
  escalation: string;
}

const MOCK_EXCEPTIONS: Exception[] = [
  {
    id: 'EX-2026-001',
    type: 'Gate Block',
    runbook: 'Manufacturing Execution',
    stage: 'Module Assembly (S5)',
    severity: 'Critical',
    owner: 'Supervisor',
    age: '2h 15m',
    description: 'Enclosure seal integrity validation failed for Batch B-2026-01-001. Interlock active.',
    impact: 'If unresolved, impacts Pack Assembly (S7) start. Line stoppage imminent.',
    escalation: 'Production Manager (Level 2)'
  },
  {
    id: 'EX-2026-002',
    type: 'Quality Deviation',
    runbook: 'Material Receipt',
    stage: 'QC Inspection (S3)',
    severity: 'High',
    owner: 'QC Engineer',
    age: '4h 30m',
    description: 'Incoming cell batch sampling failed AQL 2.5 on internal resistance.',
    impact: 'Batch quarantine prevents release to Manufacturing.',
    escalation: 'Quality Lead (Level 2)'
  },
  {
    id: 'EX-2026-003',
    type: 'Custody Mismatch',
    runbook: 'Dispatch Chain',
    stage: 'Execution (S14)',
    severity: 'Medium',
    owner: 'Security Officer',
    age: '45m',
    description: 'Driver ID mismatch against Gate Pass GP-2026-8819.',
    impact: 'Truck held at gate. Delay in shipment release.',
    escalation: 'Logistics Manager (Level 2)'
  },
  {
    id: 'EX-2026-004',
    type: 'SLA Breach',
    runbook: 'Warranty Lifecycle',
    stage: 'Triage & RCA (S15)',
    severity: 'Low',
    owner: 'Service Eng',
    age: '1d 2h',
    description: 'RCA Report overdue for PCK-2025-010-092.',
    impact: 'Customer satisfaction risk. KPI deviation.',
    escalation: 'Service Head (Level 2)'
  },
  {
    id: 'EX-2026-005',
    type: 'Compliance Alert',
    runbook: 'Manufacturing Execution',
    stage: 'Pack Review (S8)',
    severity: 'High',
    owner: 'Compliance',
    age: '1h 10m',
    description: 'Digital Passport signature generation failed due to timeout.',
    impact: 'Units cannot be moved to Finished Goods (S11).',
    escalation: 'System Admin (Level 3)'
  }
];

// --- OPTIMIZED ROW COMPONENT ---
const ExceptionRow = React.memo<{ ex: Exception; isSelected: boolean; onClick: (ex: Exception) => void }>(({ ex, isSelected, onClick }) => (
  <tr 
      onClick={() => onClick(ex)}
      className={`cursor-pointer transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
  >
      <td className="px-4 py-3 align-top">
          <div className="font-medium text-slate-800">{ex.type}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">{ex.id}</div>
      </td>
      <td className="px-4 py-3 align-top">
          <div className="text-slate-600 text-xs">{ex.runbook}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{ex.stage}</div>
      </td>
      <td className="px-4 py-3 align-top">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            ex.severity === 'Critical' ? 'bg-red-100 text-red-700' :
            ex.severity === 'High' ? 'bg-amber-100 text-amber-700' :
            ex.severity === 'Medium' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {ex.severity}
          </span>
      </td>
  </tr>
));

export const ExceptionsView: React.FC<ExceptionsViewProps> = ({ onNavigate }) => {
  const [selectedEx, setSelectedEx] = useState<Exception>(MOCK_EXCEPTIONS[0]);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="shrink-0 pb-4 border-b border-slate-200">
        <button 
          onClick={() => onNavigate('control_tower')}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 transition-colors"
        >
          <ArrowLeft size={12} /> Control Tower
        </button>
        <div className="flex justify-between items-start">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
               <AlertOctagon className="text-red-600" size={24} />
               Operational Exceptions
             </h1>
             <p className="text-slate-500 text-sm mt-1">System-wide blocks, quality deviations, and SLA breaches requiring attention.</p>
          </div>
          <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded text-xs font-bold border border-amber-200 uppercase">
             Frontend Demo View
          </div>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 overflow-hidden">
        
        {/* Left: Exception List */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Open Issues ({MOCK_EXCEPTIONS.length})</span>
           </div>
           <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                       <th className="px-4 py-3 text-xs font-bold uppercase w-24">Type</th>
                       <th className="px-4 py-3 text-xs font-bold uppercase">Context</th>
                       <th className="px-4 py-3 text-xs font-bold uppercase w-24">Severity</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {MOCK_EXCEPTIONS.map((ex) => (
                        <ExceptionRow 
                            key={ex.id} 
                            ex={ex} 
                            isSelected={selectedEx.id === ex.id} 
                            onClick={setSelectedEx} 
                        />
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Right: Exception Detail */}
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
           {/* Detail Header */}
           <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded border shadow-sm ${
                        selectedEx.severity === 'Critical' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                       <ShieldAlert size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-slate-900">{selectedEx.type}</h2>
                       <p className="text-xs text-slate-500 font-mono">ID: {selectedEx.id}</p>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-500 uppercase font-bold">Severity</div>
                 <div className={`text-lg font-bold ${
                    selectedEx.severity === 'Critical' ? 'text-red-600' :
                    selectedEx.severity === 'High' ? 'text-amber-600' :
                    'text-blue-600'
                 }`}>
                    {selectedEx.severity.toUpperCase()}
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Context Summary */}
              <section className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                       <Layers size={14} /> Source
                    </div>
                    <div className="text-sm font-medium text-slate-800">{selectedEx.runbook}</div>
                    <div className="text-xs text-slate-500">{selectedEx.stage}</div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                       <Clock size={14} /> Duration
                    </div>
                    <div className="text-sm font-medium text-slate-800">{selectedEx.age}</div>
                    <div className="text-xs text-slate-500">Since Detection</div>
                 </div>
              </section>

              {/* Description & Impact */}
              <section>
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity size={16} className="text-brand-500" />
                    Deviation Details
                 </h3>
                 <div className="bg-white p-4 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed mb-4">
                    {selectedEx.description}
                 </div>
                 
                 <div className="bg-red-50 p-4 border border-red-100 rounded-lg">
                    <h4 className="text-xs font-bold text-red-800 uppercase mb-1">Downstream Impact</h4>
                    <p className="text-sm text-red-700">{selectedEx.impact}</p>
                 </div>
              </section>

              {/* Ownership & Escalation */}
              <section className="border-t border-slate-100 pt-6">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} className="text-brand-500" />
                    Responsibility Matrix
                 </h3>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 p-3 border border-slate-200 rounded flex items-center gap-3">
                       <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                          L1
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 uppercase">Role Expected to Act</div>
                          <div className="text-sm font-bold text-slate-800">{selectedEx.owner}</div>
                       </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300" />
                    <div className="flex-1 p-3 border border-slate-200 rounded flex items-center gap-3 bg-slate-50">
                       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                          L2
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 uppercase">Escalation Path</div>
                          <div className="text-sm font-medium text-slate-600">{selectedEx.escalation}</div>
                       </div>
                    </div>
                 </div>
              </section>

           </div>
        </div>

      </div>
    </div>
  );
};