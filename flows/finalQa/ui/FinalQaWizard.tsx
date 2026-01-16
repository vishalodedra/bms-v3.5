/**
 * Final QA Wizard (FLOW-004)
 * Step-wizard for Final Pack QA & Digital Twin Binding.
 * Wired to simulated /api/flows/final-qa/* endpoints.
 * @foundation V34-S9-FLOW-004-PP-04
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  ClipboardCheck, 
  Zap, 
  Settings, 
  Battery, 
  Info,
  User,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
  Fingerprint,
  Link,
  Plus,
  Cloud,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { 
  FinalQaWizardModel, 
  createDefaultFinalQaWizardModel,
  FinalQaStepId 
} from './finalQaWizardModel';
import { 
  type FinalQaRole, 
  type FinalQaFlowState, 
  type FinalQaFlowInstance,
  FINAL_QA_FLOW_ENDPOINTS,
  isActionAllowed 
} from '../index';
import { apiFetch } from '../../../services/apiHarness';

interface FinalQaWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

interface ExtendedFinalQaWizardModel extends FinalQaWizardModel {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const FinalQaWizard: React.FC<FinalQaWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const [model, setModel] = useState<ExtendedFinalQaWizardModel>(() => ({
    ...createDefaultFinalQaWizardModel(),
    isLoading: !!instanceId
  }));

  const isDesktop = layout === 'desktop';
  const isTouch = layout !== 'desktop';

  // Load existing instance if provided
  useEffect(() => {
    if (instanceId && !model.instanceId) {
      loadInstance(instanceId);
    }
  }, [instanceId]);

  const loadInstance = async (id: string) => {
    setModel(m => ({ ...m, isLoading: true, error: null }));
    try {
      const res = await apiFetch(`${FINAL_QA_FLOW_ENDPOINTS.get}?id=${id}`);
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

  const syncModel = (instance: FinalQaFlowInstance) => {
    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: instance.state === 'Pending' ? 'CHECKLIST' : 'COMPLETION',
      draft: instance.draft,
      batteryId: instance.batteryId,
      rejectionReason: instance.rejectionReason,
      reworkNotes: instance.reworkNotes,
      isSyncing: false,
      error: null
    }));
  };

  const handleApiError = (err: any) => {
    console.error("Final QA API Error:", err);
    setModel(m => ({
      ...m,
      isSyncing: false,
      error: err?.message || "Communication failure with simulated API."
    }));
  };

  // State transitions
  const handleUpdateChecklist = (id: string, result: "PASS" | "FAIL" | "NA") => {
    setModel(m => ({
      ...m,
      draft: {
        ...m.draft,
        checklist: m.draft.checklist.map(item => item.id === id ? { ...item, result } : item)
      }
    }));
  };

  const handleNext = async () => {
    if (model.step === "PACK_INFO") {
      // Create instance on transition from Pack Info
      setModel(m => ({ ...m, isSyncing: true, error: null }));
      try {
        const res = await apiFetch(FINAL_QA_FLOW_ENDPOINTS.create, {
          method: 'POST',
          body: JSON.stringify({ draft: model.draft })
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } catch (e) {
        handleApiError(e);
      }
    } else if (model.step === "CHECKLIST") {
      setModel(m => ({ ...m, step: "DECISION" }));
    }
  };

  const handleDecision = async (decision: "APPROVE" | "REJECT" | "REWORK") => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      // Fix: Explicitly type endpoint as string to allow assignment of different FINAL_QA_FLOW_ENDPOINTS literal values.
      let endpoint: string = FINAL_QA_FLOW_ENDPOINTS.approve;
      let body: any = { instanceId: model.instanceId };

      if (decision === "APPROVE") {
        body.approvedBy = model.role;
      } else if (decision === "REJECT") {
        // Fix: Successfully assign reject endpoint string now that type is string.
        endpoint = FINAL_QA_FLOW_ENDPOINTS.reject;
        body.rejectedBy = model.role;
        body.reason = model.rejectionReason || "Checklist criteria failed.";
      } else {
        // Fix: Successfully assign rework endpoint string now that type is string.
        endpoint = FINAL_QA_FLOW_ENDPOINTS.rework;
        body.requestedBy = model.role;
        body.notes = model.reworkNotes || "Correction needed in assembly.";
      }

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.ok) syncModel(result.data);
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleReset = () => {
    setModel({
      ...createDefaultFinalQaWizardModel(),
      isLoading: false
    });
  };

  // UI Components
  const RoleSwitcher = (
    <div className="flex bg-slate-200 p-1 rounded-md">
      {(["QA", "Supervisor"] as FinalQaRole[]).map(r => (
        <button 
          key={r}
          onClick={() => setModel(m => ({ ...m, role: r }))}
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

  const DeviceIndicator = (
    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mr-4 select-none opacity-50">
      {layout === 'desktop' ? <Monitor size={10} /> : layout === 'tablet' ? <Tablet size={10} /> : <Smartphone size={10} />}
      <span className="uppercase">{layout}</span>
    </div>
  );

  return (
    <FlowShell 
      title="Final QA & Registry (FLOW-004)" 
      subtitle="Pack Validation and Digital Identity Generation"
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
              <span>API: {model.instanceId ? `Connected (${model.instanceId})` : 'Local Draft'}</span>
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
              {model.step === "PACK_INFO" && (
                <FlowStep 
                  stepTitle="Select Pack for Inspection" 
                  stepHint="Initialize the final QA process for a serialized battery pack."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Pack Serial ID</label>
                      <select 
                        className="w-full border border-slate-300 rounded p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-mono"
                        value={model.draft.packId}
                        onChange={e => setModel(m => ({ ...m, draft: { ...m.draft, packId: e.target.value } }))}
                      >
                        <option value="">Select Pack...</option>
                        <option value="PCK-2026-001-042">PCK-2026-001-042</option>
                        <option value="PCK-2026-001-043">PCK-2026-001-043</option>
                        <option value="PCK-2026-001-044">PCK-2026-001-044</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Associated SKU</label>
                      <div className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700 font-medium">
                        {model.draft.packId ? 'BP-LFP-48V-2.5K' : '--'}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 mt-4">
                    <Info size={18} className="text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Only packs that have cleared <strong>S7 Pack Assembly</strong> and <strong>S8 Aging & Soak</strong> are available for final registry entry.
                    </p>
                  </div>
                </FlowStep>
              )}

              {model.step === "CHECKLIST" && (
                <FlowStep 
                  stepTitle="QA Inspection Checklist" 
                  stepHint="Record pass/fail results for end-of-line verification items."
                >
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-6 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">PACK: {model.draft.packId}</span>
                    <span className="text-slate-400">Owner: {model.role}</span>
                  </div>

                  <div className="space-y-3">
                    {model.draft.checklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex-1 pr-4">
                          <div className="text-sm font-bold text-slate-700">{item.label}</div>
                          <div className="text-[10px] text-slate-400 uppercase mt-0.5">AIS-156 Compliance Ref</div>
                        </div>
                        <div className="flex gap-1.5">
                          {(["PASS", "FAIL", "NA"] as const).map(res => (
                            <button
                              key={res}
                              onClick={() => handleUpdateChecklist(item.id, res)}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                                item.result === res 
                                  ? (res === "PASS" ? "bg-green-600 border-green-600 text-white" : 
                                     res === "FAIL" ? "bg-red-600 border-red-600 text-white" : 
                                     "bg-slate-600 border-slate-600 text-white")
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              {res}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </FlowStep>
              )}

              {model.step === "DECISION" && (
                <FlowStep 
                  stepTitle="Final Disposition" 
                  stepHint="Authorized decision to approve, reject, or request rework."
                >
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-6 grid grid-cols-2 gap-4 text-xs">
                    <div>
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Pack Identity</label>
                       <div className="font-bold text-slate-700">{model.draft.packId}</div>
                    </div>
                    <div className="text-right">
                       <label className="text-[9px] font-bold text-slate-400 uppercase">Checklist Result</label>
                       <div className="font-bold text-green-600">VALIDATED</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <button 
                      onClick={() => handleDecision("APPROVE")}
                      disabled={!isActionAllowed(model.role, model.state, "APPROVE")}
                      className="p-6 bg-white border-2 border-green-500 rounded-xl shadow-sm hover:shadow-md hover:bg-green-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:grayscale group"
                     >
                        <div className="p-3 bg-green-100 rounded-full text-green-600 group-hover:scale-110 transition-transform">
                          <ShieldCheck size={32} />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-900 uppercase tracking-tight">Approve</div>
                          <div className="text-[10px] text-green-700 mt-1">Bind to Registry</div>
                        </div>
                     </button>

                     <button 
                      onClick={() => handleDecision("REWORK")}
                      disabled={!isActionAllowed(model.role, model.state, "REQUEST_REWORK")}
                      className="p-6 bg-white border-2 border-amber-400 rounded-xl shadow-sm hover:shadow-md hover:bg-amber-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:grayscale group"
                     >
                        <div className="p-3 bg-amber-100 rounded-full text-amber-600 group-hover:scale-110 transition-transform">
                          <RotateCcw size={32} />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-amber-900 uppercase tracking-tight">Rework</div>
                          <div className="text-[10px] text-amber-700 mt-1">Return to Station</div>
                        </div>
                     </button>

                     <button 
                      onClick={() => handleDecision("REJECT")}
                      disabled={!isActionAllowed(model.role, model.state, "REJECT")}
                      className="p-6 bg-white border-2 border-red-500 rounded-xl shadow-sm hover:shadow-md hover:bg-red-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50 disabled:grayscale group"
                     >
                        <div className="p-3 bg-red-100 rounded-full text-red-600 group-hover:scale-110 transition-transform">
                          <ShieldAlert size={32} />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-900 uppercase tracking-tight">Reject</div>
                          <div className="text-[10px] text-red-700 mt-1">Scrap / Quarantine</div>
                        </div>
                     </button>
                  </div>

                  {!isActionAllowed(model.role, model.state, "APPROVE") && (
                    <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>Switch role to <strong>Supervisor</strong> to record the final disposition.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "COMPLETION" && (
                <FlowStep 
                  stepTitle="Flow Complete" 
                  stepHint="The session has been finalized and the outcome recorded."
                >
                   <div className="flex flex-col items-center py-10 text-center">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg animate-in zoom-in duration-500 ${
                        model.state === "Approved" ? "bg-green-100 text-green-600" :
                        model.state === "Rejected" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                      }`}>
                        {model.state === "Approved" ? <CheckCircle2 size={48} /> : 
                         model.state === "Rejected" ? <XCircle size={48} /> : 
                         <RotateCcw size={48} />}
                      </div>

                      <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                        Pack {model.state}
                      </h3>
                      
                      {model.state === "Approved" && model.batteryId && (
                        <div className="mt-6 w-full max-w-sm">
                           <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-700 shadow-xl flex flex-col items-center gap-2">
                              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                 <Fingerprint size={10} /> New Battery ID Generated
                              </div>
                              <div className="text-xl font-mono font-bold tracking-widest text-brand-400">
                                 {model.batteryId}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                 <Link size={10} /> Bound to Pack {model.draft.packId}
                              </div>
                           </div>
                        </div>
                      )}

                      <p className="text-slate-500 max-w-sm mt-4 text-sm leading-relaxed">
                        {model.state === "Approved" ? "Digital identity established. Pack is now available for S11 Warehousing and Dispatch." :
                         model.state === "Rejected" ? "Outcome recorded. Item has been moved to quarantined holding area." :
                         "Rework request sent to assembly line. Pack ID remains locked in S9 queue."}
                      </p>
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
              Exit Flow
            </button>
          }
          right={
            <div className="flex items-center gap-3">
              {model.step === "PACK_INFO" && (
                <button 
                  onClick={handleNext}
                  disabled={!model.draft.packId || model.isSyncing}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  Next: Inspection <ChevronRight size={16} />
                </button>
              )}

              {model.step === "CHECKLIST" && (
                <>
                  <button 
                    onClick={() => setModel(m => ({ ...m, step: "PACK_INFO" }))}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={model.role !== 'QA'}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Next: Disposition <ChevronRight size={16} />
                  </button>
                </>
              )}

              {model.step === "DECISION" && (
                 <button 
                    onClick={() => setModel(m => ({ ...m, step: "CHECKLIST" }))}
                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
                  >
                    Back
                  </button>
              )}

              {model.step === "COMPLETION" && (
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                >
                  Process New Pack <Plus size={16} />
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
