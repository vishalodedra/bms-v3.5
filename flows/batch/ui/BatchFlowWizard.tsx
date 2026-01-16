/**
 * Batch Flow Wizard (FLOW-002)
 * Standardized step-wizard for Batch / Work Order lifecycle.
 * Wired to simulated /api/flows/batch/* endpoints.
 * @foundation V34-S2-FLOW-002-PP-03
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck,
  Monitor,
  Tablet,
  Smartphone,
  Clock,
  Cloud,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { 
  type BatchDraft, 
  type BatchFlowRole, 
  type BatchFlowState,
  type BatchFlowInstance,
  BATCH_FLOW_ENDPOINTS,
  canApprove,
  canStart,
  canComplete,
  // resolveBatchStepFromState removed from here as it is a UI model helper
  type CreateBatchReq,
  type ApproveBatchReq,
  type StartBatchReq,
  type CompleteBatchReq
} from '../index';
import { 
  BatchWizardModel, 
  createDefaultBatchWizardModel,
  // Fix: Moved resolveBatchStepFromState to its source file within the UI package
  resolveBatchStepFromState
} from './batchWizardModel';
import { apiFetch } from '../../../services/apiHarness';

interface BatchFlowWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

interface ExtendedBatchWizardModel extends BatchWizardModel {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const BatchFlowWizard: React.FC<BatchFlowWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const [model, setModel] = useState<ExtendedBatchWizardModel>(() => ({
    ...createDefaultBatchWizardModel(),
    isLoading: !!instanceId
  }));

  const isDesktop = layout === 'desktop';

  // Load existing instance if provided
  useEffect(() => {
    if (instanceId && !model.instanceId) {
      loadInstance(instanceId);
    }
  }, [instanceId]);

  const loadInstance = async (id: string) => {
    setModel(m => ({ ...m, isLoading: true, error: null }));
    try {
      const res = await apiFetch(`${BATCH_FLOW_ENDPOINTS.get}?id=${id}`);
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    } finally {
      setModel(m => ({ ...m, isLoading: false }));
    }
  };

  const handleUpdateDraft = (field: keyof BatchDraft, value: any) => {
    setModel(m => ({
      ...m,
      draft: { ...m.draft, [field]: value }
    }));
  };

  const handleRoleChange = (role: BatchFlowRole) => {
    setModel(m => ({ ...m, role }));
  };

  const syncModel = (instance: BatchFlowInstance) => {
    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: resolveBatchStepFromState(instance.state),
      draft: instance.draft,
      isSyncing: false,
      error: null
    }));
  };

  const handleApiError = (err: any) => {
    console.error("Batch Flow API Error:", err);
    setModel(m => ({
      ...m,
      isSyncing: false,
      error: err?.message || "Communication failure with simulated API."
    }));
  };

  const handleSaveAndSubmitPlan = async () => {
    if (model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: CreateBatchReq = { draft: model.draft };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.create, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleAuthorize = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: ApproveBatchReq = { 
        instanceId: model.instanceId, 
        approvedBy: model.role 
      };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.approve, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleStartExecution = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: StartBatchReq = { instanceId: model.instanceId };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.start, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleMarkComplete = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: CompleteBatchReq = { instanceId: model.instanceId };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.complete, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleReset = () => {
    setModel({
      ...createDefaultBatchWizardModel(),
      isLoading: false
    });
  };

  // UI Components
  const DeviceIndicator = (
    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mr-4 select-none opacity-50 hover:opacity-100 transition-opacity">
      {isDesktop ? <Monitor size={10} /> : layout === 'tablet' ? <Tablet size={10} /> : <Smartphone size={10} />}
      <span className="uppercase">{layout}</span>
    </div>
  );

  const RoleSwitcher = (
    <div className="flex bg-slate-200 p-1 rounded-md">
      {(["Planner", "Supervisor", "Operator"] as BatchFlowRole[]).map(r => (
        <button 
          key={r}
          onClick={() => handleRoleChange(r)}
          className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
            model.role === r 
            ? 'bg-white text-brand-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const Summary = () => (
    <div className="bg-slate-50 p-4 rounded border border-slate-200 shadow-inner grid grid-cols-2 gap-4 text-sm">
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-400">Batch Name</label>
        <div className="font-bold text-slate-700">{model.draft.batchName || '--'}</div>
      </div>
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-400">SKU Code</label>
        <div className="font-mono font-bold text-slate-700">{model.draft.skuCode || '--'}</div>
      </div>
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-400">Quantity</label>
        <div className="font-medium text-slate-800">{model.draft.plannedQuantity || '0'} Units</div>
      </div>
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-400">Status</label>
        <div className="font-bold text-brand-600 uppercase text-xs">{model.state}</div>
      </div>
    </div>
  );

  return (
    <FlowShell 
      title="Batch Flow Wizard (FLOW-002)" 
      subtitle="Planning & Execution Lifecycle"
      rightSlot={(
        <div className="flex items-center">
          {DeviceIndicator}
          {RoleSwitcher}
        </div>
      )}
    >
      <div className="h-full flex flex-col relative">
        {/* Status Line */}
        <div className="px-6 py-1 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-500">
           <div className="flex items-center gap-2">
              <Cloud size={10} className={model.instanceId ? "text-green-500" : "text-slate-300"} />
              <span>API: {model.instanceId ? `Sim Connected (${model.instanceId})` : 'Local Draft'}</span>
           </div>
           {(model.isSyncing || model.isLoading) && <span className="animate-pulse text-brand-600 font-bold uppercase">Syncing...</span>}
        </div>

        {/* Global Error Banner */}
        {model.error && (
          <div className="px-6 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span className="font-medium">{model.error}</span>
          </div>
        )}

        <div className={`flex-1 ${(model.isSyncing || model.isLoading) ? 'opacity-50 pointer-events-none' : ''}`}>
          {model.isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-brand-500" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Instance...</p>
            </div>
          ) : (
            <>
              {model.step === "DRAFT" && (
                <FlowStep 
                  stepTitle="Define Batch Parameters" 
                  stepHint="Specify production requirements for this run."
                >
                  <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Batch Name</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="e.g. MORNING_SHIFT_LFP_01"
                        value={model.draft.batchName}
                        onChange={e => handleUpdateDraft('batchName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">SKU Code</label>
                      <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm outline-none bg-white"
                        value={model.draft.skuCode}
                        onChange={e => handleUpdateDraft('skuCode', e.target.value)}
                      >
                        <option value="">Select SKU...</option>
                        <option value="BP-LFP-48V-2.5K">BP-LFP-48V-2.5K</option>
                        <option value="BP-NMC-800V-75K">BP-NMC-800V-75K</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Planned Quantity</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        value={model.draft.plannedQuantity || ""}
                        onChange={e => handleUpdateDraft('plannedQuantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Planning Notes</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      rows={3}
                      value={model.draft.notes}
                      onChange={e => handleUpdateDraft('notes', e.target.value)}
                    />
                  </div>
                </FlowStep>
              )}

              {model.step === "APPROVAL" && (
                <FlowStep 
                  stepTitle="Review & Authorize" 
                  stepHint="Supervisor authorization required for execution."
                >
                  <Summary />
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 mt-6">
                    <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                    <div>
                       <h4 className="text-sm font-bold text-amber-900">Pre-Execution Check</h4>
                       <p className="text-xs text-amber-700 mt-0.5">Ensure Line A is cleared and kitting is verified by stores.</p>
                    </div>
                  </div>
                  {model.role !== 'Supervisor' && (
                    <div className="p-3 bg-slate-100 rounded text-slate-500 text-xs mt-4 italic">
                      Switch role to <strong>Supervisor</strong> to approve this batch.
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "EXECUTION" && (
                <FlowStep 
                  stepTitle="Production in Progress" 
                  stepHint="Monitoring live output from Line A."
                >
                  <Summary />
                  <div className="mt-8 space-y-6">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Current Output</div>
                        <div className="text-2xl font-mono font-bold text-slate-800">42 / {model.draft.plannedQuantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Cycle Time</div>
                        <div className="text-sm font-mono text-slate-600">14m 22s</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-brand-500 h-full w-1/3 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-white border border-slate-200 rounded flex flex-col items-center">
                        <CheckCircle2 size={20} className="text-green-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">Yield</span>
                        <span className="text-sm font-bold text-slate-700">99.2%</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded flex flex-col items-center">
                        <AlertTriangle size={20} className="text-amber-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">Rework</span>
                        <span className="text-sm font-bold text-slate-700">1</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded flex flex-col items-center">
                        <Clock size={20} className="text-blue-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">Uptime</span>
                        <span className="text-sm font-bold text-slate-700">100%</span>
                      </div>
                    </div>
                  </div>
                </FlowStep>
              )}

              {model.step === "COMPLETION" && (
                <FlowStep 
                  stepTitle="Batch Closed" 
                  stepHint="Production summary and inventory handoff."
                >
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Job Complete</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
                      Batch <strong>{model.draft.batchName}</strong> has been successfully closed. 
                      All units are now visible in Finished Goods (S11).
                    </p>
                    <div className="mt-8 w-full max-w-md text-left">
                       <Summary />
                    </div>
                  </div>
                </FlowStep>
              )}
            </>
          )}
        </div>

        <FlowFooter 
          left={
            <button 
              onClick={onExit}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel Flow
            </button>
          }
          right={
            <div className="flex items-center gap-3">
              {model.step === "DRAFT" && (
                <>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded transition-all"
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                  <button 
                    onClick={handleSaveAndSubmitPlan}
                    disabled={!model.draft.batchName || !model.draft.skuCode || model.isSyncing}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Submit Plan <ChevronRight size={16} />
                  </button>
                </>
              )}

              {model.step === "APPROVAL" && (
                <>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button 
                    onClick={handleAuthorize}
                    disabled={model.role !== 'Supervisor' || model.isSyncing}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Authorize Start <Play size={16} fill="currentColor" />
                  </button>
                </>
              )}

              {model.step === "EXECUTION" && (
                <>
                   {model.state === 'Approved' ? (
                      <button 
                        onClick={handleStartExecution}
                        disabled={model.isSyncing}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                      >
                        Start Production Run <Play size={16} fill="currentColor" />
                      </button>
                   ) : (
                      <button 
                        onClick={handleMarkComplete}
                        disabled={model.isSyncing}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                      >
                        Mark Batch Complete <CheckCircle2 size={16} />
                      </button>
                   )}
                </>
              )}

              {model.step === "COMPLETION" && (
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                >
                  Start New Batch
                </button>
              )}
            </div>
          }
        />
      </div>
    </FlowShell>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);