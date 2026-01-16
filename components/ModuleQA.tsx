import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  ClipboardCheck, 
  Microscope, 
  Zap, 
  Ruler, 
  ThumbsUp, 
  ThumbsDown, 
  AlertOctagon,
  Clock,
  Search,
  FileText,
  Database,
  Activity,
  History,
  CheckCircle2,
  ArrowRight,
  Radar,
  Battery
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS6Context, S6Context } from '../stages/s6/s6Contract';
import { getS6ActionState, S6ActionId } from '../stages/s6/s6Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface QAModule {
  id: string;
  moduleId: string;
  batchId: string;
  assemblyStation: string;
  assemblyTime: string;
  status: 'Pending' | 'In Review' | 'Cleared' | 'Rework' | 'Hold';
  sku: string;
}

interface InspectionItem {
  id: string;
  category: 'Visual' | 'Electrical' | 'Mechanical';
  label: string;
  spec: string;
  status: 'Pass' | 'Fail' | 'Pending';
}

// Mock Data
const QA_QUEUE: QAModule[] = [
  {
    id: 'm-001',
    moduleId: 'MOD-2026-001-042',
    batchId: 'B-2026-01-001',
    assemblyStation: 'Line A - Stn 04',
    assemblyTime: '2026-01-11 09:15',
    status: 'In Review',
    sku: 'BP-LFP-48V-2.5K'
  },
  {
    id: 'm-002',
    moduleId: 'MOD-2026-001-043',
    batchId: 'B-2026-01-001',
    assemblyStation: 'Line A - Stn 04',
    assemblyTime: '2026-01-11 09:22',
    status: 'Pending',
    sku: 'BP-LFP-48V-2.5K'
  },
  {
    id: 'm-003',
    moduleId: 'MOD-2026-001-038',
    batchId: 'B-2026-01-001',
    assemblyStation: 'Line A - Stn 04',
    assemblyTime: '2026-01-11 08:45',
    status: 'Rework',
    sku: 'BP-LFP-48V-2.5K'
  }
];

const INSPECTION_CHECKLIST: InspectionItem[] = [
  { id: 'chk-v1', category: 'Visual', label: 'Cell Polarity Check', spec: 'Standard SOP', status: 'Pass' },
  { id: 'chk-v2', category: 'Visual', label: 'Weld Integrity', spec: 'No discoloration/burns', status: 'Pending' },
  { id: 'chk-v3', category: 'Visual', label: 'Busbar Alignment', spec: '+/- 0.5mm', status: 'Pending' },
  { id: 'chk-e1', category: 'Electrical', label: 'Open Circuit Voltage (OCV)', spec: '48.2V +/- 0.1V', status: 'Pending' },
  { id: 'chk-e2', category: 'Electrical', label: 'Internal Resistance (IR)', spec: '< 2.5 mΩ', status: 'Pending' },
  { id: 'chk-e3', category: 'Electrical', label: 'BMS Comms Test', spec: 'Ping Success', status: 'Pending' },
  { id: 'chk-m1', category: 'Mechanical', label: 'Module Dimensions (L)', spec: '350mm +/- 1mm', status: 'Pending' },
];

interface ModuleQAProps {
  onNavigate?: (view: NavView) => void;
}

