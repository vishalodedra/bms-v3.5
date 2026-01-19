
/**
 * SKU Flow Wizard (FLOW-001)
 * A standardized step-wizard for SKU creation lifecycle.
 * Wired to simulated /api/flows/sku/* endpoints.
 * @foundation V34-S1-FLOW-001-PP-06
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  Save, 
  User, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Monitor,
  Tablet,
  Smartphone,
  Cloud,
  AlertCircle,
  Loader2,
  Factory
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { 
  getAllowedSkuActions, 
  isActionAllowed, 
  SkuDraft,
  SkuFlowRole,
  SKU_FLOW_ENDPOINTS,
  type CreateSkuFlowReq,
  type SubmitSkuForReviewReq,
  type ReviewSkuReq,
  type ApproveSkuReq,
  type SkuFlowInstance,
} from '../index';
import { 
  WizardModel, 
  createDefaultWizardModel, 
  resolveStepFromState 
} from './skuFlowWizardModel';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { apiFetch } from '../../../services/apiHarness';

interface SkuFlowWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

// Local extension of WizardModel to include API-specific fields
interface ExtendedWizardModel extends WizardModel {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const SkuFlowWizard: React.FC<SkuFlowWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const [model, setModel] = useState<ExtendedWizardModel>(createDefaultWizardModel());
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  const roles: SkuFlowRole[] = ["Maker", "Checker", "Approver"];
  const isMobile = layout === 'mobile';
  const isTablet = layout === 'tablet';
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
      const res = await apiFetch(`${SKU_FLOW_ENDPOINTS.get}?id=${id}`);
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

  const handleUpdateDraft = (field: keyof SkuDraft, value: any) => {
    setModel(m => ({
      ...m,
      draft: { ...m.draft, [field]: value }
    }));
  };

  const handleRoleChange = (role: SkuFlowRole) => {
    setModel(m => ({ ...m, role }));
  };

  const syncModel = (instance: SkuFlowInstance) => {
    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: resolveStepFromState(instance.state),
      draft: instance.draft,
      comment: instance.rejectionReason || m.comment, // simple sim mapping
      isSyncing: false,
      error: null
    }));
  };

  const handleApiError = (err: any) => {
    console.error("SKU Flow API Error:", err);
    setModel(m => ({
      ...m,
      isSyncing: false,
      error: err?.message || "Communication failure with simulated API."
    }));
  };

  const handleSaveDraft = async () => {
    if (model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      if (!model.instanceId) {
        // Create new
        const payload: CreateSkuFlowReq = { draft: model.draft };
        const res = await apiFetch(SKU_FLOW_ENDPOINTS.create, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } else {
        // Update not implemented in sim yet, just fake success for UI flow
        setTimeout(() => {
          setModel(m => ({ ...m, isSyncing: false, error: null }));
        }, 500);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleSubmit = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: SubmitSkuForReviewReq = { instanceId: model.instanceId };
      const res = await apiFetch(SKU_FLOW_ENDPOINTS.submit, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) syncModel(result.data);
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleReview = async (decision: "SEND_BACK" | "FORWARD") => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: ReviewSkuReq = { 
        instanceId: model.instanceId, 
        decision, 
        comment: model.comment 
      };
      const res = await apiFetch(SKU_FLOW_ENDPOINTS.review, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) syncModel(result.data);
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleApprove = async (decision: "APPROVE" | "REJECT") => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: ApproveSkuReq = { 
        instanceId: model.instanceId, 
        decision, 
        reason: model.rejectionReason 
      };
      const res = await apiFetch(SKU_FLOW_ENDPOINTS.approve, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.ok) syncModel(result.data);
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleReset = () => {
    setModel(createDefaultWizardModel());
  };

  // UI Components
  const DeviceIndicator = (
    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mr-4 select-none opacity-50 hover:opacity-100 transition-opacity">
      {isDesktop && <Monitor size={10} />}
      {isTablet && <Tablet size={10} />}
      {isMobile && <Smartphone size={10} />}
      <span className="uppercase">{layout}</span>
    </div>
  );

  const RoleSwitcher = isMobile ? (
    <select 
      value={model.role} 
      onChange={(e) => handleRoleChange(e.target.value as SkuFlowRole)}
      className="bg-slate-100 text-[10px] font-bold text-slate-600 rounded border-none py-1 pl-2 pr-6 outline-none focus:ring-1 focus:ring-brand-500"
    >
      {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
    </select>
  ) : (
    <div className="flex bg-slate-200 p-1 rounded-md">
      {roles.map(r => (
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

  const Summary = () => {
    const content = (
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-2 tablet:grid-cols-1 gap-x-6 gap-y-4'} text-sm`}>
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-400">SKU Code</label>
          <div className="font-mono font-bold text-slate-700 break-all">{model.draft.skuCode || '--'}</div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-400">SKU Name</label>
          <div className="font-medium text-slate-800 truncate">{model.draft.skuName || '--'}</div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-400">Chemistry</label>
          <div className="font-medium text-slate-700">{model.draft.chemistry || '--'}</div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-bold text-slate-400">Cells Per Module</label>
          <div className="font-medium text-slate-700 font-mono">{model.draft.cellsPerModule || '--'}</div>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-inner">
          <button 
            onClick={() => setShowSummaryDetails(!showSummaryDetails)}
            className="w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
          >
            <span>SKU Summary</span>
            {showSummaryDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSummaryDetails || !model.draft.skuCode ? (
            <div className="mt-3 animate-in fade-in slide-in-from-top-1">
              {content}
            </div>
          ) : (
            <div className="mt-1 font-mono font-bold text-slate-700 text-xs truncate">
              {model.draft.skuCode} <span className="font-normal text-slate-400 ml-2">/ {model.draft.skuName}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-slate-50 p-4 rounded border border-slate-200 shadow-inner">
        {content}
      </div>
    );
  };

  return (
    <FlowShell 
      title="SKU Flow Wizard (FLOW-001)" 
      subtitle={isMobile ? "Maker-Checker-Approver" : "Maker-Checker-Approver Lifecycle"}
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
              <p className="text-sm font-bold uppercase tracking-widest">Loading Instance Data...</p>
            </div>
          ) : (
            <>
              {model.step === "DRAFT" && (
                <FlowStep 
                  stepTitle="Define SKU Specifications" 
                  stepHint={isMobile ? "Set technical parameters." : "Specify technical parameters for the new battery pack profile."}
                >
                  <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">SKU Code</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="e.g. BP-LFP-48V-V2"
                        value={model.draft.skuCode}
                        onChange={e => handleUpdateDraft('skuCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">SKU Name</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="e.g. Standard 48V LFP Module"
                        value={model.draft.skuName}
                        onChange={e => handleUpdateDraft('skuName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Chemistry</label>
                      <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm outline-none bg-white"
                        value={model.draft.chemistry}
                        onChange={e => handleUpdateDraft('chemistry', e.target.value)}
                      >
                        <option value="">Select Chemistry...</option>
                        <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                        <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                        <option value="LTO">LTO (Lithium Titanate)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Form Factor</label>
                      <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm outline-none bg-white"
                        value={model.draft.formFactor}
                        onChange={e => handleUpdateDraft('formFactor', e.target.value)}
                      >
                        <option value="">Select Form Factor...</option>
                        <option value="Pouch">Pouch Cell</option>
                        <option value="Prismatic">Prismatic</option>
                        <option value="Cylindrical">Cylindrical</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Manufacturing Definition Section */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                     <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Factory size={16} className="text-brand-500" />
                        Manufacturing Definition
                     </h4>
                     <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                         <div className="space-y-2">
                             <label className="block text-xs font-bold text-slate-600 uppercase">Cells Per Module <span className="text-red-500">*</span></label>
                             <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="e.g. 12"
                                value={model.draft.cellsPerModule || ''}
                                onChange={e => handleUpdateDraft('cellsPerModule', parseInt(e.target.value) || 0)}
                                min={1}
                             />
                             <p className="text-[10px] text-slate-400">Controls assembly validation in S5.</p>
                         </div>
                     </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Notes / Instructions</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      rows={isMobile ? 2 : 3}
                      value={model.draft.notes}
                      onChange={e => handleUpdateDraft('notes', e.target.value)}
                    />
                  </div>
                </FlowStep>
              )}

              {model.step === "REVIEW" && (
                <FlowStep 
                  stepTitle="Technical Review (Checker)" 
                  stepHint={isMobile ? "Verify engineering alignment." : "Verify that specs align with engineering standards."}
                >
                  <Summary />
                  <div className="space-y-2 mt-6">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Reviewer Comments</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      rows={isMobile ? 2 : 3}
                      placeholder="Mandatory for send-back..."
                      value={model.comment}
                      onChange={e => setModel(m => ({ ...m, comment: e.target.value }))}
                    />
                  </div>
                  {!isActionAllowed(model.role, model.state, "REVIEW_FORWARD") && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-2 text-amber-800 text-xs mt-4">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Switch role to <strong>Checker</strong> to act on this step.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "APPROVE" && (
                <FlowStep 
                  stepTitle="Final Approval (Approver)" 
                  stepHint={isMobile ? "Final manufacturing sign-off." : "Authorize this SKU for active manufacturing use."}
                >
                  <Summary />
                  {model.comment && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                      <span className="font-bold">Checker Comment:</span> {model.comment}
                    </div>
                  )}
                  <div className="space-y-2 mt-6">
                    <label className="block text-xs font-bold text-slate-600 uppercase">Approval Statement</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      rows={isMobile ? 2 : 3}
                      placeholder="Final remarks..."
                      value={model.rejectionReason}
                      onChange={e => setModel(m => ({ ...m, rejectionReason: e.target.value }))}
                    />
                  </div>
                  {!isActionAllowed(model.role, model.state, "APPROVE_TO_ACTIVE") && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-2 text-amber-800 text-xs mt-4">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Switch role to <strong>Approver</strong> to act on this step.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "PUBLISH" && (
                <FlowStep 
                  stepTitle="SKU Released" 
                  stepHint={isMobile ? "Profile is now active." : "The SKU profile is now active in the manufacturing ledger."}
                >
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Registration Complete</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-xs">
                      SKU <strong>{model.draft.skuCode}</strong> has been successfully registered and is ready for S4 Batch Planning.
                    </p>
                    <div className="mt-6 w-full max-w-md text-left">
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
              Close
            </button>
          }
          right={
            <div className={`flex ${isMobile ? 'flex-col-reverse w-full' : 'items-center'} gap-3`}>
              {model.step === "DRAFT" && (
                <>
                  <button 
                    onClick={handleReset}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded border border-transparent transition-all ${isMobile ? 'w-full' : ''}`}
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-bold text-sm hover:bg-slate-50 transition-all ${isMobile ? 'w-full' : ''}`}
                  >
                    <Save size={16} /> Save Draft
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!isActionAllowed(model.role, model.state, "SUBMIT_FOR_REVIEW") || !model.draft.skuCode || !model.draft.cellsPerModule || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm ${isMobile ? 'w-full' : ''}`}
                  >
                    Submit for Review <Send size={16} />
                  </button>
                </>
              )}

              {model.step === "REVIEW" && (
                <>
                  <button 
                    onClick={() => handleReview("SEND_BACK")}
                    disabled={!isActionAllowed(model.role, model.state, "REVIEW_SEND_BACK") || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition-all ${isMobile ? 'w-full' : ''}`}
                  >
                    <XCircle size={16} /> Send Back
                  </button>
                  <button 
                    onClick={() => handleReview("FORWARD")}
                    disabled={!isActionAllowed(model.role, model.state, "REVIEW_FORWARD") || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm ${isMobile ? 'w-full' : ''}`}
                  >
                    Forward <ChevronRight size={16} />
                  </button>
                </>
              )}

              {model.step === "APPROVE" && (
                <>
                  <button 
                    onClick={() => handleApprove("REJECT")}
                    disabled={!isActionAllowed(model.role, model.state, "REJECT") || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition-all ${isMobile ? 'w-full' : ''}`}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove("APPROVE")}
                    disabled={!isActionAllowed(model.role, model.state, "APPROVE_TO_ACTIVE") || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm ${isMobile ? 'w-full' : ''}`}
                  >
                    Approve to Active <CheckCircle2 size={16} />
                  </button>
                </>
              )}

              {model.step === "PUBLISH" && (
                <button 
                  onClick={handleReset}
                  className={`flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm ${isMobile ? 'w-full' : ''}`}
                >
                  Start New SKU <PlusIcon size={16} />
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
