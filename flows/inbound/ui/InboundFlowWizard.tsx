
/**
 * Inbound Flow Wizard (FLOW-003)
 * Standardized step-wizard for Material Receipt, Serialization & QC.
 * Wired to simulated /api/flows/inbound/* endpoints.
 * @foundation V34-S3-FLOW-003-PP-04
 * @updated V34-S3-GOV-FP-24 (Route-Based Navigation)
 * @updated V34-S3-GOV-FP-26 (Split Disposition)
 * @updated V34-S3-GOV-FP-27 (Traceability Inputs)
 * @updated V34-S3-GOV-FP-28 (Supplier Mandatory)
 */

import React, { useState, useEffect } from 'react';
import { 
  Barcode, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck,
  Monitor,
  Tablet,
  Smartphone,
  Cloud,
  Loader2,
  AlertCircle,
  ScanLine,
  XCircle,
  ArrowRight,
  Printer
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { 
  type InboundReceiptDraft, 
  type InboundFlowRole, 
  type InboundFlowInstance,
  INBOUND_FLOW_ENDPOINTS,
} from '../index';
import { 
  InboundWizardModel, 
  createDefaultInboundWizardModel,
  resolveInboundStepFromState,
  SerialItemState,
  InboundWizardStepId
} from './inboundWizardModel';
import { apiFetch } from '../../../services/apiHarness';
import { emitAuditEvent } from '../../../utils/auditEvents';
import { useNavigate, useLocation } from 'react-router-dom';

interface InboundFlowWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

interface ExtendedInboundWizardModel extends InboundWizardModel {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const InboundFlowWizard: React.FC<InboundFlowWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [model, setModel] = useState<ExtendedInboundWizardModel>(() => ({
    ...createDefaultInboundWizardModel(),
    isLoading: !!instanceId
  }));
  
  const [serializationMode, setSerializationMode] = useState<'GENERATE' | 'SCAN'>('GENERATE');
  
  const isDesktop = layout === 'desktop';
  const isTablet = layout === 'tablet';
  const isMobile = layout === 'mobile';
  const isTouch = isTablet || isMobile;

  const isSerialized = model.state === 'Serialized' || model.state === 'QCPending' || model.state === 'Disposition' || model.state === 'Released' || model.state === 'Blocked' || model.state === 'Scrapped' || model.state === 'Completed';

  // Determine current step from URL
  const getCurrentStepFromUrl = (): InboundWizardStepId => {
    const path = location.pathname;
    if (path.endsWith('/serialization')) return 'SERIALIZATION';
    if (path.endsWith('/qc')) return 'QC';
    if (path.endsWith('/disposition')) return 'DISPOSITION';
    return 'RECEIPT';
  };

  // Sync Step with URL
  useEffect(() => {
    if (instanceId) {
        const urlStep = getCurrentStepFromUrl();
        if (model.step !== urlStep) {
            setModel(m => ({ ...m, step: urlStep }));
        }
    }
  }, [location.pathname, instanceId]);

  // Load existing instance if provided
  useEffect(() => {
    if (instanceId && !model.instanceId) {
      loadInstance(instanceId);
    }
  }, [instanceId]);

  const loadInstance = async (id: string) => {
    setModel(m => ({ ...m, isLoading: true, error: null }));
    try {
      const res = await apiFetch(`${INBOUND_FLOW_ENDPOINTS.get}?id=${id}`);
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

  const handleUpdateReceipt = (field: keyof InboundReceiptDraft, value: any) => {
    setModel(m => ({
      ...m,
      receipt: { ...m.receipt, [field]: value }
    }));
  };

  const handleRoleChange = (role: InboundFlowRole) => {
    setModel(m => ({ ...m, role }));
  };

  const syncModel = (instance: InboundFlowInstance) => {
    // Map API serializedItems to UI model items
    const mappedItems: SerialItemState[] = instance.serializedItems?.map(item => ({
      serial: item.serialNumber,
      isVerified: true, 
      qcStatus: item.status === 'PASSED' ? 'PASS' : item.status === 'BLOCKED' || item.status === 'FAILED' ? 'FAIL' : undefined,
      disposition: item.disposition // V34-S3-GOV-FP-26
    })) || [];

    const correctStep = resolveInboundStepFromState(instance.state);

    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: correctStep,
      receipt: instance.receipt,
      serializedItems: mappedItems.length > 0 ? mappedItems : m.serializedItems,
      isSyncing: false,
      error: null
    }));

    if (instance.instanceId) {
        const targetPath = getPathForStep(instance.instanceId, correctStep);
        if (location.pathname !== targetPath) {
            navigate(targetPath, { replace: true });
        }
    }
  };

  const getPathForStep = (id: string, step: InboundWizardStepId): string => {
      const base = `/stores/inbound/${id}`;
      switch (step) {
          case 'SERIALIZATION': return `${base}/serialization`;
          case 'QC': return `${base}/qc`;
          case 'DISPOSITION': return `${base}/disposition`;
          default: return base;
      }
  };

  const handleApiError = (err: any) => {
    console.error("Inbound Flow API Error:", err);
    setModel(m => ({
      ...m,
      isSyncing: false,
      error: err?.message || "Communication failure with simulated API."
    }));
  };

  const handleCreateReceipt = async () => {
    if (model.isSyncing) return;
    
    // Basic validation
    if (!model.receipt.grnNumber || !model.receipt.supplierName) {
        setModel(m => ({ ...m, error: "GRN Number and Supplier Name are required." }));
        return;
    }

    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.create, {
        method: 'POST',
        body: JSON.stringify({ receipt: model.receipt })
      });
      const result = await res.json();
      if (result.ok) {
        const newInstance = result.data;
        syncModel(newInstance);
        emitAuditEvent({
          stageId: 'S3',
          actionId: 'INBOUND_RECEIPT_CREATED',
          actorRole: model.role,
          message: `Receipt created for ${model.receipt.grnNumber} from ${model.receipt.supplierName}`
        });
        navigate(`/stores/inbound/${newInstance.instanceId}/serialization`);
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleCommitSerialization = async () => {
    if (!model.instanceId || model.isSyncing) return;
    
    let serialsToSend: string[] = [];

    if (serializationMode === 'GENERATE') {
        if (model.serializedItems.length === 0) {
            const prefix = model.receipt.materialCode.split('-')[0] || 'MAT';
            const grnSuffix = model.receipt.grnNumber.split('-').pop() || '000';
            const year = new Date().getFullYear();
            
            serialsToSend = Array.from({ length: model.receipt.quantityReceived }).map((_, i) => 
                `${prefix}-${year}-${grnSuffix}-${String(i + 1).padStart(3, '0')}`
            );
        } else {
            serialsToSend = model.serializedItems.map(i => i.serial);
        }
    } else {
        if (model.serializedItems.length !== model.receipt.quantityReceived) {
            setModel(m => ({ ...m, error: `Scan count mismatch.` }));
            return;
        }
        serialsToSend = model.serializedItems.map(i => i.serial);
    }

    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.serialize, {
        method: 'POST',
        body: JSON.stringify({ instanceId: model.instanceId, serials: serialsToSend })
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

  const handleProceedToQc = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.submitQc, {
          method: 'POST',
          body: JSON.stringify({ instanceId: model.instanceId })
      });
      const result = await res.json();
      if (result.ok) {
        syncModel(result.data);
        navigate(`/stores/inbound/${model.instanceId}/qc`);
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleToggleQc = (serial: string, status: 'PASS' | 'FAIL') => {
    setModel(m => ({
      ...m,
      serializedItems: m.serializedItems.map(item => 
        item.serial === serial ? { ...item, qcStatus: status } : item
      )
    }));
  };

  const handleCompleteQc = async () => {
    if (!model.instanceId || model.isSyncing) return;
    
    const pendingItems = model.serializedItems.filter(i => !i.qcStatus);
    if (pendingItems.length > 0) {
        setModel(m => ({ ...m, error: `Please complete inspection for all items (${pendingItems.length} remaining).` }));
        return;
    }

    setModel(m => ({ ...m, isSyncing: true, error: null }));

    const passCount = model.serializedItems.filter(i => i.qcStatus === 'PASS').length;
    const failCount = model.serializedItems.filter(i => i.qcStatus === 'FAIL').length;
    const itemResults = model.serializedItems.map(i => ({
        serialNumber: i.serial,
        status: (i.qcStatus === 'PASS' ? 'PASSED' : 'BLOCKED') as 'PASSED' | 'BLOCKED'
    }));

    const decision = "PASS"; 

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.completeQc, {
        method: 'POST',
        body: JSON.stringify({ 
          instanceId: model.instanceId, 
          decision, 
          qcUser: model.role,
          remarks: "Pilot QC Complete",
          quantities: { pass: passCount, fail: failCount },
          itemResults
        })
      });
      const result = await res.json();
      if (result.ok) {
          syncModel(result.data);
          navigate(`/stores/inbound/${model.instanceId}/disposition`);
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleFinalRelease = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
        const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.release, {
            method: 'POST',
            body: JSON.stringify({ instanceId: model.instanceId })
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

  const handleScrap = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
        const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.scrap, {
            method: 'POST',
            body: JSON.stringify({ instanceId: model.instanceId, reason: "Supervisor Scrap Decision" })
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

  const DeviceIndicator = (
    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mr-4 select-none opacity-50 hover:opacity-100 transition-opacity">
      {isDesktop ? <Monitor size={10} /> : isTablet ? <Tablet size={10} /> : <Smartphone size={10} />}
      <span className="uppercase">{layout}</span>
    </div>
  );

  const RoleSwitcher = (
    <div className={`flex bg-slate-200 p-1 rounded-md ${isTouch ? 'scale-110' : ''}`}>
      {(["Stores", "QA", "Supervisor"] as InboundFlowRole[]).map(r => (
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

  // V34-S3-GOV-FP-26: Updated calculation logic for disposition buckets
  const passedItems = model.serializedItems.filter(i => i.qcStatus === 'PASS');
  const failedItems = model.serializedItems.filter(i => i.qcStatus === 'FAIL');
  
  const releasedItems = passedItems.filter(i => i.disposition === 'RELEASED');
  const scrappedItems = failedItems.filter(i => i.disposition === 'SCRAPPED');
  
  const pendingPass = passedItems.length - releasedItems.length;
  const pendingFail = failedItems.length - scrappedItems.length;

  const isDispositionFinal = ['Released', 'Scrapped', 'Completed'].includes(model.state);

  return (
    <FlowShell 
      title="Inbound Receipt & QC (FLOW-003)" 
      subtitle={isTouch ? "Warehouse Pilot" : "Material Intake, Serialization & Quality Control"}
      rightSlot={(
        <div className="flex items-center">
          {DeviceIndicator}
          {RoleSwitcher}
        </div>
      )}
    >
      <div className="h-full flex flex-col relative">
        {/* Status Bar */}
        <div className="px-6 py-1 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-[9px] font-mono text-slate-500">
           <div className="flex items-center gap-2">
              <Cloud size={10} className={model.instanceId ? "text-green-500" : "text-slate-300"} />
              <span>API: {model.instanceId ? `Connected (${model.instanceId})` : 'Local Draft'}</span>
           </div>
           {(model.isSyncing || model.isLoading) && <span className="animate-pulse text-brand-600 font-bold uppercase">Syncing...</span>}
        </div>

        {/* Error */}
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
            </div>
          ) : (
            <>
              {model.step === "RECEIPT" && (
                <FlowStep stepTitle="Record Material Receipt" stepHint="Log physical arrival against PO.">
                  <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">GRN Number <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        value={model.receipt.grnNumber}
                        onChange={e => handleUpdateReceipt('grnNumber', e.target.value)}
                        placeholder="e.g. GRN-2026-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Supplier Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        value={model.receipt.supplierName}
                        onChange={e => handleUpdateReceipt('supplierName', e.target.value)}
                        placeholder="e.g. CellGlobal Dynamics"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Material Code</label>
                      <select 
                         className="w-full border border-slate-300 rounded p-2 bg-white text-sm"
                         value={model.receipt.materialCode}
                         onChange={e => handleUpdateReceipt('materialCode', e.target.value)}
                      >
                         <option value="">Select...</option>
                         <option value="CELL-LFP-21700">CELL-LFP-21700</option>
                      </select>
                    </div>
                     <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Quantity</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        value={model.receipt.quantityReceived || ''}
                        onChange={e => handleUpdateReceipt('quantityReceived', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">PO Number</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        value={model.receipt.poNumber || ''}
                        onChange={e => handleUpdateReceipt('poNumber', e.target.value)}
                        placeholder="e.g. PO-2026-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Supplier Lot</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        value={model.receipt.supplierLotNumber || ''}
                        onChange={e => handleUpdateReceipt('supplierLotNumber', e.target.value)}
                        placeholder="e.g. SL-99281"
                      />
                    </div>
                  </div>
                </FlowStep>
              )}

              {model.step === "SERIALIZATION" && (
                <FlowStep stepTitle="Serialization" stepHint="Generate unique IDs.">
                   <div className="flex flex-col items-center justify-center my-6 gap-4">
                     {model.serializedItems.length === 0 ? (
                        <button onClick={handleCommitSerialization} className="bg-brand-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-sm hover:bg-brand-700 transition-colors">
                            <Barcode size={20} />
                            Generate Serial Numbers
                        </button>
                     ) : (
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">{model.serializedItems.length}</div>
                            <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Serials Generated</div>
                            
                            <div className="mt-6 max-h-64 overflow-y-auto border border-slate-200 rounded w-full max-w-md mx-auto bg-slate-50 p-2">
                                <div className="grid grid-cols-1 gap-1 text-left">
                                    {model.serializedItems.slice(0, 10).map((item, i) => (
                                        <div key={i} className="text-xs font-mono text-slate-600 bg-white p-1 rounded border border-slate-100">{item.serial}</div>
                                    ))}
                                    {model.serializedItems.length > 10 && (
                                        <div className="text-xs text-slate-400 italic p-1 text-center">... and {model.serializedItems.length - 10} more</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-4 flex justify-center">
                                <button className="text-xs flex items-center gap-1 text-brand-600 font-bold border border-brand-200 px-3 py-1.5 rounded hover:bg-brand-50">
                                    <Printer size={12} /> Print Labels
                                </button>
                            </div>
                        </div>
                     )}
                   </div>
                </FlowStep>
              )}

              {model.step === "QC" && (
                <FlowStep stepTitle="Quality Control" stepHint="Inspect items and record disposition.">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="text-xs font-bold text-slate-700 uppercase">Inspection List</h4>
                            <div className="text-xs text-slate-500">
                                {passedItems.length} Pass / {failedItems.length} Fail / {model.serializedItems.length - passedItems.length - failedItems.length} Pending
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-0">
                            {model.serializedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <ScanLine size={16} className="text-slate-400" />
                                        <span className="font-mono text-sm text-slate-700">{item.serial}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleToggleQc(item.serial, 'PASS')}
                                            className={`px-3 py-1 rounded text-xs font-bold border ${item.qcStatus === 'PASS' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'}`}
                                        >
                                            PASS
                                        </button>
                                        <button 
                                            onClick={() => handleToggleQc(item.serial, 'FAIL')}
                                            className={`px-3 py-1 rounded text-xs font-bold border ${item.qcStatus === 'FAIL' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}
                                        >
                                            FAIL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FlowStep>
              )}

              {model.step === "DISPOSITION" && (
                <FlowStep stepTitle="Batch Disposition" stepHint="Finalize receipt outcome.">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-700 mb-1">
                                {releasedItems.length} <span className="text-lg text-green-500">/ {passedItems.length}</span>
                            </div>
                            <div className="text-xs uppercase font-bold text-green-800">Ready for Release</div>
                            {pendingPass > 0 && <div className="text-[10px] text-green-600 mt-1">{pendingPass} Pending Action</div>}
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-red-700 mb-1">
                                {scrappedItems.length} <span className="text-lg text-red-500">/ {failedItems.length}</span>
                            </div>
                            <div className="text-xs uppercase font-bold text-red-800">Scrapped / Blocked</div>
                            {pendingFail > 0 && <div className="text-[10px] text-red-600 mt-1">{pendingFail} Pending Action</div>}
                        </div>
                    </div>

                    {!isDispositionFinal ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-bold text-blue-900 text-sm mb-2">Disposition Actions</h4>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleFinalRelease}
                                        disabled={pendingPass === 0 || model.role === 'QA'}
                                        className="flex-1 bg-green-600 text-white py-3 rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                                        title={model.role === 'QA' ? "Requires Stores/Supervisor" : "Release Passed items to inventory"}
                                    >
                                        <CheckCircle2 size={16} /> Release Passed ({pendingPass})
                                    </button>
                                    
                                    {failedItems.length > 0 && (
                                        <button 
                                            onClick={handleScrap}
                                            disabled={pendingFail === 0 || model.role === 'Stores'}
                                            className="flex-1 bg-white border border-red-300 text-red-700 py-3 rounded font-bold text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            title="Scrap entire batch or blocked items"
                                        >
                                            <XCircle size={16} /> Scrap Blocked ({pendingFail})
                                        </button>
                                    )}
                                </div>
                                {model.role === 'QA' && (
                                    <div className="mt-2 text-xs text-blue-600 italic">
                                        Note: Final release must be performed by Stores or Supervisor.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${model.state === 'Released' || model.state === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {model.state === 'Released' || model.state === 'Completed' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Workflow Finalized</h3>
                            <p className="text-slate-500 text-sm mt-1">Batch status: <strong>{model.state}</strong></p>
                        </div>
                    )}
                </FlowStep>
              )}
            </>
          )}
        </div>

        <FlowFooter 
          left={<button onClick={onExit}>Cancel</button>}
          right={
             <div className="flex gap-2">
               {model.step === 'RECEIPT' && (
                 <button onClick={handleCreateReceipt} className="bg-brand-600 text-white px-4 py-2 rounded">Next: Serialize</button>
               )}
               {model.step === 'SERIALIZATION' && (
                 <button onClick={handleProceedToQc} disabled={!isSerialized} className="bg-brand-600 text-white px-4 py-2 rounded">Next: QC</button>
               )}
               {model.step === 'QC' && (
                 <button onClick={handleCompleteQc} className="bg-brand-600 text-white px-4 py-2 rounded shadow-sm">Complete Inspection <ArrowRight size={14} className="inline ml-1" /></button>
               )}
               {model.step === 'DISPOSITION' && isDispositionFinal && (
                 <button onClick={onExit} className="bg-slate-800 text-white px-6 py-2 rounded shadow-sm">Close</button>
               )}
             </div>
          }
        />
      </div>
    </FlowShell>
  );
};
