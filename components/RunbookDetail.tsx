import React, { useState } from 'react';
import { NavView } from '../types';
import { 
  ArrowLeft, 
  ArrowRight,
  Radar, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  AlertOctagon, 
  PlayCircle, 
  Activity,
  Layers,
  Truck,
  Box,
  RotateCcw,
  Zap,
  ShieldCheck,
  User,
  Info,
  ExternalLink,
  AlertTriangle,
  Users,
  Link,
  ClipboardList,
  Container,
  Stamp,
  LifeBuoy
} from 'lucide-react';
import { GateNotice } from './GateNotice';
import { setActiveContext } from '../utils/activeContext';

interface RunbookDetailProps {
  runbookId: string | null;
  onNavigate: (view: NavView) => void;
}

interface StageDefinition {
  id: string;
  name: string;
  sopRef: string;
  navTarget: NavView;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Hold';
  roles: string[];
  isTraceHandoff?: boolean;
  traceActivity?: {
    header: string;
    description: string;
    demoNote: string;
  };
  gate?: GateDefinition;
  exception?: {
    type: string;
    description: string;
  };
}

interface GateDefinition {
  type: 'Approval' | 'Validation' | 'Interlock' | 'Authorization' | 'Handoff';
  condition: string;
  evidence: string;
  owner: string;
  status: 'Open' | 'Closed' | 'Locked';
  impact: string;
}

interface RunbookData {
  id: string;
  title: string;
  range: string;
  purpose: string;
  status: 'Running' | 'Blocked' | 'Idle' | 'Healthy';
  stages: StageDefinition[];
  custody?: {
    custodian: string;
    responsibilities: string[];
    since: string;
  };
  warrantyContext?: {
    entity: string;
    status: 'Active' | 'Expired' | 'Claim Raised' | 'Under Review' | 'Closed';
    liabilities: string[];
  };
}

