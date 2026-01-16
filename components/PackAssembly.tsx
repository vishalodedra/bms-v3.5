import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Battery, 
  Box, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  Wrench,
  Zap,
  Activity,
  Cpu,
  Database,
  XCircle,
  History,
  Radar,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS7Context, S7Context } from '../stages/s7/s7Contract';
import { getS7ActionState, S7ActionId } from '../stages/s7/s7Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface ActivePackBatch {
  id: string;
  batchCode: string;
  skuCode: string;
  packConfig: string;
  plannedQty: number;
  completedQty: number;
  targetLine: string;
  status: 'Running' | 'Paused' | 'Stopped';
}

interface PackTask {
  id: number;
  label: string;
  category: 'Mechanical' | 'Electrical' | 'Safety';
}

// Mock Data
const ACTIVE_BATCH: ActivePackBatch = {
  id: 'pb-001',
  batchCode: 'P-2026-01-001',
  skuCode: 'BP-LFP-48V-2.5K',
  packConfig: '4x Module Array + BMS + Enclosure',
  plannedQty: 125, // 500 modules / 4 per pack
  completedQty: 30,
  targetLine: 'Pack Line A - Main Assembly',
  status: 'Running'
};

const TASKS: PackTask[] = [
  { id: 1, label: 'Place Base Enclosure on Fixture', category: 'Mechanical' },
  { id: 2, label: 'Insert 4x QA-Cleared Modules', category: 'Mechanical' },
  { id: 3, label: 'Mount BMS Master Unit', category: 'Electrical' },
  { id: 4, label: 'Connect HV Busbars (Torque Check)', category: 'Electrical' },
  { id: 5, label: 'Install Low Voltage Harness', category: 'Electrical' },
  { id: 6, label: 'Apply Thermal Gap Fillers', category: 'Mechanical' },
  { id: 7, label: 'Close Lid & Seal Enclosure', category: 'Mechanical' },
  { id: 8, label: 'Hi-Pot / Insulation Pre-Check', category: 'Safety' },
];

interface PackAssemblyProps {
  onNavigate?: (view: NavView) => void;
}

