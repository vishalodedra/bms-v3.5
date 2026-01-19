
import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { UserContext, UserRole, NavView, AnyFlowInstance } from '../types';
import { 
  ShieldAlert, 
  CalendarClock, 
  Plus, 
  History, 
  CheckCircle2, 
  RefreshCw,
  Search,
  Eye,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';
import { BatchFlowWizard } from '../flows/batch/ui/BatchFlowWizard';
import { apiFetch } from '../services/apiHarness';
import { BATCH_FLOW_ENDPOINTS, BatchFlowInstance } from '../flows/batch';
import { getS4ActionState } from '../stages/s4/s4Guards';
import { getMockS4Context } from '../stages/s4/s4Contract';

interface BatchPlanningProps {
  onNavigate?: (view: NavView) => void;
}

// --- SUB-COMPONENT: Batch List ---
const BatchList: React.FC = () => {
  const { role } = useContext(UserContext);
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchFlowInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // S4 Context for Guards
  const s4Context = getMockS4Context();
  const createAction = getS4ActionState(role, s4Context, 'CREATE_BATCH_PLAN');

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.list);
      const result = await res.json();
      if (result.ok) setBatches(result.data);
    } catch (e) {
      console.error("S4: Failed to fetch batches", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S4'));
    fetchBatches();
  }, []);

  const handleCreate = () => {
    if (createAction.enabled) {
      navigate('create');
    }
  };

  const filteredBatches = batches.filter(b => 
    b.draft.batchName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.draft.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.instanceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
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
          <button 
            className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            disabled={!createAction.enabled}
            onClick={handleCreate}
            title={createAction.reason}
          >
            <Plus size={16} />
            <span>Create Plan</span>
          </button>
          {!createAction.enabled && <DisabledHint reason={createAction.reason || 'Blocked'} />}
        </div>
      </div>

      <div className="shrink-0">
        <StageStateBanner stageId="S4" />
        <PreconditionsPanel stageId="S4" />
      </div>

      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S4 Activity
          </div>
          <div className="space-y-2">
              {localEvents.slice(0, 2).map(evt => (
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

      {/* Main Listing Table */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-700 text-sm">Batch Registry</h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search batches..." 
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={fetchBatches} 
                className={`p-1.5 rounded hover:bg-slate-200 text-slate-400 transition-all ${isLoading ? 'animate-spin' : ''}`}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              <button className="p-1.5 rounded hover:bg-slate-200 text-slate-400">
                <Filter size={14} />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                 <tr>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs w-32">Batch ID</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">Name</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs">Product SKU</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-right">Planned Qty</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-center">Status</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-right">Created</th>
                    <th className="px-6 py-3 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredBatches.length === 0 && !isLoading ? (
                    <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                             <CalendarClock size={32} className="text-slate-300" />
                             <p>No manufacturing batches found.</p>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    filteredBatches.map(batch => (
                       <tr key={batch.instanceId} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 font-mono font-bold text-slate-700 text-xs">{batch.instanceId}</td>
                          <td className="px-6 py-3 font-medium text-slate-800">{batch.draft.batchName}</td>
                          <td className="px-6 py-3 text-slate-600 font-mono text-xs">{batch.draft.skuCode}</td>
                          <td className="px-6 py-3 text-right font-mono">{batch.draft.plannedQuantity}</td>
                          <td className="px-6 py-3 text-center">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                batch.state === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                batch.state === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                batch.state === 'InProgress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                             }`}>
                                {batch.state}
                             </span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs text-slate-500 font-mono">
                             {new Date(batch.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                             <button 
                                onClick={() => navigate(batch.instanceId)}
                                className="text-brand-600 hover:text-brand-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-brand-50 transition-colors flex items-center gap-1 ml-auto"
                             >
                                <Eye size={14} /> View
                             </button>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Wizard Route Wrapper ---
const BatchWizardRoute: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
       <div className="mb-4">
          <button 
            onClick={() => navigate('..')} 
            className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium transition-colors"
          >
             <ArrowLeft size={12} /> Back to List
          </button>
       </div>
       <div className="flex-1 min-h-0">
          <BatchFlowWizard instanceId={id} onExit={() => navigate('..')} />
       </div>
    </div>
  );
};

// --- MAIN COMPONENT: Router Host ---
export const BatchPlanning: React.FC<BatchPlanningProps> = () => {
  const { role } = useContext(UserContext);

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
    <Routes>
      <Route index element={<BatchList />} />
      <Route path="create" element={<BatchWizardRoute />} />
      <Route path=":id" element={<BatchWizardRoute />} />
    </Routes>
  );
};
