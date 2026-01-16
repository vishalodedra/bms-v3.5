import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView, AnyFlowInstance } from '../types';
import { 
  ShieldAlert, 
  CalendarClock, 
  Layers, 
  Box, 
  ClipboardList, 
  Plus, 
  History, 
  CheckCircle2, 
  Database,
  ArrowRight,
  Radar,
  Wand2,
  X,
  RefreshCw
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';
import { BatchFlowWizard } from '../flows/batch/ui/BatchFlowWizard';
import { FlowInstanceList } from './flow';
import { apiFetch } from '../services/apiHarness';
import { BATCH_FLOW_ENDPOINTS } from '../flows/batch';

// Mock Data Types
interface BatchRecord {
  id: string;
  code: string;
  sku: string;
  qty: number;
  line: string;
  status: 'Draft' | 'Scheduled' | 'InProgress' | 'Completed';
  date: string;
}

// Mock Data
const MOCK_BATCHES: BatchRecord[] = [
  { id: 'b1', code: 'B-2026-01-001', sku: 'BP-LFP-48V-2.5K', qty: 500, line: 'Line A', status: 'Scheduled', date: '2026-01-20' },
  { id: 'b2', code: 'B-2026-01-002', sku: 'BP-NMC-800V-75K', qty: 150, line: 'Line B', status: 'Draft', date: '2026-01-22' }
];

interface BatchPlanningProps {
  onNavigate?: (view: NavView) => void;
}

export const BatchPlanning: React.FC<BatchPlanningProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [showWizard, setShowWizard] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [apiFlows, setApiFlows] = useState<AnyFlowInstance[]>([]);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);

  const fetchFlows = async () => {
    setIsLoadingFlows(true);
    try {
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.list);
      const result = await res.json();
      if (result.ok) setApiFlows(result.data);
    } catch (e) {
      console.error("S4: Failed to fetch batch flows", e);
    } finally {
      setIsLoadingFlows(false);
    }
  };

  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S4'));
    fetchFlows();
  }, []);

  const handleStartNew = () => {
    setActiveInstanceId(null);
    setShowWizard(true);
  };

  const handleResume = (id: string) => {
    setActiveInstanceId(id);
    setShowWizard(true);
  };

  const handleExitWizard = () => {
    setShowWizard(false);
    setActiveInstanceId(null);
    fetchFlows();
  };

  const hasAccess = role === UserRole.SYSTEM_ADMIN || role === UserRole.PLANNER || role === UserRole.SUPERVISOR || role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Batch Planning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Planning
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <CalendarClock className="text-brand-600" size={24} />
             Batch Planning & Work Orders (S4)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Schedule production runs, allocate inventory, and release work orders to the line.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button 
              className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 border transition-all ${
                showWizard 
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                : 'bg-white border-brand-200 text-brand-600 hover:bg-brand-50'
              }`}
              onClick={showWizard ? handleExitWizard : handleStartNew}
            >
              {showWizard ? <X size={16} /> : <Wand2 size={16} />}
              <span>{showWizard ? 'Exit Wizard' : 'Start Batch Flow Wizard'}</span>
            </button>
            <button 
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50"
              disabled={showWizard}
              onClick={handleStartNew}
            >
              <Plus size={16} />
              <span>Create Plan</span>
            </button>
          </div>
        </div>
      </div>

      {showWizard ? (
        <div className="flex-1 min-h-0">
          <BatchFlowWizard instanceId={activeInstanceId} onExit={handleExitWizard} />
        </div>
      ) : (
        <>
          <StageStateBanner stageId="S4" />
          <PreconditionsPanel stageId="S4" />

          {localEvents.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                  <History size={14} /> Recent S4 Activity
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

          <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
             {/* Left: Active Batch Flows List */}
             <div className="col-span-3 h-full overflow-hidden">
                <FlowInstanceList 
                   title="Active Batches"
                   flowId="FLOW-002"
                   instances={apiFlows}
                   isLoading={isLoadingFlows}
                   onRefresh={fetchFlows}
                   onSelect={handleResume}
                   onStartNew={handleStartNew}
                   emptyMessage="No pending production batches."
                />
             </div>

             {/* Right: Existing Schedule Table */}
             <div className="col-span-9 bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <ClipboardList size={18} />
                      Production Schedule (Baseline)
                   </h3>
                   <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Database size={14} />
                      <span>ERP Read-Only Snapshot</span>
                   </div>
                </div>
                <div className="overflow-x-auto flex-1">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                         <tr>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Batch ID</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">SKU</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Quantity</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Target Line</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-right">Date</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {MOCK_BATCHES.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                               <td className="px-4 py-3 font-mono font-bold text-slate-700">{b.code}</td>
                               <td className="px-4 py-3 text-slate-600">{b.sku}</td>
                               <td className="px-4 py-3 font-mono">{b.qty} Units</td>
                               <td className="px-4 py-3 flex items-center gap-1">
                                  <Layers size={14} className="text-slate-400" />
                                  {b.line}
                               </td>
                               <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                     b.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>{b.status}</span>
                               </td>
                               <td className="px-4 py-3 text-slate-400 font-mono text-xs text-right">{b.date}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => onNavigate && onNavigate('control_tower')}
                      className="text-xs text-brand-600 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                      View in Control Tower <Radar size={12} />
                    </button>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
};