import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Wrench, 
  Zap, 
  CheckSquare, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Box,
  Cpu,
  Activity,
  Database,
  ArrowRight,
  History,
  CheckCircle2,
  Radar,
  ClipboardCheck
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS5Context, S5Context } from '../stages/s5/s5Contract';
import { getS5ActionState, S5ActionId } from '../stages/s5/s5Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface ActiveBatch {
  id: string;
  batchCode: string;
  skuCode: string;
  moduleType: string;
  plannedQty: number;
  // completedQty removed from here as it is now driven by S5Context
  targetLine: string;
}

interface AssemblyTask {
  id: number;
  label: string;
  required: boolean;
}

// Mock Data
const ACTIVE_BATCH: ActiveBatch = {
  id: 'b-001',
  batchCode: 'B-2026-01-001',
  skuCode: 'BP-LFP-48V-2.5K',
  moduleType: '48V Standard Module (16S1P)',
  plannedQty: 500,
  targetLine: 'Line A - Station 04',
};

const TASKS: AssemblyTask[] = [
  { id: 1, label: 'Scan Cell Batch QR', required: true },
  { id: 2, label: 'Load Cells into Holder', required: true },
  { id: 3, label: 'Apply Thermal Interface Material', required: true },
  { id: 4, label: 'Install Busbars & Fix', required: true },
  { id: 5, label: 'Connect BMS Sensing Harness', required: true },
  { id: 6, label: 'Visual Inspection (Polarity Check)', required: true },
];

interface ModuleAssemblyProps {
  onNavigate?: (view: NavView) => void;
}

