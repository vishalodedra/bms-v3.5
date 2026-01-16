import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  FileCheck, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Box, 
  FileText, 
  Stamp,
  ClipboardList,
  ShieldCheck,
  History,
  Zap,
  Activity,
  Database,
  Thermometer,
  Play,
  FastForward,
  LogOut,
  Timer,
  CheckCircle2,
  ArrowRight,
  Radar
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS8Context, S8Context } from '../stages/s8/s8Contract';
import { getS8ActionState, S8ActionId } from '../stages/s8/s8Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface ReviewPack {
  id: string;
  packId: string;
  batchId: string;
  sku: string;
  completionTime: string;
  status: 'Pending' | 'Approved' | 'Hold' | 'Reject';
  assemblyStatus: 'Complete';
  qaStatus: 'Passed' | 'Flagged';
  safetyStatus: 'Passed';
}

// Mock Data
const PACK_QUEUE: ReviewPack[] = [
  {
    id: 'pk-001',
    packId: 'PCK-2026-001-012',
    batchId: 'P-2026-01-001',
    sku: 'BP-LFP-48V-2.5K',
    completionTime: '2026-01-11 14:30',
    status: 'Pending',
    assemblyStatus: 'Complete',
    qaStatus: 'Passed',
    safetyStatus: 'Passed'
  },
  {
    id: 'pk-002',
    packId: 'PCK-2026-001-013',
    batchId: 'P-2026-01-001',
    sku: 'BP-LFP-48V-2.5K',
    completionTime: '2026-01-11 15:45',
    status: 'Hold',
    assemblyStatus: 'Complete',
    qaStatus: 'Flagged',
    safetyStatus: 'Passed'
  },
  {
    id: 'pk-003',
    packId: 'PCK-2026-001-010',
    batchId: 'P-2026-01-001',
    sku: 'BP-LFP-48V-2.5K',
    completionTime: '2026-01-11 11:15',
    status: 'Approved',
    assemblyStatus: 'Complete',
    qaStatus: 'Passed',
    safetyStatus: 'Passed'
  }
];

interface PackReviewProps {
  onNavigate?: (view: NavView) => void;
}

