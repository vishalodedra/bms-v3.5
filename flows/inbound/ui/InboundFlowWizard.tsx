/**
 * Inbound Flow Wizard (FLOW-003)
 * Standardized step-wizard for Material Receipt, Serialization & QC.
 * Wired to simulated /api/flows/inbound/* endpoints.
 * @foundation V34-S3-FLOW-003-PP-04
 * @updated V34-S3-FLOW-003-PP-03 (Tablet-First Layout)
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
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
  Info,
  Cloud,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LayoutList
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { 
  type InboundReceiptDraft, 
  type InboundFlowRole, 
  type InboundFlowState,
  type InboundFlowInstance,
  INBOUND_FLOW_ENDPOINTS,
} from '../index';
import { 
  InboundWizardModel, 
  createDefaultInboundWizardModel,
  resolveInboundStepFromState
} from './inboundWizardModel';
import { apiFetch } from '../../../services/apiHarness';

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
  const [model, setModel] = useState<ExtendedInboundWizardModel>(() => ({
    ...createDefaultInboundWizardModel(),
    isLoading: !!instanceId
  }));
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const isDesktop = layout === 'desktop';
  const isTablet = layout === 'tablet';
  const isMobile = layout === 'mobile';
  const isTouch = isTablet || isMobile;

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
    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: resolveInboundStepFromState(instance.state),
      receipt: instance.receipt,
      isSyncing: false,
      error: null
    }));
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
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.create, {
        method: 'POST',
        body: JSON.stringify({ receipt: model.receipt })
      });
      const result = await res.json();
      if (result.ok) syncModel(result.data);
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleSerialize = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      // Mock serial generation logic
      const prefix = model.receipt.materialCode.split('-')[0] || 'MAT';
      const serials = Array.from({ length: model.receipt.quantityReceived }).map((_, i) => 
        `${prefix}-2026-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${i}`
      );

      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.serialize, {
        method: 'POST',
        body: JSON.stringify({ instanceId: model.instanceId, serials })
      });
      const result = await res.json();
      
      if (result.ok) {
        // Auto-submit for QC in pilot for UX speed
        const submitRes = await apiFetch(INBOUND_FLOW_ENDPOINTS.submitQc, {
            method: 'POST',
            body: JSON.stringify({ instanceId: model.instanceId })
        });
        const submitResult = await submitRes.json();
        if (submitResult.ok) syncModel(submitResult.data);
        else handleApiError(submitResult.error);
      } else {
        handleApiError(result.error);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleCompleteQc = async (decision: "PASS" | "FAIL" | "SCRAP") => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.completeQc, {
        method: 'POST',
        body: JSON.stringify({ 
          instanceId: model.instanceId, 
          decision, 
          qcUser: model.role,
          remarks: "Simulated pilot inspection results" 
        })
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
      ...createDefaultInboundWizardModel(),
      isLoading: false
    });
  };

  // UI Components
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

  const ReceiptSummary = () => {
    const summaryItems = [
      { label: 'GRN Number', value: model.receipt.grnNumber, mono: true },
      { label: 'Supplier', value: model.receipt.supplierName },
      { label: 'Material', value: model.receipt.materialCode },
      { label: 'Quantity', value: `${model.receipt.quantityReceived} ${model.receipt.uom}`, highlight: true },
    ];

    if (isTouch) {
      return (
        <div className="bg-slate-50 rounded border border-slate-200 shadow-inner overflow-hidden">
          <button 
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-600 bg-slate-100/50"
          >
            <div className="flex items-center gap-2">
              <LayoutList size={14} className="text-slate-400" />
              <span>RECEIPT SUMMARY</span>
            </div>
            {isSummaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {(isSummaryExpanded || !model.receipt.grnNumber) ? (
            <div className="p-4 grid grid-cols-2 gap-4 animate-in fade-in duration-200">
              {summaryItems.map((item, idx) => (
                <div key={idx}>
                  <label className="text-[9px] uppercase font-bold text-slate-400">{item.label}</label>
                  <div className={`text-sm font-bold ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'text-brand-600' : 'text-slate-700'}`}>
                    {item.value || '--'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="font-bold text-slate-700">{model.receipt.grnNumber}</span>
              <span className="text-slate-300">|</span>
              <span>{model.receipt.quantityReceived} {model.receipt.uom}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-slate-50 p-4 rounded border border-slate-200 shadow-inner grid grid-cols-4 gap-4 text-sm">
        {summaryItems.map((item, idx) => (
          <div key={idx}>
            <label className="text-[9px] uppercase font-bold text-slate-400">{item.label}</label>
            <div className={`font-bold ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'text-brand-600' : 'text-slate-700'}`}>
              {item.value || '--'}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
              {model.step === "RECEIPT" && (
                <FlowStep 
                  stepTitle="Record Material Receipt" 
                  stepHint="Log physical arrival of material and GRN details."
                >
                  <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">GRN Number</label>
                      <input 
                        type="text" 
                        className={`w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-500 outline-none ${isTouch ? 'text-base py-3' : 'text-sm'}`}
                        placeholder="e.g. GRN-2026-0042"
                        value={model.receipt.grnNumber}
                        onChange={e => handleUpdateReceipt('grnNumber', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Supplier Name</label>
                      <input 
                        type="text" 
                        className={`w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-500 outline-none ${isTouch ? 'text-base py-3' : 'text-sm'}`}
                        placeholder="e.g. CellGlobal Dynamics"
                        value={model.receipt.supplierName}
                        onChange={e => handleUpdateReceipt('supplierName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Material Code</label>
                      <select 
                        className={`w-full border border-slate-300 rounded p-2 outline-none bg-white ${isTouch ? 'text-base py-3 h-12' : 'text-sm'}`}
                        value={model.receipt.materialCode}
                        onChange={e => handleUpdateReceipt('materialCode', e.target.value)}
                      >
                        <option value="">Select Material...</option>
                        <option value="CELL-LFP-21700">CELL-LFP-21700</option>
                        <option value="CELL-NMC-PRIS">CELL-NMC-PRIS</option>
                        <option value="BMS-LV-MASTER">BMS-LV-MASTER</option>
                        <option value="ENC-ALU-SMALL">ENC-ALU-SMALL</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Quantity Received</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          className={`flex-1 border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-500 outline-none ${isTouch ? 'text-base py-3' : 'text-sm'}`}
                          value={model.receipt.quantityReceived || ""}
                          onChange={e => handleUpdateReceipt('quantityReceived', parseInt(e.target.value) || 0)}
                        />
                        <select 
                          className={`w-28 border border-slate-300 rounded p-2 outline-none bg-white ${isTouch ? 'text-base' : 'text-sm'}`}
                          value={model.receipt.uom}
                          onChange={e => handleUpdateReceipt('uom', e.target.value)}
                        >
                          <option value="Units">Units</option>
                          <option value="Kg">Kg</option>
                          <option value="Boxes">Boxes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </FlowStep>
              )}

              {model.step === "SERIALIZATION" && (
                <FlowStep 
                  stepTitle="Component Serialization" 
                  stepHint="Generate unique identity tags for the received lot."
                >
                  <ReceiptSummary />
                  <div className={`mt-8 p-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center ${isTouch ? 'py-10' : ''}`}>
                    <Barcode size={isTouch ? 64 : 48} className="mx-auto text-slate-300 mb-4" />
                    <h4 className={`${isTouch ? 'text-lg' : 'text-sm'} font-bold text-slate-700`}>Generate {model.receipt.quantityReceived} Serials</h4>
                    <p className="text-xs text-slate-500 mt-1">Tags will be prefixed with {model.receipt.materialCode.split('-')[0] || 'MAT'}-2026</p>
                    
                    <div className={`mt-6 flex justify-center gap-6 ${isTouch ? 'scale-125 my-8' : ''}`}>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded border border-slate-200 flex items-center justify-center font-mono font-bold text-brand-600">
                          ID
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Unique</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded border border-slate-200 flex items-center justify-center font-mono font-bold text-brand-600">
                          QR
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Printable</span>
                      </div>
                    </div>
                  </div>
                  {model.role !== 'Stores' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-slate-600 text-xs mt-4 flex gap-2">
                      <Info size={14} className="text-amber-500 shrink-0" />
                      <span>Switch role to <strong>Stores</strong> to proceed with serialization.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "QC" && (
                <FlowStep 
                  stepTitle="Quality Control Inspection" 
                  stepHint="Record pass/fail counts for the serialized lot."
                >
                  <ReceiptSummary />
                  <div className={`mt-8 grid ${isTouch ? 'grid-cols-1 gap-10' : 'grid-cols-2 gap-8'}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className={`${isTouch ? 'text-sm' : 'text-xs'} font-bold text-slate-600 uppercase`}>Passed Inspection</label>
                        <span className={`${isTouch ? 'text-xl' : 'text-xs'} font-mono text-green-600 font-bold`}>{model.passCount}</span>
                      </div>
                      <input 
                        type="range" 
                        max={model.receipt.quantityReceived}
                        className="w-full h-4 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        value={model.passCount}
                        onChange={e => setModel(m => ({ ...m, passCount: parseInt(e.target.value) }))}
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0</span>
                        <span>{model.receipt.quantityReceived}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className={`${isTouch ? 'text-sm' : 'text-xs'} font-bold text-slate-600 uppercase`}>Flagged / Failed</label>
                        <span className={`${isTouch ? 'text-xl' : 'text-xs'} font-mono text-red-600 font-bold`}>{model.receipt.quantityReceived - model.passCount}</span>
                      </div>
                      <div className={`w-full ${isTouch ? 'h-4' : 'h-2'} bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200 shadow-inner`}>
                        <div 
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${((model.receipt.quantityReceived - model.passCount) / (model.receipt.quantityReceived || 1)) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Remaining units are automatically marked as failed.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded flex gap-3 mt-8">
                    <ClipboardCheck className="text-blue-600 shrink-0" size={isTouch ? 24 : 20} />
                    <div>
                       <h4 className={`${isTouch ? 'text-base' : 'text-sm'} font-bold text-blue-900`}>Standard QC Check: AIS-156</h4>
                       <p className="text-xs text-blue-700 mt-0.5">Visual damage, dimension check, and OCV sampling required.</p>
                    </div>
                  </div>
                  
                  {model.role !== 'QA' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-slate-600 text-xs mt-4 flex gap-2">
                      <Info size={14} className="text-amber-500 shrink-0" />
                      <span>Switch role to <strong>QA</strong> to record inspection results.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "DISPOSITION" && (
                 <FlowStep 
                   stepTitle="Lot Disposition" 
                   stepHint="Final decision on material release for production."
                 >
                    <div className="flex flex-col items-center text-center py-8">
                       <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${
                          model.state === 'Released' ? 'bg-green-100 text-green-600' :
                          model.state === 'Blocked' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                       }`}>
                          {model.state === 'Released' ? <ShieldCheck size={40} /> : <AlertTriangle size={40} />}
                       </div>
                       <h3 className={`${isTouch ? 'text-3xl' : 'text-2xl'} font-bold text-slate-800 uppercase tracking-tight`}>{model.state}</h3>
                       <p className="text-slate-500 max-w-sm mt-2 text-sm leading-relaxed">
                          Lot <strong>{model.receipt.grnNumber}</strong> has been processed. 
                          {model.state === 'Released' ? ' Materials are now available for Batch Sourcing.' : ' Lot is restricted from production use.'}
                       </p>
                    </div>
                    <ReceiptSummary />
                    <div className={`mt-6 grid ${isTouch ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                       <div className="p-4 bg-white border border-slate-200 rounded flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">QC Result</span>
                          <span className={`${isTouch ? 'text-base' : 'text-sm'} font-bold text-green-600`}>{model.passCount} OK</span>
                       </div>
                       <div className="p-4 bg-white border border-slate-200 rounded flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Failed</span>
                          <span className={`${isTouch ? 'text-base' : 'text-sm'} font-bold text-red-600`}>{model.receipt.quantityReceived - model.passCount} BLOCKED</span>
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
              Cancel
            </button>
          }
          right={
            <div className={`flex ${isMobile ? 'flex-col-reverse w-full' : 'items-center'} gap-3`}>
              {model.step === "RECEIPT" && (
                <>
                  <button onClick={handleReset} className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded transition-all ${isMobile ? 'w-full' : ''}`}>
                    <RotateCcw size={16} /> Reset
                  </button>
                  <button 
                    onClick={handleCreateReceipt}
                    disabled={!model.receipt.grnNumber || !model.receipt.materialCode || model.receipt.quantityReceived <= 0 || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 shadow-sm ${isMobile ? 'w-full' : ''}`}
                  >
                    Next: Serialize <ChevronRight size={16} />
                  </button>
                </>
              )}

              {model.step === "SERIALIZATION" && (
                <>
                  <button onClick={() => setModel(m => ({ ...m, step: "RECEIPT" }))} className={`px-4 py-2 text-sm font-bold text-slate-500 ${isMobile ? 'w-full' : ''}`}>Back</button>
                  <button 
                    onClick={handleSerialize}
                    disabled={model.role !== 'Stores' || model.isSyncing}
                    className={`flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 shadow-sm ${isMobile ? 'w-full' : ''}`}
                  >
                    Next: QA Inspection <ChevronRight size={16} />
                  </button>
                </>
              )}

              {model.step === "QC" && (
                <>
                  <button onClick={() => setModel(m => ({ ...m, step: "SERIALIZATION" }))} className={`px-4 py-2 text-sm font-bold text-slate-500 ${isMobile ? 'w-full' : ''}`}>Back</button>
                  <div className={`flex ${isMobile ? 'flex-col gap-2 w-full' : 'gap-2'}`}>
                    <button 
                      onClick={() => handleCompleteQc("PASS")}
                      disabled={model.role !== 'QA' || model.isSyncing}
                      className={`flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 shadow-sm ${isMobile ? 'w-full' : ''}`}
                    >
                      Release Lot <CheckCircle2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleCompleteQc("FAIL")}
                      disabled={model.role !== 'QA' || model.isSyncing}
                      className={`flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded font-bold text-sm hover:bg-amber-700 disabled:opacity-50 shadow-sm ${isMobile ? 'w-full' : ''}`}
                    >
                      Block Lot <AlertTriangle size={16} />
                    </button>
                  </div>
                </>
              )}

              {model.step === "DISPOSITION" && (
                <button onClick={handleReset} className={`flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 shadow-sm ${isMobile ? 'w-full' : ''}`}>
                  Process New Receipt
                </button>
              )}
            </div>
          }
        />
      </div>
    </FlowShell>
  );
};