export const PackAssembly: React.FC<PackAssemblyProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [localCount, setLocalCount] = useState(ACTIVE_BATCH.completedQty);
  
  // S7 Context & Event State
  const [s7Context, setS7Context] = useState<S7Context>(getMockS7Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S7'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S7ActionId) => getS7ActionState(role, s7Context, actionId);

  // Action Handlers
  const handleStartAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS7Context(prev => ({ ...prev, assemblyStatus: 'ASSEMBLING' }));
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'START_ASSEMBLY',
        actorRole: role,
        message: 'Pack assembly line started'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handlePauseAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS7Context(prev => ({ ...prev, assemblyStatus: 'PAUSED' }));
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'PAUSE_ASSEMBLY',
        actorRole: role,
        message: 'Line paused by operator'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleResumeAssembly = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS7Context(prev => ({ ...prev, assemblyStatus: 'ASSEMBLING' }));
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'RESUME_ASSEMBLY',
        actorRole: role,
        message: 'Line operation resumed'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompletePack = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS7Context(prev => ({
        ...prev,
        packsInProgressCount: Math.max(0, prev.packsInProgressCount - 1),
        packsCompletedCount: prev.packsCompletedCount + 1,
        lastAssemblyAt: now
      }));
      setLocalCount(c => c + 1);
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'COMPLETE_PACK',
        actorRole: role,
        message: 'Pack assembly completed & verified (Safety Check OK)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleReportIssue = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'REPORT_ISSUE',
        actorRole: role,
        message: 'Issue reported: Station alignment warning'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 400);
  };

  const handleAbortSession = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS7Context(prev => ({ ...prev, assemblyStatus: 'IDLE' }));
      const evt = emitAuditEvent({
        stageId: 'S7',
        actionId: 'ABORT_SESSION',
        actorRole: role,
        message: 'Assembly session aborted'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const handleNavToS8 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S7',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S8 (Pack Review & Aging) from S7 Next Step panel'
      });
      onNavigate('pack_review');
    }
  };

  // Pre-calculate action states
  const startState = getAction('START_ASSEMBLY');
  const pauseState = getAction('PAUSE_ASSEMBLY');
  const resumeState = getAction('RESUME_ASSEMBLY');
  const completeState = getAction('COMPLETE_PACK');
  const reportState = getAction('REPORT_ISSUE');
  const abortState = getAction('ABORT_SESSION');

  // Determine Primary Control Button (Play/Resume vs Pause)
  const isPaused = s7Context.assemblyStatus === 'PAUSED';
  const playAction = isPaused ? resumeState : startState;
  const playHandler = isPaused ? handleResumeAssembly : handleStartAssembly;

  // Navigation Condition: At least one pack completed or context state is COMPLETED
  const isReadyForNext = s7Context.packsCompletedCount > 0;

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.OPERATOR || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Pack Assembly Workstations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Pack Line
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Battery className="text-brand-600" size={24} />
             Pack Assembly Workstation (S7)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Operator Interface: Pack Integration & Enclosure Sealing.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                 s7Context.assemblyStatus === 'ASSEMBLING' ? 'bg-green-100 text-green-700 animate-pulse' :
                 s7Context.assemblyStatus === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                 'bg-slate-100 text-slate-600'
             }`}>
                <Activity size={14} /> Line {s7Context.assemblyStatus}
             </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>Planned: {s7Context.packsPlannedCount}</span>
            <span className="text-slate-300">|</span>
            <span className="text-green-600 font-bold">Done: {s7Context.packsCompletedCount}</span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S7" />
      <PreconditionsPanel stageId="S7" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S7 Activity (Session)
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
                ? "Assembly verified. Proceed to Aging & Soak (S8) for final EOL validation." 
                : "Line operational. Complete assembly tasks to enable downstream flow."}
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
               onClick={handleNavToS8} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <FileCheck size={14} /> Go to S8: Aging & Soak
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Complete at least 1 Pack</span>
             )}
           </div>
        </div>
      </div>

      {/* Active Batch Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-md shrink-0 border border-slate-700 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Layers size={120} />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
             <div>
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Active Pack Batch</div>
                <div className="text-3xl font-mono font-bold text-white mb-2">{ACTIVE_BATCH.batchCode}</div>
                <div className="flex gap-6 text-sm text-slate-300">
                   <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-brand-400" />
                      <span className="font-medium">{ACTIVE_BATCH.skuCode}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Box size={16} className="text-brand-400" />
                      <span>{ACTIVE_BATCH.packConfig}</span>
                   </div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Pack Output</div>
                <div className="text-4xl font-mono font-bold text-brand-400">
                   {localCount} <span className="text-xl text-slate-500">/ {ACTIVE_BATCH.plannedQty}</span>
                </div>
                <div className="w-56 bg-slate-800 rounded-full h-2 mt-2 ml-auto overflow-hidden">
                   <div className="bg-brand-500 h-full transition-all duration-500" style={{ width: `${(localCount / ACTIVE_BATCH.plannedQty) * 100}%` }}></div>
                </div>
             </div>
          </div>
      </div>

      {/* Operator Workspace Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left: Task Flow */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Layers size={16} />
               Assembly Sequence
             </h3>
             <span className="text-xs text-slate-400">Standard Operating Procedure</span>
          </div>
          <div className="flex-1 p-0 overflow-y-auto">
             <div className="divide-y divide-slate-100">
               {TASKS.map((task, index) => (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                     <div className="h-8 w-8 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0 bg-white">
                        {index + 1}
                     </div>
                     <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">{task.label}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5 text-slate-400 flex items-center gap-1">
                           {task.category === 'Electrical' && <Zap size={10} className="text-amber-500" />}
                           {task.category === 'Mechanical' && <Wrench size={10} className="text-blue-500" />}
                           {task.category === 'Safety' && <ShieldAlert size={10} className="text-red-500" />}
                           {task.category}
                        </div>
                     </div>
                     <div className="h-4 w-4 rounded-full border border-slate-200"></div>
                  </div>
               ))}
             </div>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500 italic">
             Steps must be confirmed via physical button box or torque tool integration (Mocked).
          </div>
        </div>

        {/* Right: Controls & Status */}
        <div className="col-span-7 flex flex-col gap-6">
           
           {/* Primary Action Panel */}
           <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-6 flex-1 flex flex-col justify-center items-center gap-6">
              
              {/* Status Flags */}
              <div className="flex w-full justify-between px-8 mb-4">
                 <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Safety OK</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quality OK</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Stop</span>
                 </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div className="text-center">
                 <h2 className="text-lg font-bold text-slate-700">Pack Finalization</h2>
                 <p className="text-slate-500 text-sm">Confirm enclosure seal and initiate end-of-line transfer</p>
              </div>
              
              <div className="w-full max-w-md flex flex-col items-center">
                <button 
                  onClick={handleCompletePack}
                  disabled={!completeState.enabled || isSimulating}
                  className="w-full h-32 bg-brand-600 hover:bg-brand-700 active:scale-95 transition-all text-white rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group border-b-4 border-brand-800 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400"
                  title={completeState.reason}
                >
                  <CheckCircle2 size={48} className="group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-2xl tracking-tight">PACK COMPLETE</span>
                    <span className="text-xs opacity-75 font-mono uppercase tracking-wider">Print Label & Release</span>
                  </div>
                </button>
                {!completeState.enabled && <DisabledHint reason={completeState.reason || 'Blocked'} className="mt-2" />}
              </div>

              <div className="flex gap-4 w-full max-w-md mt-2">
                 <div className="flex-1 flex flex-col">
                    <button 
                        onClick={handleReportIssue}
                        disabled={!reportState.enabled}
                        className="w-full py-3 border-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={reportState.reason}
                    >
                        <AlertTriangle size={18} />
                        Report Issue
                    </button>
                 </div>
                 
                 <div className="flex-1 flex flex-col">
                    <button 
                        onClick={handlePauseAssembly}
                        disabled={!pauseState.enabled}
                        className="w-full py-3 border-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={pauseState.reason}
                    >
                        <Pause size={18} />
                        Pause Line
                    </button>
                 </div>
              </div>

           </div>

           {/* Workstation Info & Global Controls */}
           <div className="bg-slate-800 text-slate-300 rounded-lg shadow-sm p-4 flex justify-between items-center text-sm">
               <div className="flex items-center gap-3">
                  <Activity size={18} className="text-green-400" />
                  <span>Station Cycle Time: <span className="font-mono text-white font-bold">14m 32s</span></span>
               </div>
               <div className="flex items-center gap-4">
                  {/* Start/Resume Toggle */}
                  <button 
                    onClick={playHandler}
                    disabled={!playAction.enabled}
                    title={playAction.reason}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-xs disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={12} fill="currentColor" />
                    {isPaused ? 'RESUME' : 'START'}
                  </button>
                  
                  {/* Abort */}
                  {abortState.enabled && (
                    <button 
                      onClick={handleAbortSession}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 rounded font-bold text-xs transition-colors"
                      title="Abort Session (Supervisor Only)"
                    >
                      <XCircle size={12} /> ABORT
                    </button>
                  )}
               </div>
           </div>

        </div>

      </div>
    </div>
  );
};
