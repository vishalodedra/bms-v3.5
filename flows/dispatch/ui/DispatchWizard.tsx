/**
 * Dispatch & Custody Wizard (FLOW-005)
 * Step-wizard for S11 Outbound Logistics.
 * Wired to simulated /api/flows/dispatch/* endpoints.
 * @foundation V34-S11-FLOW-005-PP-03
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  Package, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Monitor, 
  Tablet, 
  Smartphone,
  CreditCard,
  ClipboardCheck,
  Zap,
  RotateCcw,
  LogOut,
  Fingerprint,
  Info,
  Lock,
  Cloud,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
// Fix: Corrected imports - DispatchFlowInstance and DISPATCH_FLOW_ENDPOINTS come from parent index, not local model. Added DispatchDraft for handleUpdateDraft.
import { 
  type DispatchRole, 
  type DispatchFlowState, 
  type DispatchDraft,
  createDefaultDispatchWizardModel,
  resolveDispatchStepFromState
} from './dispatchWizardModel';

import {
  type DispatchFlowInstance,
  DISPATCH_FLOW_ENDPOINTS
} from '../index';

import { apiFetch } from '../../../services/apiHarness';

interface DispatchWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

interface ExtendedDispatchWizardModel extends ReturnType<typeof createDefaultDispatchWizardModel> {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
  invoiceInput?: string;
  transporterInput?: string;
  vehicleInput?: string;
  driverInput?: string;
}

export const DispatchWizard: React.FC<DispatchWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const [model, setModel] = useState<ExtendedDispatchWizardModel>(() => ({
    ...createDefaultDispatchWizardModel(),
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
      const res = await apiFetch(`${DISPATCH_FLOW_ENDPOINTS.get}?id=${id}`);
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

  const syncModel = (instance: DispatchFlowInstance) => {
    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: resolveDispatchStepFromState(instance.state),
      draft: instance.draft,
      invoiceInput: instance.draft.invoiceNumber || m.invoiceInput,
      transporterInput: instance.draft.transporter || m.transporterInput,
      vehicleInput: instance.draft.vehicleNo || m.vehicleInput,
      driverInput: instance.draft.driverName || m.driverInput,
      isSyncing: false,
      error: null
    }));
  };

  const handleApiError = (err: any) => {
    console.error("Dispatch API Error:", err);
    setModel(m => ({
      ...m,
      isSyncing: false,
      error: err?.message || "Communication failure with simulated API."
    }));
  };

  // Fix: Added missing handleUpdateDraft function used by input fields.
  const handleUpdateDraft = (field: keyof DispatchDraft, value: any) => {
    setModel(m => ({
      ...m,
      draft: { ...m.draft, [field]: value }
    }));
  };

  // Handlers
  const handleNext = async () => {
    if (model.step === "DRAFT") {
      setModel(m => ({ ...m, isSyncing: true, error: null }));
      try {
        const res = await apiFetch(DISPATCH_FLOW_ENDPOINTS.create, {
          method: 'POST',
          body: JSON.stringify({ draft: model.draft })
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } catch (e) {
        handleApiError(e);
      }
    } else if (model.step === "APPROVAL") {
      if (!model.instanceId) return;
      setModel(m => ({ ...m, isSyncing: true, error: null }));
      try {
        const res = await apiFetch(DISPATCH_FLOW_ENDPOINTS.approve, {
          method: 'POST',
          body: JSON.stringify({ 
            instanceId: model.instanceId, 
            approvedBy: model.role,
            invoiceNumber: model.invoiceInput
          })
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } catch (e) {
        handleApiError(e);
      }
    } else if (model.step === "EXECUTION") {
      if (!model.instanceId) return;
      setModel(m => ({ ...m, isSyncing: true, error: null }));
      try {
        const res = await apiFetch(DISPATCH_FLOW_ENDPOINTS.dispatch, {
          method: 'POST',
          body: JSON.stringify({ 
            instanceId: model.instanceId, 
            dispatchedBy: model.role,
            transporter: model.transporterInput,
            vehicleNo: model.vehicleInput,
            driverName: model.driverInput
          })
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } catch (e) {
        handleApiError(e);
      }
    } else if (model.step === "DELIVERY") {
      if (!model.instanceId) return;
      setModel(m => ({ ...m, isSyncing: true, error: null }));
      try {
        const res = await apiFetch(DISPATCH_FLOW_ENDPOINTS.deliver, {
          method: 'POST',
          body: JSON.stringify({ 
            instanceId: model.instanceId, 
            handoverProof: "OTP-VERIFIED-SIM",
            deliveredAt: new Date().toISOString()
          })
        });
        const result = await res.json();
        if (result.ok) syncModel(result.data);
        else handleApiError(result.error);
      } catch (e) {
        handleApiError(e);
      }
    }
  };

  const handleFinalize = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));
    try {
      const res = await apiFetch(DISPATCH_FLOW_ENDPOINTS.close, {
        method: 'POST',
        body: JSON.stringify({ instanceId: model.instanceId, closedBy: model.role })
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
      ...createDefaultDispatchWizardModel(),
      isLoading: false
    });
  };

  // UI Components
  const RoleSwitcher = (
    <div className="flex bg-slate-200 p-1 rounded-md">
      {(["SCM", "Finance", "Logistics"] as DispatchRole[]).map(r => (
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

  const SummaryPill = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-xs font-bold text-slate-700 font-mono truncate">{value}</div>
    </div>
  );

  return (
    <FlowShell 
      title="Dispatch & Custody (FLOW-005)" 
      subtitle="Outbound Logistics and Legal Transfer"
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
              {model.step === "DRAFT" && (
                <FlowStep 
                  stepTitle="Draft Consignment" 
                  stepHint="Specify customer destination and allocate serialized inventory."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                        <input 
                          type="text"
                          className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="e.g. EcoRide Fleet Solutions"
                          value={model.draft.customerName}
                          onChange={e => handleUpdateDraft('customerName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Delivery Destination</label>
                        <div className="relative">
                          <input 
                            type="text"
                            className="w-full border border-slate-300 rounded p-2.5 pl-9 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="Warehouse B, Hub North..."
                            value={model.draft.destination}
                            onChange={e => handleUpdateDraft('destination', e.target.value)}
                          />
                          <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Allocated Items</label>
                      <div className="space-y-2">
                        {model.draft.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                              <Package size={20} className="text-brand-500" />
                              <div>
                                <div className="text-xs font-bold text-slate-800 font-mono">{item.batteryId}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{item.skuCode}</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">QTY: {item.qty}</span>
                          </div>
                        ))}
                        <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-slate-400 hover:text-brand-500 hover:border-brand-300 transition-all flex items-center justify-center gap-1 mt-2">
                          <Plus size={12} /> ADD ITEM FROM INVENTORY
                        </button>
                      </div>
                    </div>
                  </div>
                </FlowStep>
              )}

              {model.step === "APPROVAL" && (
                <FlowStep 
                  stepTitle="Commercial Approval" 
                  stepHint="Verify commercial documents and invoice generation."
                >
                  <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    <SummaryPill label="Consignment" value={model.draft.consignmentId} />
                    <SummaryPill label="Customer" value={model.draft.customerName} />
                    <SummaryPill label="Total Items" value={model.draft.items.length.toString()} />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-brand-600" />
                        <span className="text-xs font-bold text-slate-700">INVOICE DETAILS</span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">AUTO-DRAFTED</span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Invoice Number (Finance Entry)</label>
                        <input 
                          type="text"
                          className="w-full border border-slate-300 rounded p-2.5 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="INV-2026-XXXX"
                          value={model.invoiceInput || ""}
                          onChange={e => setModel(m => ({ ...m, invoiceInput: e.target.value }))}
                        />
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-700 flex gap-2">
                        <Info size={14} className="shrink-0" />
                        <span>Invoicing triggers a tax-compliance check against the Digital Identity (Battery Aadhaar).</span>
                      </div>
                    </div>
                  </div>
                  
                  {model.role !== 'Finance' && (
                    <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>Switch role to <strong>Finance</strong> to authorize this dispatch.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "EXECUTION" && (
                <FlowStep 
                  stepTitle="Dispatch Execution" 
                  stepHint="Log physical loading and transporter assignment."
                >
                  <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    <SummaryPill label="Consignment" value={model.draft.consignmentId} />
                    <SummaryPill label="Customer" value={model.draft.customerName} />
                    <SummaryPill label="State" value="AUTHORIZED" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Transporter / Fleet</label>
                        <input 
                          type="text"
                          className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="e.g. BlueDart Prime"
                          value={model.transporterInput || ""}
                          onChange={e => setModel(m => ({ ...m, transporterInput: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Vehicle Number</label>
                        <input 
                          type="text"
                          className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono uppercase"
                          placeholder="XX-00-XX-0000"
                          value={model.vehicleInput || ""}
                          onChange={e => setModel(m => ({ ...m, vehicleInput: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Driver Name</label>
                        <input 
                          type="text"
                          className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="Enter Driver Name"
                          value={model.driverInput || ""}
                          onChange={e => setModel(m => ({ ...m, driverInput: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-700 h-full flex flex-col justify-center items-center gap-3">
                        <ClipboardCheck size={32} className="text-brand-400" />
                        <div className="text-center">
                          <div className="text-sm font-bold tracking-tight">GATE PASS READY</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">GP-2026-{(Math.random()*10000).toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {model.role !== 'Logistics' && (
                    <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>Switch role to <strong>Logistics</strong> to confirm physical dispatch.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "DELIVERY" && (
                <FlowStep 
                  stepTitle="Delivery Confirmation" 
                  stepHint="Record final handover proof at destination."
                >
                  <div className="flex flex-col items-center py-10">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-lg border-2 border-blue-500/20">
                      <Truck size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Consignment in Transit</h3>
                    <p className="text-slate-500 text-sm mt-2 font-mono">{model.draft.consignmentId} → {model.draft.destination}</p>

                    <div className="mt-10 w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                       <div className="p-4 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Handover Authentication</div>
                       <div className="p-6 flex flex-col items-center gap-4">
                          <div className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <Fingerprint size={24} className="text-slate-400" />
                            <div className="flex-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Verification Code / OTP</label>
                              <input 
                                type="text" 
                                className="w-full bg-transparent border-none p-0 text-lg font-mono font-bold text-slate-700 outline-none placeholder:text-slate-200 tracking-[0.5em]" 
                                placeholder="000000"
                                maxLength={6}
                                defaultValue="884210"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">Simulated Verification: Input pre-filled for pilot.</p>
                       </div>
                    </div>
                  </div>
                  {model.role !== 'Logistics' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-slate-600 text-xs mt-4 flex gap-2">
                      <Info size={14} className="text-amber-500 shrink-0" />
                      <span>Switch role to <strong>Logistics</strong> to confirm delivery handover.</span>
                    </div>
                  )}
                </FlowStep>
              )}

              {model.step === "COMPLETION" && (
                <FlowStep 
                  stepTitle="Flow Finalized" 
                  stepHint="The custody chain has been updated in the System of Record."
                >
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl animate-in zoom-in duration-500 ${
                      model.state === "Closed" ? "bg-slate-900 text-brand-400 border-4 border-brand-900" : "bg-green-100 text-green-600 border-4 border-green-50"
                    }`}>
                      {model.state === "Closed" ? <ShieldCheck size={48} /> : <CheckCircle2 size={48} />}
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                      Custody Chain {model.state === "Closed" ? "Closed" : "Transferred"}
                    </h3>
                    
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg text-left">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">New Custodian</div>
                        <div className="text-sm font-bold text-slate-800">{model.draft.customerName}</div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</div>
                        <div className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Delivered & Verified
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-500 max-w-md mt-8 text-sm leading-relaxed">
                      Consignment <strong>{model.draft.consignmentId}</strong> has reached its destination. 
                      Digital Twin telemetry now belongs to the customer instance.
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
              {model.step === "DRAFT" && (
                <button 
                  onClick={handleNext}
                  disabled={!model.draft.customerName || !model.draft.destination || model.role !== 'SCM' || model.isSyncing}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  Next: Commercial Approval <ChevronRight size={16} />
                </button>
              )}

              {model.step === "APPROVAL" && (
                <>
                  <button onClick={() => setModel(m => ({ ...m, step: "DRAFT" }))} className="px-4 py-2 text-sm font-bold text-slate-500">Back</button>
                  <button 
                    onClick={handleNext}
                    disabled={model.role !== 'Finance' || model.isSyncing}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Approve & Authorize <ShieldCheck size={16} />
                  </button>
                </>
              )}

              {model.step === "EXECUTION" && (
                <>
                  <button onClick={() => setModel(m => ({ ...m, step: "APPROVAL" }))} className="px-4 py-2 text-sm font-bold text-slate-500">Back</button>
                  <button 
                    onClick={handleNext}
                    disabled={model.role !== 'Logistics' || !model.transporterInput || !model.vehicleInput || model.isSyncing}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Confirm Dispatch <LogOut size={16} />
                  </button>
                </>
              )}

              {model.step === "DELIVERY" && (
                <button 
                  onClick={handleNext}
                  disabled={model.role !== 'Logistics' || model.isSyncing}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  Verify Handover <CheckCircle2 size={16} />
                </button>
              )}

              {model.step === "COMPLETION" && (
                <>
                   {model.state === 'Delivered' ? (
                     <button 
                        onClick={handleFinalize}
                        disabled={model.isSyncing}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 text-white rounded font-bold text-sm hover:bg-slate-900 transition-all shadow-sm"
                      >
                        Close & Archive Flow <Lock size={16} />
                      </button>
                   ) : (
                      <button 
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                      >
                        Start New Dispatch <Plus size={16} />
                      </button>
                   )}
                </>
              )}
            </div>
          }
        />
      </div>
    </FlowShell>
  );
};