// MOCK DATA DEFINITIONS
const RUNBOOKS: Record<string, RunbookData> = {
  'material': {
    id: 'material',
    title: 'Material Receipt & Serialization',
    range: 'S2 → S4',
    purpose: 'Inbound verification, QC, identity generation, and ledger binding.',
    status: 'Healthy',
    custody: {
        custodian: 'Warehouse / Stores',
        responsibilities: ['Inbound QC', 'EPR Reporting', 'Warranty Risk'],
        since: '2026-01-13 08:30'
    },
    stages: [
      {
        id: 'mat-01',
        name: 'Procurement / ASN Intake (S2)',
        sopRef: 'SOP-02-01',
        navTarget: 'procurement',
        status: 'Completed',
        roles: ['Procurement', 'Supervisor'],
        gate: {
          type: 'Validation',
          condition: 'Supplier shipment acknowledged & ASN validated.',
          evidence: 'ASN Digital Signature',
          owner: 'Procurement / Supervisor',
          status: 'Open',
          impact: 'Cannot receive goods without ASN.'
        }
      },
      {
        id: 'mat-02',
        name: 'Inbound Receipt (S3)',
        sopRef: 'SOP-03-01',
        navTarget: 'inbound_receipt',
        status: 'In Progress',
        roles: ['Stores', 'Inbound QC'],
        gate: {
          type: 'Validation',
          condition: 'Physical receipt verified; quantity/COC checked.',
          evidence: 'GRN Token',
          owner: 'Stores / Inbound QC',
          status: 'Open',
          impact: 'Inventory remains in quarantine.'
        }
      },
      {
        id: 'mat-03',
        name: 'Serialization & Ledger Bind (S4)',
        sopRef: 'SOP-04-01',
        navTarget: 'inbound_receipt',
        status: 'Pending',
        roles: ['Operator', 'QA', 'System'],
        isTraceHandoff: true,
        gate: {
          type: 'Handoff',
          condition: 'Serialization complete; preliminary ledger bind ready.',
          evidence: 'Trace ID Generation',
          owner: 'System (Auto)',
          status: 'Locked',
          impact: 'Cannot allocate to batches.'
        }
      }
    ]
  },
  'manufacturing': {
    id: 'manufacturing',
    title: 'Manufacturing Execution Run',
    range: 'S4 → S9',
    purpose: 'Batch planning, assembly execution, QA validation, and release.',
    status: 'Blocked',
    stages: [
      {
        id: 'mfg-01',
        name: 'Batch Planning (S4)',
        sopRef: 'SOP-04-01',
        navTarget: 'batch_planning',
        status: 'Completed',
        roles: ['Planner', 'Supervisor'],
        gate: {
          type: 'Authorization',
          condition: 'Batch authorized for execution.',
          evidence: 'Production Schedule Lock',
          owner: 'Supervisor',
          status: 'Open',
          impact: 'Production cannot start.'
        }
      },
      {
        id: 'mfg-02',
        name: 'Module Assembly (S5)',
        sopRef: 'SOP-05-01',
        navTarget: 'module_assembly',
        status: 'Hold',
        roles: ['Operator'],
        gate: {
          type: 'Validation',
          condition: 'Assembly completion recorded.',
          evidence: 'Station Cycle Log',
          owner: 'Operator',
          status: 'Locked',
          impact: 'Cannot proceed to QA.'
        },
        exception: {
          type: 'Gate Block',
          description: 'Enclosure Seal Integrity Check Failed'
        }
      },
      {
        id: 'mfg-03',
        name: 'Module QA (S6)',
        sopRef: 'SOP-06-01',
        navTarget: 'module_qa',
        status: 'Pending',
        roles: ['QC Engineer'],
        gate: {
          type: 'Approval',
          condition: 'QA pass or hold decision.',
          evidence: 'Inspection Report',
          owner: 'QA Engineer',
          status: 'Locked',
          impact: 'Module quarantined.'
        }
      },
      {
        id: 'mfg-04',
        name: 'Pack Assembly (S7)',
        sopRef: 'SOP-07-01',
        navTarget: 'pack_assembly',
        status: 'Pending',
        roles: ['Operator'],
        gate: {
          type: 'Validation',
          condition: 'Pack assembly completion recorded.',
          evidence: 'Line End Signal',
          owner: 'Operator',
          status: 'Locked',
          impact: 'Cannot enter review.'
        }
      },
      {
        id: 'mfg-05',
        name: 'Pack Review (S8)',
        sopRef: 'SOP-08-01',
        navTarget: 'pack_review',
        status: 'Pending',
        roles: ['Quality Lead', 'Supervisor'],
        gate: {
          type: 'Approval',
          condition: 'Release approval for downstream.',
          evidence: 'Digital Passport Seal',
          owner: 'Supervisor',
          status: 'Locked',
          impact: 'Goods held in WIP.'
        }
      },
      {
        id: 'mfg-06',
        name: 'Registry Entry (S9)',
        sopRef: 'SOP-09-01',
        navTarget: 'battery_registry',
        status: 'Pending',
        roles: ['System', 'Admin'],
        gate: {
          type: 'Handoff',
          condition: 'Registry entry prepared (Trace).',
          evidence: 'UID Generation Log',
          owner: 'System Admin',
          status: 'Locked',
          impact: 'Digital Twin not created.'
        }
      }
    ]
  },
  'dispatch': {
    id: 'dispatch',
    title: 'Dispatch & Custody Chain',
    range: 'S11 → S14',
    purpose: 'Packing, gate pass generation, custody transfer, and logistics handover.',
    status: 'Running',
    custody: {
        custodian: 'Factory Outbound Dock',
        responsibilities: ['Safe Storage', 'Handover Verification'],
        since: '2026-01-13 09:00'
    },
    stages: [
      {
        id: 'dsp-01',
        name: 'Finished Goods Ready (S11)',
        sopRef: 'SOP-11-01',
        navTarget: 'finished_goods',
        status: 'Completed',
        roles: ['QA', 'Supervisor'],
        gate: {
          type: 'Validation',
          condition: 'Pack cleared for outbound logistics.',
          evidence: 'FG Release Note',
          owner: 'QA / Supervisor',
          status: 'Open',
          impact: 'Cannot reserve for order.'
        }
      },
      {
        id: 'dsp-02',
        name: 'Packaging & Label Verification (S12)',
        sopRef: 'SOP-12-01',
        navTarget: 'packaging_aggregation',
        status: 'Completed',
        roles: ['Warehouse', 'QA'],
        gate: {
          type: 'Validation',
          condition: 'Packaging integrity & label verification complete.',
          evidence: 'Manifest ID & Photo Proof',
          owner: 'Warehouse / QA',
          status: 'Open',
          impact: 'Cannot authorize dispatch.'
        }
      },
      {
        id: 'dsp-03',
        name: 'Dispatch Authorization (S13)',
        sopRef: 'SOP-13-01',
        navTarget: 'dispatch_authorization',
        status: 'In Progress',
        roles: ['Logistics', 'Supervisor'],
        gate: {
          type: 'Authorization',
          condition: 'Dispatch authorized with custodian assignment.',
          evidence: 'Gate Pass Token',
          owner: 'Logistics / Supervisor',
          status: 'Closed',
          impact: 'Security will deny exit.'
        }
      },
      {
        id: 'dsp-04',
        name: 'Dispatch Execution & Handover (S14)',
        sopRef: 'SOP-14-01',
        navTarget: 'dispatch_execution',
        status: 'Pending',
        roles: ['Logistics', 'Partner'],
        traceActivity: {
            header: "Custody Transfer Event",
            description: "Custody transfer recorded here. Trace registry reflects custodian-of-record.",
            demoNote: "Ledger update is backend-driven."
        },
        gate: {
          type: 'Handoff',
          condition: 'Physical handover completed; custodian updated.',
          evidence: 'Digital Signature (Driver)',
          owner: 'Logistics / Partner',
          status: 'Locked',
          impact: 'Custody transfer fails.'
        }
      }
    ]
  },
  'warranty': {
    id: 'warranty',
    title: 'Warranty Lifecycle Management',
    range: 'S15 → S16',
    purpose: 'Service intake, RCA, warranty adjudication, and recovery routing.',
    status: 'Running',
    warrantyContext: {
        entity: 'Service Partner (Hub A)',
        status: 'Claim Raised',
        liabilities: ['Safety', 'Performance', 'Regulatory']
    },
    stages: [
      {
        id: 'wty-01',
        name: 'Service / Warranty Event Intake (S15)',
        sopRef: 'SOP-15-01',
        navTarget: 'service_warranty',
        status: 'Completed',
        roles: ['Service Eng', 'System'],
        gate: {
          type: 'Validation',
          condition: 'Warranty claim or service event registered & triaged.',
          evidence: 'Claim Token / Incident ID',
          owner: 'Service / QA',
          status: 'Open',
          impact: 'Claim rejected automatically.'
        }
      },
      {
        id: 'wty-02',
        name: 'Resolution, Disposition & Closure (S16)',
        sopRef: 'SOP-16-01',
        navTarget: 'service_warranty',
        status: 'In Progress',
        roles: ['QA Lead', 'Supervisor'],
        traceActivity: {
            header: "Lifecycle History Update",
            description: "Warranty outcomes update lifecycle history; trace registry reflects final disposition.",
            demoNote: "Outcome (Repair/Replace/Recycle) is ledger-backed."
        },
        gate: {
          type: 'Approval',
          condition: 'Resolution approved and disposition recorded (Repair / Replace / Reject / Recycle).',
          evidence: 'Closure Report',
          owner: 'QA / Supervisor',
          status: 'Locked',
          impact: 'Cannot close ticket.'
        },
        exception: {
            type: 'SLA Risk',
            description: 'Triage time exceeded 24h limit.'
        }
      }
    ]
  }
};