export const ModuleQA: React.FC<ModuleQAProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedModule, setSelectedModule] = useState<QAModule>(QA_QUEUE[0]);
  const [notes, setNotes] = useState('');
  
  // S6 Context & Event State
  const [s6Context, setS6Context] = useState<S6Context>(getMockS6Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S6'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S6ActionId) => getS6ActionState(role, s6Context, actionId);

  // Action Handlers
  const handleStartSession = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS6Context(prev => ({
        ...prev,
        qaStatus: 'INSPECTING'
      }));
      const evt = emitAuditEvent({
        stageId: 'S6',
        actionId: 'START_SESSION',
        actorRole: role,
        message: `Inspection session started for ${selectedModule.moduleId}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleLogObservation = (result: 'Pass' | 'Fail') => {
    setIsSimulating(true);
    setTimeout(() => {
      // In a real app, this would update specific checklist items.
      // Here we just log the event to simulate activity.
      const evt = emitAuditEvent({
        stageId: 'S6',
        actionId: 'LOG_OBSERVATION',
        actorRole: role,
        message: `Observation recorded: ${result} on checklist item`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 400);
  };

  const handleSubmitPass = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS6Context(prev => ({
        ...prev,
        qaStatus: 'IDLE',
        modulesPendingCount: Math.max(0, prev.modulesPendingCount - 1),
        modulesClearedCount: prev.modulesClearedCount + 1,
        lastInspectionAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S6',
        actionId: 'SUBMIT_PASS',
        actorRole: role,
        message: `Module ${selectedModule.moduleId} PASSED inspection`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleSubmitRework = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS6Context(prev => ({
        ...prev,
        qaStatus: 'IDLE',
        modulesPendingCount: Math.max(0, prev.modulesPendingCount - 1),
        modulesRejectedCount: prev.modulesRejectedCount + 1, // Treating rework as rejection bucket for demo
        lastInspectionAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S6',
        actionId: 'SUBMIT_REWORK',
        actorRole: role,
        message: `Module ${selectedModule.moduleId} flagged for REWORK`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleSubmitReject = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS6Context(prev => ({
        ...prev,
        qaStatus: 'IDLE',
        modulesPendingCount: Math.max(0, prev.modulesPendingCount - 1),
        modulesRejectedCount: prev.modulesRejectedCount + 1,
        lastInspectionAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S6',
        actionId: 'SUBMIT_REJECT',
        actorRole: role,
        message: `Module ${selectedModule.moduleId} REJECTED (Scrap)`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  // Navigation Handlers
  const handleNavToS7 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S6',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S7: Pack Assembly from S6 Next Step panel'
      });
      onNavigate('pack_assembly');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // Calculate Action States
  const startSessionState = getAction('START_SESSION');
  const logObservationState = getAction('LOG_OBSERVATION');
  const submitPassState = getAction('SUBMIT_PASS');
  const submitReworkState = getAction('SUBMIT_REWORK');
  const submitRejectState = getAction('SUBMIT_REJECT');

  // Logic for Next Step (Readiness)
  // Allow navigation if inspection is not active (IDLE) or we have cleared items.
  // Stricter: if inspecting, block navigation to focus user.
  const isReadyForNext = s6Context.qaStatus === 'IDLE';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.QA_ENGINEER || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Module QA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Quality Control
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <ClipboardCheck className="text-brand-600" size={24} />
             Module Quality Assurance (S6)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Inspect assembled modules, record measurements, and assign quality disposition.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
               <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                 s6Context.qaStatus === 'INSPECTING' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                 s6Context.qaStatus === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                 'bg-slate-100 text-slate-600'
               }`}>
                  <Activity size={14} /> QA: {s6Context.qaStatus}
               </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>Pending: {s6Context.modulesPendingCount}</span>
            <span className="text-slate-300">|</span>
            <span className="text-green-600 font-bold">Passed: {s6Context.modulesClearedCount}</span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S6" />
      <PreconditionsPanel stageId="S6" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S6 Activity (Session)
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
                ? "Modules cleared. Proceed to Pack Assembly (S7) to integrate modules into packs." 
                : "Inspection in progress. Complete current QA session before proceeding."}
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
               onClick={handleNavToS7} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Battery size={14} /> Go to S7: Pack Assembly
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Finish Inspection</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Inspection Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Search size={16} />
               Inspection Queue
             </h3>
             <span className="text-xs text-slate-400">Modules Awaiting Validation</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {QA_QUEUE.map((mod) => (
              <div 
                key={mod.id} 
                onClick={() => setSelectedModule(mod)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedModule.id === mod.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{mod.moduleId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    mod.status === 'Cleared' ? 'bg-green-100 text-green-700' :
                    mod.status === 'Rework' ? 'bg-amber-100 text-amber-700' :
                    mod.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {mod.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{mod.sku}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                   <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {mod.assemblyTime.split(' ')[1]}
                   </span>
                   <span className="bg-slate-100 px-1 rounded">{mod.assemblyStation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Inspection Desk */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{selectedModule.moduleId}</h2>
                <div className="flex items-center gap-2">
                   <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">{selectedModule.batchId}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500">SKU: {selectedModule.sku}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleStartSession}
                  disabled={!startSessionState.enabled || isSimulating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  title={startSessionState.reason}
                >
                  Start Inspection
                </button>
                {!startSessionState.enabled && s6Context.qaStatus !== 'INSPECTING' && (
                   <span className="text-[10px] text-red-500">{startSessionState.reason}</span>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Checklist Grid */}
            <div className="grid grid-cols-1 gap-6">
                
                {/* Visual */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Microscope size={16} className="text-purple-500" />
                        Visual Inspection
                    </h3>
                    <div className="space-y-2">
                        {INSPECTION_CHECKLIST.filter(i => i.category === 'Visual').map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                                    <div className="text-xs text-slate-400">Spec: {item.spec}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                      className="h-8 w-8 rounded flex items-center justify-center border border-slate-300 text-slate-300 hover:text-green-600 hover:border-green-600 disabled:opacity-50 disabled:hover:text-slate-300 disabled:hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500" 
                                      onClick={() => handleLogObservation('Pass')}
                                      disabled={!logObservationState.enabled}
                                      title={logObservationState.reason}
                                    >
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button 
                                      className="h-8 w-8 rounded flex items-center justify-center border border-slate-300 text-slate-300 hover:text-red-600 hover:border-red-600 disabled:opacity-50 disabled:hover:text-slate-300 disabled:hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500" 
                                      onClick={() => handleLogObservation('Fail')}
                                      disabled={!logObservationState.enabled}
                                      title={logObservationState.reason}
                                    >
                                        <ThumbsDown size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Electrical */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Zap size={16} className="text-amber-500" />
                        Electrical Tests
                    </h3>
                    <div className="space-y-2">
                        {INSPECTION_CHECKLIST.filter(i => i.category === 'Electrical').map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                                    <div className="text-xs text-slate-400">Spec: {item.spec}</div>
                                </div>
                                <div className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-400">
                                    -- / --
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                 {/* Mechanical */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Ruler size={16} className="text-blue-500" />
                        Mechanical Inspection
                    </h3>
                     <div className="space-y-2">
                        {INSPECTION_CHECKLIST.filter(i => i.category === 'Mechanical').map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{item.label}</div>
                                    <div className="text-xs text-slate-400">Spec: {item.spec}</div>
                                </div>
                                <div className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-400">
                                    -- mm
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>

            {/* 2. QA Notes */}
            <section className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Quality Notes (Session Only)
                </h3>
                <textarea 
                    className="w-full text-sm p-3 border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-100"
                    rows={3}
                    placeholder="Enter observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!logObservationState.enabled}
                />
                {!logObservationState.enabled && (
                   <DisabledHint reason={logObservationState.reason || 'Blocked'} className="mt-2" />
                )}
            </section>

             {/* 3. Disposition Actions */}
            <section className="pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col">
                        <button 
                            disabled={!submitPassState.enabled}
                            onClick={handleSubmitPass}
                            className="w-full bg-green-600 text-white py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:bg-green-700"
                            title={submitPassState.reason}
                        >
                            <ThumbsUp size={16} />
                            Mark as Cleared
                        </button>
                        {!submitPassState.enabled && <DisabledHint reason={submitPassState.reason || 'Blocked'} className="mx-auto" />}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                        <button 
                            disabled={!submitReworkState.enabled} 
                            onClick={handleSubmitRework}
                            className="w-full bg-amber-500 text-white py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:bg-amber-600"
                            title={submitReworkState.reason}
                        >
                            <AlertOctagon size={16} />
                            Route to Rework
                        </button>
                        {!submitReworkState.enabled && <DisabledHint reason={submitReworkState.reason || 'Blocked'} className="mx-auto" />}
                    </div>

                    <div className="flex-1 flex flex-col">
                        <button 
                            disabled={!submitRejectState.enabled} 
                            onClick={handleSubmitReject}
                            className="w-full bg-red-600 text-white py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm hover:bg-red-700"
                            title={submitRejectState.reason}
                        >
                            <ShieldAlert size={16} />
                            Quarantine / Hold
                        </button>
                        {!submitRejectState.enabled && <DisabledHint reason={submitRejectState.reason || 'Blocked'} className="mx-auto" />}
                    </div>
                </div>
                 <p className="text-center text-xs text-slate-400 mt-3">
                    Disposition actions update production counters locally in demo mode.
                </p>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