export const ModuleAssembly: React.FC<ModuleAssemblyProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // S5 Context & Event State
  const [s5Context, setS5Context] = useState<S5Context>(getMockS5Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S5'));
  }, []);

  // Helper to resolve action state
  const getAction = (actionId: S5ActionId) => getS5ActionState(role, s5Context, actionId);

  // Action Handlers
  const handleStartAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS5Context(prev => ({
        ...prev,
        assemblyStatus: 'ASSEMBLING'
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S5',
        actionId: 'START_ASSEMBLY',
        actorRole: role,
        message: 'Module assembly started'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handlePauseAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS5Context(prev => ({
        ...prev,
        assemblyStatus: 'PAUSED'
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S5',
        actionId: 'PAUSE_ASSEMBLY',
        actorRole: role,
        message: 'Assembly paused by operator'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleResumeAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS5Context(prev => ({
        ...prev,
        assemblyStatus: 'ASSEMBLING'
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S5',
        actionId: 'RESUME_ASSEMBLY',
        actorRole: role,
        message: 'Assembly resumed'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteModule = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS5Context(prev => {
        const nextInProgress = Math.max(0, prev.modulesInProgressCount - 1);
        const nextCompleted = prev.modulesCompletedCount + 1;
        const isFinished = nextInProgress === 0; // Simplified logic: if no more in progress, consider batch done for demo

        return {
          ...prev,
          modulesInProgressCount: nextInProgress,
          modulesCompletedCount: nextCompleted,
          lastAssemblyAt: now,
          assemblyStatus: isFinished ? 'COMPLETED' : prev.assemblyStatus
        };
      });
      
      const evt = emitAuditEvent({
        stageId: 'S5',
        actionId: 'COMPLETE_MODULE',
        actorRole: role,
        message: 'Module assembly completed (Demo)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleHandoverToQA = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // In a real system, this might move status to 'TRANSFERRED' or similar.
      // For now we keep it COMPLETED or move to IDLE to reset demo.
      // Let's keep it COMPLETED to show end state.
      
      const evt = emitAuditEvent({
        stageId: 'S5',
        actionId: 'HANDOVER_TO_QA',
        actorRole: role,
        message: 'Batch released to Quality Assurance (S6)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleNavToS6 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S5',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S6: Module QA from S5 Next Step panel'
      });
      onNavigate('module_qa');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // Pre-calculate action states
  // Station Controls
  const startState = getAction('START_ASSEMBLY');
  const pauseState = getAction('PAUSE_ASSEMBLY');
  const resumeState = getAction('RESUME_ASSEMBLY');
  
  // Determine effective play button state and handler
  const isPaused = s5Context.assemblyStatus === 'PAUSED';
  const playButtonState = isPaused ? resumeState : startState;
  const playButtonHandler = isPaused ? handleResumeAssembly : handleStartAssembly;

  // Completion
  const completeState = getAction('COMPLETE_MODULE');
  const handoverState = getAction('HANDOVER_TO_QA');

  // Next Step Readiness
  const isReadyForNext = s5Context.assemblyStatus === 'COMPLETED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.OPERATOR || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Module Assembly Workstations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Module Line
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Wrench className="text-brand-600" size={24} />
             Module Assembly Workstation (S5)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Operator Interface: Assembly Execution & Quality Check.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
               <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                 s5Context.assemblyStatus === 'ASSEMBLING' ? 'bg-green-100 text-green-700 animate-pulse' :
                 s5Context.assemblyStatus === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                 s5Context.assemblyStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                 'bg-slate-100 text-slate-600'
               }`}>
                  <Activity size={14} /> Line {s5Context.assemblyStatus}
               </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>InProgress: {s5Context.modulesInProgressCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s5Context.assemblyStatus === 'ASSEMBLING' ? 'text-green-600' : 'text-slate-600'}`}>
              {s5Context.assemblyStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S5" />
      <PreconditionsPanel stageId="S5" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S5 Activity (Session)
           </div>
           <div className="space-y-2">
              {localEvents.slice(0, 3).map(evt => (
                 <div key={evt.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                    <span className="font-bold text-slate-700 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">{evt.actorRole}</span>
                    <span className="text-slate-600 flex-1 truncate">{evt.message}</span>
                    <CheckCircle2 size={14} className="text-green-500" />
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Next Step Guidance Panel */}
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-3 ${!onNavigate ? 'hidden' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <ArrowRight size={20} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Next Recommended Action</h3>
            <p className="text-xs text-blue-700 mt-1 max-w-lg">
              {isReadyForNext 
                ? "Module assembly for this batch is complete. Proceed to Quality Assurance (S6) for final inspection." 
                : "Batch assembly in progress. Complete all modules to unlock handover to QA."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button 
             onClick={handleNavToControlTower} 
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
           >
             <Radar size={14} /> Control Tower
           </button>
           <div className="flex-1 sm:flex-none flex flex-col items-center">
             <button 
               onClick={handleNavToS6} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <ClipboardCheck size={14} /> Go to S6: Module QA
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Batch Not Completed</span>
             )}
           </div>
        </div>
      </div>

      {/* Active Batch Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-md shrink-0 border border-slate-700">
          <div className="flex justify-between items-start">
             <div>
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Active Job Context</div>
                <div className="text-3xl font-mono font-bold text-white mb-2">{ACTIVE_BATCH.batchCode}</div>
                <div className="flex gap-4 text-sm text-slate-300">
                   <div className="flex items-center gap-1">
                      <Cpu size={14} className="text-brand-400" />
                      <span>{ACTIVE_BATCH.skuCode}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Box size={14} className="text-brand-400" />
                      <span>{ACTIVE_BATCH.moduleType}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Activity size={14} className="text-brand-400" />
                      <span>{ACTIVE_BATCH.targetLine}</span>
                   </div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Progress</div>
                <div className="text-3xl font-mono font-bold text-brand-400">
                   {s5Context.modulesCompletedCount} <span className="text-lg text-slate-500">/ {ACTIVE_BATCH.plannedQty}</span>
                </div>
                <div className="w-48 bg-slate-800 rounded-full h-2 mt-2 ml-auto overflow-hidden">
                   <div className="bg-brand-500 h-full transition-all duration-500" style={{ width: `${(s5Context.modulesCompletedCount / ACTIVE_BATCH.plannedQty) * 100}%` }}></div>
                </div>
             </div>
          </div>
      </div>

      {/* Operator Workspace Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left: Task Checklist */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <CheckSquare size={16} />
               SOP Checklist
             </h3>
             <span className="text-xs text-slate-400">Standard Assembly Steps</span>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
             {TASKS.map((task) => (
                <div key={task.id} className="flex items-center p-3 rounded border border-slate-200 bg-slate-50 opacity-80">
                   <div className="h-6 w-6 rounded border-2 border-slate-300 mr-3 flex items-center justify-center bg-white">
                      <span className="text-xs font-bold text-slate-300">{task.id}</span>
                   </div>
                   <span className="text-sm font-medium text-slate-700">{task.label}</span>
                </div>
             ))}
             <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 flex items-start gap-2">
                <Zap size={14} className="mt-0.5 shrink-0" />
                <p>Digital SOP steps are displayed for guidance. Interactive validation is disabled in demo mode.</p>
             </div>
          </div>
        </div>

        {/* Right: Controls & Quality */}
        <div className="col-span-8 flex flex-col gap-6">
           
           {/* Primary Action Panel */}
           <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-6 flex-1 flex flex-col justify-center items-center gap-6">
              <div className="text-center mb-4">
                 <h2 className="text-lg font-bold text-slate-700">Module Completion</h2>
                 <p className="text-slate-500 text-sm">Verify assembly and register unit completion</p>
              </div>
              
              <div className="flex gap-6 w-full max-w-lg">
                 <div className="flex-1 flex flex-col items-center">
                    <button 
                        onClick={handleCompleteModule}
                        disabled={!completeState.enabled || isSimulating}
                        className="w-full h-24 bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group disabled:bg-slate-200 disabled:text-slate-400"
                        title={completeState.reason}
                    >
                        <CheckSquare size={32} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-lg">ASSEMBLY OK</span>
                        <span className="text-[10px] opacity-75">Increment Counter</span>
                    </button>
                    {!completeState.enabled && <DisabledHint reason={completeState.reason || 'Blocked'} className="mt-2 text-center" />}
                 </div>
                 
                 <div className="flex-1 flex flex-col items-center">
                    <button 
                        disabled
                        className="w-full h-24 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group disabled:bg-slate-200 disabled:text-slate-400"
                        title="Rework is not enabled in this demo scenario"
                    >
                        <RotateCcw size={32} className="group-hover:rotate-[-45deg] transition-transform" />
                        <span className="font-bold text-lg">REWORK</span>
                        <span className="text-[10px] opacity-75">Flag for Repair (Disabled)</span>
                    </button>
                 </div>
              </div>

              <button 
                  disabled
                  className="mt-2 text-red-500 hover:text-red-700 font-medium flex items-center gap-2 border border-red-200 hover:bg-red-50 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Quality Alert system not connected"
              >
                  <AlertTriangle size={18} />
                  <span>Raise Quality Alert (Hold)</span>
              </button>
           </div>

           {/* Workstation Controls */}
           <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-4 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded text-slate-600">
                     <Wrench size={20} />
                  </div>
                  <div>
                     <div className="font-bold text-slate-700 text-sm">Station Controls</div>
                     <div className="text-xs text-slate-500">Machine interlocks active</div>
                  </div>
               </div>
               
               <div className="flex gap-4 items-center">
                  <div className="flex gap-2">
                      <button 
                        onClick={handlePauseAssembly}
                        className="bg-slate-100 text-slate-600 p-3 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 transition-colors" 
                        disabled={!pauseState.enabled || isSimulating}
                        title={pauseState.reason || "Pause Line"}
                      >
                        <Pause size={20} fill="currentColor" />
                      </button>
                      <button 
                        onClick={playButtonHandler}
                        className={`p-3 rounded-md border transition-colors ${
                            !playButtonState.enabled 
                            ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' 
                            : 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200'
                        }`} 
                        disabled={!playButtonState.enabled || isSimulating}
                        title={playButtonState.reason || "Start/Resume Line"}
                      >
                        <Play size={20} fill="currentColor" />
                      </button>
                  </div>
                  
                  {/* Handover Action (Conditional) */}
                  {handoverState.enabled && (
                    <div className="pl-4 border-l border-slate-200 animate-in fade-in slide-in-from-right-2">
                       <button 
                          onClick={handleHandoverToQA}
                          disabled={isSimulating}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors"
                          title="Release batch to QA"
                       >
                          <span>Handover</span>
                          <ArrowRight size={16} />
                       </button>
                    </div>
                  )}
               </div>
           </div>

        </div>

      </div>
    </div>
  );
};