export const RunbookDetail: React.FC<RunbookDetailProps> = ({ runbookId, onNavigate }) => {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // V33-OPS-FP-11: Gate Notice for missing context
  if (!runbookId || !RUNBOOKS[runbookId]) {
    return (
      <GateNotice 
        title="BLOCKED"
        reason="Runbook not selected"
        requiredAction="Select a Runbook from Control Tower → Runbooks"
        primaryLabel="Go to Control Tower"
        onPrimary={() => onNavigate('control_tower')}
        secondaryLabel="Go to Dashboard"
        onSecondary={() => onNavigate('dashboard')}
      />
    );
  }

  const runbook = RUNBOOKS[runbookId];
  
  // Default to first stage if none selected
  const activeStage = selectedStageId 
    ? runbook.stages.find(s => s.id === selectedStageId) 
    : runbook.stages[0];

  const handleStageNavigation = () => {
    // V33-OPS-FP-15: Set active context before navigating
    setActiveContext({
      runbookId: runbook.id,
      runbookTitle: runbook.title,
      stageId: activeStage?.id
    });
    
    if (activeStage) {
      onNavigate(activeStage.navTarget);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="shrink-0 pb-4 border-b border-slate-200">
        <button 
          onClick={() => onNavigate('control_tower')}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
          aria-label="Back to Control Tower"
        >
          <ArrowLeft size={12} aria-hidden="true" /> Control Tower
        </button>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
               <Radar className="text-brand-600" size={24} aria-hidden="true" />
               {runbook.title}
             </h1>
             <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {runbook.range}
                </span>
                <span className="text-slate-500">{runbook.purpose}</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                runbook.status === 'Healthy' || runbook.status === 'Running' ? 'bg-green-100 text-green-700 border-green-200' :
                runbook.status === 'Blocked' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-slate-100 text-slate-500 border-slate-200'
             }`}>
                STATUS: {runbook.status}
             </div>
             <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-xs font-medium border border-slate-700 hidden sm:block">
                Operational View — No Actions
             </div>
          </div>
        </div>
      </div>

      {/* Main Content: Split View (Responsive) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 lg:overflow-hidden">
        
        {/* Left: Stage Spine */}
        <div className="lg:col-span-7 lg:overflow-y-auto pr-4 custom-scrollbar">
           <div className="relative pl-8 py-4">
              {/* Vertical Line */}
              <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-slate-200 -z-10"></div>

              {runbook.stages.map((stage, idx) => (
                <div key={stage.id} className="mb-8 last:mb-0">
                   
                   {/* Stage Node */}
                   <div 
                      onClick={() => setSelectedStageId(stage.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedStageId(stage.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select Stage: ${stage.name}, Status: ${stage.status}`}
                      aria-current={activeStage?.id === stage.id ? 'step' : undefined}
                      className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        (activeStage?.id === stage.id) 
                          ? 'bg-white border-brand-500 shadow-md translate-x-1' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      } ${stage.exception ? 'border-red-300 bg-red-50 hover:bg-red-100' : ''}`}
                   >
                      {/* Connector Dot */}
                      <div className={`absolute -left-[23px] w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center ${
                         stage.status === 'Completed' ? 'bg-green-500' :
                         stage.status === 'In Progress' ? 'bg-blue-500' :
                         stage.exception ? 'bg-red-500' :
                         'bg-slate-300'
                      }`}>
                         {stage.status === 'Completed' && <CheckCircle2 size={12} className="text-white" aria-hidden="true" />}
                         {stage.exception && <AlertTriangle size={12} className="text-white" aria-hidden="true" />}
                      </div>

                      <div className="flex-1 min-w-0">
                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-2">
                            <h3 className={`font-bold truncate ${activeStage?.id === stage.id ? 'text-brand-700' : 'text-slate-700'}`}>
                              {stage.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {stage.isTraceHandoff && (
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                        <Link size={10} aria-hidden="true" /> Trace Handoff
                                    </span>
                                )}
                                {stage.exception && (
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                        <AlertOctagon size={10} aria-hidden="true" /> Exception
                                    </span>
                                )}
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                   stage.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                   stage.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                   stage.status === 'Hold' ? 'bg-red-50 text-red-700' :
                                   'bg-slate-100 text-slate-500'
                                }`}>
                                   {stage.status}
                                </span>
                            </div>
                         </div>
                         <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                            <span>{stage.sopRef}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1"><User size={10} aria-hidden="true" /> {stage.roles.join(', ')}</span>
                         </div>
                      </div>
                      
                      <div className="ml-4">
                         <ChevronRight size={16} className="text-slate-300" aria-hidden="true" />
                      </div>
                   </div>

                   {/* Gate Node (if exists) */}
                   {stage.gate && (
                      <div className="my-4 flex items-center pl-8">
                         <div className="w-8 h-8 rotate-45 border-2 bg-white flex items-center justify-center shadow-sm z-10 relative -left-[36px] group cursor-help shrink-0" title="Decision Gate">
                            <div className={`w-3 h-3 rounded-full ${
                               stage.gate.status === 'Open' ? 'bg-green-500' : 
                               stage.gate.status === 'Closed' ? 'bg-slate-300' : 'bg-red-500'
                            }`}></div>
                         </div>
                         <div className="ml-[-10px] bg-slate-50 border border-slate-200 px-3 py-2 rounded text-xs text-slate-500 flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span className="font-mono uppercase font-bold text-[10px] text-slate-400">GATE: {stage.gate.type}</span>
                            <span className={`font-bold ${
                                stage.gate.status === 'Open' ? 'text-green-600' :
                                stage.gate.status === 'Locked' ? 'text-red-600' : 'text-slate-600'
                            }`}>{stage.gate.status}</span>
                         </div>
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* Right: Context Panel */}
        <div className="lg:col-span-5 bg-slate-50 border-l lg:border-l border-slate-200 p-6 flex flex-col lg:overflow-y-auto border-t lg:border-t-0">
           {activeStage ? (
             <>
               <div className="mb-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Stage Context</div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{activeStage.name}</h2>
                  <p className="text-sm text-slate-500 font-mono">{activeStage.sopRef}</p>
               </div>

               {/* Exception Context if present */}
               {activeStage.exception && (
                   <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-6 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-red-700">
                           <AlertOctagon size={18} aria-hidden="true" />
                           <h3 className="font-bold text-sm">Active Exception</h3>
                       </div>
                       <p className="text-sm text-red-800 font-medium mb-1">{activeStage.exception.type}</p>
                       <p className="text-xs text-red-600 mb-2">{activeStage.exception.description}</p>
                       <button 
                          onClick={() => onNavigate('exceptions_view')}
                          className="text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                       >
                          View exception details <ArrowRight size={10} aria-hidden="true" />
                       </button>
                   </div>
               )}

               {/* Trace Handoff Context (Specific S4) */}
               {activeStage.isTraceHandoff && (
                   <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 mb-6 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-purple-700">
                           <Link size={18} aria-hidden="true" />
                           <h3 className="font-bold text-sm">Trace Handoff Point</h3>
                       </div>
                       <p className="text-xs text-purple-800 mb-2">IDs prepared for registry binding. Immutable lineage record creation.</p>
                       <div className="text-[10px] text-purple-600 bg-purple-100 p-2 rounded italic">
                          Frontend demo: actual ledger binding is backend-driven.
                       </div>
                   </div>
               )}

               {/* General Trace Activity (S14, S16 etc) */}
               {activeStage.traceActivity && (
                   <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-blue-700">
                           <Stamp size={18} aria-hidden="true" />
                           <h3 className="font-bold text-sm">{activeStage.traceActivity.header}</h3>
                       </div>
                       <p className="text-xs text-blue-800 mb-2">{activeStage.traceActivity.description}</p>
                       <div className="text-[10px] text-blue-600 bg-blue-100 p-2 rounded italic">
                          {activeStage.traceActivity.demoNote}
                       </div>
                   </div>
               )}

               {/* Gate Details */}
               {activeStage.gate && (
                 <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                       <ShieldCheck size={16} className="text-brand-600" aria-hidden="true" />
                       <h3 className="font-bold text-sm text-slate-700">Gate Requirements</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                       <div>
                          <div className="text-xs text-slate-400 mb-0.5">Condition</div>
                          <div className="font-medium text-slate-800">{activeStage.gate.condition}</div>
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 mb-0.5">Required Evidence</div>
                          <div className="font-medium text-slate-800">{activeStage.gate.evidence}</div>
                       </div>
                       <div className="flex justify-between">
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Owner</div>
                             <div className="font-medium text-slate-800">{activeStage.gate.owner}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs text-slate-400 mb-0.5">Impact</div>
                             <div className="font-medium text-red-600 text-xs">{activeStage.gate.impact}</div>
                          </div>
                       </div>
                    </div>
                    <div className="mt-3 p-2 bg-slate-50 rounded text-[10px] text-slate-400 flex items-start gap-1">
                       <Info size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                       Gate enforcement logic is handled by the backend BPM engine. Frontend reflects state only.
                    </div>
                 </div>
               )}

               {/* Custody Summary (if available on runbook) */}
               {runbook.custody && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                         <ClipboardList size={16} className="text-slate-500" aria-hidden="true" />
                         <h3 className="font-bold text-sm text-slate-700">Custodian of Record</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Current Custodian</div>
                             <div className="font-bold text-slate-800">{runbook.custody.custodian}</div>
                          </div>
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Active Responsibilities</div>
                             <div className="flex flex-wrap gap-1">
                                {runbook.custody.responsibilities.map(resp => (
                                    <span key={resp} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold">
                                        {resp}
                                    </span>
                                ))}
                             </div>
                          </div>
                          <div className="text-[10px] text-slate-400 text-right mt-1">
                             Since: {runbook.custody.since}
                          </div>
                      </div>
                  </div>
               )}

               {/* Warranty Responsibility (if available) */}
               {runbook.warrantyContext && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                         <LifeBuoy size={16} className="text-slate-500" aria-hidden="true" />
                         <h3 className="font-bold text-sm text-slate-700">Warranty Responsibility</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Responsible Entity</div>
                             <div className="font-bold text-slate-800">{runbook.warrantyContext.entity}</div>
                          </div>
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Warranty Status</div>
                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                 runbook.warrantyContext.status === 'Active' ? 'bg-green-100 text-green-700' :
                                 runbook.warrantyContext.status === 'Claim Raised' ? 'bg-amber-100 text-amber-700' :
                                 'bg-slate-100 text-slate-600'
                             }`}>
                                {runbook.warrantyContext.status}
                             </span>
                          </div>
                          <div>
                             <div className="text-xs text-slate-400 mb-0.5">Liability Scope</div>
                             <div className="flex flex-wrap gap-1">
                                {runbook.warrantyContext.liabilities.map(lbl => (
                                    <span key={lbl} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-bold">
                                        {lbl}
                                    </span>
                                ))}
                             </div>
                          </div>
                      </div>
                  </div>
               )}

               {/* Roles Panel */}
               <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                     <Users size={16} className="text-slate-500" aria-hidden="true" />
                     <h3 className="font-bold text-sm text-slate-700">Gate Owners / Stakeholders</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {activeStage.roles.map(role => (
                        <span key={role} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
                           <User size={12} aria-hidden="true" /> {role}
                        </span>
                     ))}
                  </div>
               </div>

               {/* Action / Nav */}
               <div className="mt-auto">
                  <button 
                    onClick={handleStageNavigation}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                     <span>Go to Operational Screen</span>
                     <ExternalLink size={16} aria-hidden="true" />
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-2">
                     Navigates to the functional SOP screen for this stage.
                  </p>
               </div>
             </>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Layers size={48} className="mb-2 opacity-20" aria-hidden="true" />
                <p>Select a stage to view details</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