export const PackReview: React.FC<PackReviewProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedPack, setSelectedPack] = useState<ReviewPack>(PACK_QUEUE[0]);
  const [notes, setNotes] = useState('');

  // S8 Context & Event State
  const [s8Context, setS8Context] = useState<S8Context>(getMockS8Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S8'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S8ActionId) => getS8ActionState(role, s8Context, actionId);

  // Action Handlers
  const handleStartAging = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS8Context(prev => ({
        ...prev,
        agingStatus: 'AGING',
        packsUnderAgingCount: prev.packsUnderAgingCount + 1,
        lastSoakCycleStartedAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S8',
        actionId: 'START_AGING_CYCLE',
        actorRole: role,
        message: 'Aging cycle started for queued packs'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleStartSoak = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS8Context(prev => ({
        ...prev,
        agingStatus: 'SOAKING'
      }));
      const evt = emitAuditEvent({
        stageId: 'S8',
        actionId: 'START_SOAK_CYCLE',
        actorRole: role,
        message: 'Soak cycle started (High Temperature Stress)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteSoak = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS8Context(prev => ({
        ...prev,
        agingStatus: 'COMPLETED',
        packsCompletedAgingCount: prev.packsCompletedAgingCount + 1,
        packsUnderAgingCount: Math.max(0, prev.packsUnderAgingCount - 1)
      }));
      const evt = emitAuditEvent({
        stageId: 'S8',
        actionId: 'COMPLETE_SOAK',
        actorRole: role,
        message: 'Aging & soak cycle completed successfully'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleRelease = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // In a real loop, we might reset to IDLE, but per requirements we keep COMPLETED state
      // unless we want to allow re-running the demo. 
      // Let's keep it simple and just emit event as per instructions.
      const evt = emitAuditEvent({
        stageId: 'S8',
        actionId: 'RELEASE_FROM_AGING',
        actorRole: role,
        message: 'Packs released from aging & soak chamber'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  // Navigation Handlers
  const handleNavToS9 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S8',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S9: Battery Registry (Final QA) from S8 Next Step panel'
      });
      onNavigate('battery_registry');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.QA_ENGINEER || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  // Guard States
  const startAgingState = getAction('START_AGING_CYCLE');
  const startSoakState = getAction('START_SOAK_CYCLE');
  const completeSoakState = getAction('COMPLETE_SOAK');
  const releaseState = getAction('RELEASE_FROM_AGING');

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Pack Review & Approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Final Review
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <FileCheck className="text-brand-600" size={24} />
             Pack Review (Aging & Soak) - S8
           </h1>
           <p className="text-slate-500 text-sm mt-1">End-of-Line (EOL) aging, soak testing, and final release decision.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                 s8Context.agingStatus === 'AGING' || s8Context.agingStatus === 'SOAKING' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                 s8Context.agingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                 'bg-slate-100 text-slate-600'
             }`}>
                <Thermometer size={14} /> Status: {s8Context.agingStatus}
             </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>Aging: {s8Context.packsUnderAgingCount}</span>
            <span className="text-slate-300">|</span>
            <span className="text-green-600 font-bold">Done: {s8Context.packsCompletedAgingCount}</span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S8" />
      <PreconditionsPanel stageId="S8" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S8 Activity (Session)
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
              {s8Context.agingStatus === 'COMPLETED'
                ? "Aging cycle complete. Proceed to S9 for Final QA and Digital Twin registration."
                : "Aging & soak in progress. Complete the cycle to unlock Final QA handoff."}
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
               onClick={handleNavToS9} 
               disabled={s8Context.agingStatus !== 'COMPLETED'}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Database size={14} /> Go to S9: Final QA
             </button>
             {s8Context.agingStatus !== 'COMPLETED' && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Aging Not Complete</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Review Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Search size={16} />
               Approval Queue
             </h3>
             <span className="text-xs text-slate-400">Packs awaiting release</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {PACK_QUEUE.map((pack) => (
              <div 
                key={pack.id} 
                onClick={() => setSelectedPack(pack)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedPack.id === pack.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{pack.packId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    pack.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    pack.status === 'Hold' ? 'bg-red-100 text-red-700' :
                    pack.status === 'Reject' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {pack.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{pack.sku}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                   <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {pack.completionTime.split(' ')[1]}
                   </span>
                   <span className="bg-slate-100 px-1 rounded">{pack.batchId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Detail View */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-white rounded border border-slate-200 shadow-sm">
                    <Box size={24} className="text-brand-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPack.packId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Batch: {selectedPack.batchId}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Review Status</div>
                <div className={`text-xl font-bold ${
                    selectedPack.status === 'Approved' ? 'text-green-600' :
                    selectedPack.status === 'Hold' ? 'text-red-600' :
                    selectedPack.status === 'Reject' ? 'text-red-600' :
                    'text-amber-600'
                }`}>
                    {selectedPack.status}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Aging & Soak Operations (NEW SECTION) */}
            <section className="bg-blue-50 border border-blue-100 rounded-lg p-4">
               <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Timer size={16} />
                  Aging & Soak Process Control
               </h3>
               
               <div className="flex gap-4">
                  {/* Start Aging */}
                  <div className="flex-1">
                     <button 
                       onClick={handleStartAging}
                       disabled={!startAgingState.enabled}
                       className="w-full flex flex-col items-center justify-center p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-blue-800"
                       title={startAgingState.reason}
                     >
                        <Play size={20} className="mb-1" />
                        <span className="text-xs font-bold">Start Aging</span>
                     </button>
                     {!startAgingState.enabled && <DisabledHint reason={startAgingState.reason || 'Blocked'} className="justify-center mt-1" />}
                  </div>

                  {/* Start Soak */}
                  <div className="flex-1">
                     <button 
                       onClick={handleStartSoak}
                       disabled={!startSoakState.enabled}
                       className="w-full flex flex-col items-center justify-center p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-blue-800"
                       title={startSoakState.reason}
                     >
                        <Thermometer size={20} className="mb-1" />
                        <span className="text-xs font-bold">Start Soak</span>
                     </button>
                     {!startSoakState.enabled && <DisabledHint reason={startSoakState.reason || 'Blocked'} className="justify-center mt-1" />}
                  </div>

                  {/* Complete Soak */}
                  <div className="flex-1">
                     <button 
                       onClick={handleCompleteSoak}
                       disabled={!completeSoakState.enabled}
                       className="w-full flex flex-col items-center justify-center p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-blue-800"
                       title={completeSoakState.reason}
                     >
                        <FastForward size={20} className="mb-1" />
                        <span className="text-xs font-bold">Complete Soak</span>
                     </button>
                     {!completeSoakState.enabled && <DisabledHint reason={completeSoakState.reason || 'Blocked'} className="justify-center mt-1" />}
                  </div>

                  {/* Release */}
                  <div className="flex-1">
                     <button 
                       onClick={handleRelease}
                       disabled={!releaseState.enabled}
                       className="w-full flex flex-col items-center justify-center p-3 bg-green-600 border border-green-700 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-400 text-white"
                       title={releaseState.reason}
                     >
                        <LogOut size={20} className="mb-1" />
                        <span className="text-xs font-bold">Release Batch</span>
                     </button>
                     {!releaseState.enabled && <DisabledHint reason={releaseState.reason || 'Blocked'} className="justify-center mt-1" />}
                  </div>
               </div>
            </section>

            {/* 2. Summary Cards */}
            <section className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col gap-2">
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <ClipboardList size={14} /> Assembly
                    </div>
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle size={18} />
                        <span>Completed (8/8)</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col gap-2">
                     <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <ShieldCheck size={14} /> QA Checks
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${selectedPack.qaStatus === 'Passed' ? 'text-green-700' : 'text-amber-700'}`}>
                        {selectedPack.qaStatus === 'Passed' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        <span>{selectedPack.qaStatus}</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col gap-2">
                     <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Zap size={14} /> Electrical Safety
                    </div>
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle size={18} />
                        <span>Hi-Pot OK</span>
                    </div>
                </div>
            </section>

            {/* 3. Reviewer Notes */}
            <section>
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-brand-500" />
                    Reviewer Remarks
                 </h3>
                <textarea 
                    className="w-full text-sm p-3 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-white text-slate-700"
                    rows={3}
                    placeholder="Enter approval notes or rejection reasons (Demo / Temporary)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isReadOnly}
                />
            </section>

             {/* 4. Decision Panel */}
            <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Stamp size={16} className="text-slate-600" />
                    Final Disposition Decision
                 </h3>
                <div className="flex gap-4">
                    <div className="flex-1 flex flex-col">
                        <button 
                            disabled={isReadOnly || true} 
                            className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-base flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed shadow-sm hover:bg-green-700"
                            title="Demo Mode: Backend locked"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} />
                                <span>APPROVE PACK</span>
                            </div>
                            <span className="text-[10px] font-normal opacity-80">Release to Finished Goods</span>
                        </button>
                        <DisabledHint reason="Missing Final Wgt" nextActionHint="Verify Weighing" className="mx-auto" />
                    </div>
                    
                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-amber-500 text-white py-4 rounded-lg font-bold text-base flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed shadow-sm hover:bg-amber-600"
                        title="Demo Mode: Backend locked"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={20} />
                            <span>HOLD</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Requires Further Investigation</span>
                    </button>

                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-red-600 text-white py-4 rounded-lg font-bold text-base flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed shadow-sm hover:bg-red-700"
                        title="Demo Mode: Backend locked"
                    >
                        <div className="flex items-center gap-2">
                            <XCircle size={20} />
                            <span>REJECT</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Scrap or Major Rework</span>
                    </button>
                </div>
                 <div className="flex justify-center items-center gap-2 mt-4 text-xs text-slate-400">
                    <History size={12} />
                    <span>Decision history is not persisted in Frontend-Only Demo Mode.</span>
                </div>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
