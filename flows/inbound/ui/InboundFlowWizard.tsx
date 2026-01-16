
/**
 * Inbound Flow Wizard (FLOW-003)
 * Standardized step-wizard for Material Receipt, Serialization & QC.
 * Wired to simulated /api/flows/inbound/* endpoints.
 * @foundation V34-S3-FLOW-003-PP-04
 * @updated V34-S3-GOV-FP-13 (Restored Scanning & Serialization Features)
 * @updated V34-S3-GOV-FP-14 (Added PO & Supplier Lot)
 * @updated V34-S3-GOV-FP-16 (Explicit Serial Generation)
 * @updated V34-S3-GOV-FP-17 (Visible Serial List & Scan Verification)
 * @updated V34-S3-GOV-FP-18 (Manual Scan & List Position Fix)
 * @updated V34-S3-GOV-FP-19 (Strict Method Separation & No Auto-Verify)
 * @updated V34-S3-GOV-FP-20 (Fix Post-Generation Flow)
 * @updated V34-S3-GOV-FP-21 (Fix Serial QC Disposition)
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
  LayoutList,
  ScanLine,
  Printer,
  Camera,
  Search,
  Box,
  Wand2,
  Plus
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
  resolveInboundStepFromState,
  SerialItemState
} from './inboundWizardModel';
import { apiFetch } from '../../../services/apiHarness';
import { emitAuditEvent } from '../../../utils/auditEvents';

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
  
  // Serialization State
  const [serializationMode, setSerializationMode] = useState<'GENERATE' | 'SCAN'>('GENERATE');
  const [scanInput, setScanInput] = useState('');
  
  const isDesktop = layout === 'desktop';
  const isTablet = layout === 'tablet';
  const isMobile = layout === 'mobile';
  const isTouch = isTablet || isMobile;

  const isSerialized = model.state === 'Serialized' || model.state === 'QCPending' || model.state === 'Released' || model.state === 'Blocked';

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
      isVerified: true // Committed items are verified by definition in this flow
    })) || [];

    setModel(m => ({
      ...m,
      instanceId: instance.instanceId,
      state: instance.state,
      step: resolveInboundStepFromState(instance.state),
      receipt: instance.receipt,
      serializedItems: mappedItems.length > 0 ? mappedItems : m.serializedItems,
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
      if (result.ok) {
        syncModel(result.data);
        emitAuditEvent({
          stageId: 'S3',
          actionId: 'INBOUND_RECEIPT_CREATED',
          actorRole: model.role,
          message: `Receipt created for ${model.receipt.grnNumber} against PO ${model.receipt.poNumber}`
        });
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleModeToggle = (mode: 'GENERATE' | 'SCAN') => {
      // Clear local uncommitted items when switching modes if not yet serialized
      if (!isSerialized) {
          setModel(m => ({ ...m, serializedItems: [] }));
          setSerializationMode(mode);
          setScanInput('');
      }
  };

  // Only used in SCAN mode now
  const handleScanVerification = (input: string) => {
    if (!input.trim()) return;
    if (serializationMode !== 'SCAN') return;

    // Duplicate Check
    const isDuplicate = model.serializedItems.some(i => i.serial === input);
    if (isDuplicate) {
        setModel(m => ({ ...m, error: `Serial ${input} already scanned.` }));
        setScanInput('');
        return;
    }

    // Limit Check
    if (model.serializedItems.length >= model.receipt.quantityReceived) {
        setModel(m => ({ ...m, error: `Quantity limit reached (${model.receipt.quantityReceived}). Cannot scan more.` }));
        setScanInput('');
        return;
    }
    
    // Add Item
    const newItem: SerialItemState = { serial: input, isVerified: true };
    setModel(m => ({ 
        ...m, 
        serializedItems: [...m.serializedItems, newItem], 
        error: null 
    }));
    
    emitAuditEvent({
        stageId: 'S3',
        actionId: 'SCAN_CAPTURED',
        actorRole: model.role,
        message: `Captured manufacturer serial: ${input}`
    });
    
    setScanInput('');
  };

  const handleCommitSerialization = async () => {
    if (!model.instanceId || model.isSyncing) return;
    
    // Internal Generation Mode: Generate list if empty
    let serialsToSend: string[] = [];

    if (serializationMode === 'GENERATE') {
        if (model.serializedItems.length === 0) {
             // Deterministic Generation Logic
            const prefix = model.receipt.materialCode.split('-')[0] || 'MAT';
            const grnSuffix = model.receipt.grnNumber.split('-').pop() || '000';
            const year = new Date().getFullYear();
            
            serialsToSend = Array.from({ length: model.receipt.quantityReceived }).map((_, i) => 
                `${prefix}-${year}-${grnSuffix}-${String(i + 1).padStart(3, '0')}`
            );
        } else {
            // Already generated but retrying commit? Should not happen often if UI guards work
            serialsToSend = model.serializedItems.map(i => i.serial);
        }
    } else {
        // SCAN Mode: Use scanned items
        // Validation: Must match quantity
        if (model.serializedItems.length !== model.receipt.quantityReceived) {
            setModel(m => ({ ...m, error: `Scan count mismatch. Scanned: ${model.serializedItems.length}, Expected: ${model.receipt.quantityReceived}` }));
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
        emitAuditEvent({
            stageId: 'S3',
            actionId: serializationMode === 'GENERATE' ? 'SERIAL_INTERNAL_GENERATED' : 'SERIAL_VERIFIED',
            actorRole: model.role,
            message: `Committed ${serialsToSend.length} serials via ${serializationMode} mode`
        });
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
        emitAuditEvent({
          stageId: 'S3',
          actionId: 'INBOUND_QC_STARTED',
          actorRole: model.role,
          message: `Batch ${model.receipt.grnNumber} moved to QC Pending state`
        });
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleCaptureEvidence = () => {
      emitAuditEvent({
          stageId: 'S3',
          actionId: 'INBOUND_QC_STARTED',
          actorRole: model.role,
          message: 'QC Evidence Captured (Mock)'
      });
      alert("Simulated: Evidence (Photo/Data) Captured");
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
          remarks: "Simulated pilot inspection results",
          quantities: {
            pass: model.passCount,
            fail: model.receipt.quantityReceived - model.passCount
          }
        })
      });
      const result = await res.json();
      if (result.ok) {
          syncModel(result.data);
          const evtMap = {
              'PASS': 'INBOUND_QC_PASSED',
              'FAIL': 'INBOUND_QC_FAILED',
              'SCRAP': 'INVENTORY_SCRAPPED'
          };
          emitAuditEvent({
            stageId: 'S3',
            actionId: evtMap[decision] || 'INBOUND_QC_FAILED',
            actorRole: model.role,
            message: `QC Decision: ${decision}`
          });
      }
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
    setScanInput('');
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
      { label: 'PO Reference', value: model.receipt.poNumber || 'N/A', mono: true },
      { label: 'GRN Number', value: model.receipt.grnNumber, mono: true },
      { label: 'Supplier', value: model.receipt.supplierName },
      { label: 'Supplier Lot', value: model.receipt.supplierLotNumber || 'N/A', mono: true },
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
      <div className="bg-slate-50 p-4 rounded border border-slate-200 shadow-inner grid grid-cols-3 gap-4 text-sm">
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
                  stepHint="Log physical arrival of material against a valid Purchase Order."
                >
                  <div className={`grid ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    
                    {/* PO Selection / Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Purchase Order (PO)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className={`w-full border border-slate-300 rounded p-2 pl-8 focus:ring-2 focus:ring-brand-500 outline-none ${isTouch ? 'text-base py-3' : 'text-sm'}`}
                          placeholder="PO-2026-XXXX"
                          value={model.receipt.poNumber}
                          onChange={e => handleUpdateReceipt('poNumber', e.target.value)}
                        />
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

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

                    {/* Supplier Lot Tracking */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Supplier Lot / Batch</label>
                      <input 
                        type="text" 
                        className={`w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-brand-500 outline-none ${isTouch ? 'text-base py-3' : 'text-sm'}`}
                        placeholder="e.g. LOT-X992-B2"
                        value={model.receipt.supplierLotNumber || ''}
                        onChange={e => handleUpdateReceipt('supplierLotNumber', e.target.value)}
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
                  stepHint="Generate or Verify unique identity tags for the received lot."
                >
                  <ReceiptSummary />
                  
                  {/* Explicit Mode Toggle - ONLY if not yet serialized */}
                  <div className="flex justify-center my-6">
                     <div className={`bg-slate-100 p-1 rounded-lg flex shadow-inner ${isSerialized ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button
                           onClick={() => handleModeToggle('GENERATE')}
                           className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${serializationMode === 'GENERATE' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           Internal Generation
                        </button>
                        <button
                           onClick={() => handleModeToggle('SCAN')}
                           className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${serializationMode === 'SCAN' ? 'bg-white shadow text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           Scan Verification
                        </button>
                     </div>
                  </div>

                  {/* Method 1: Internal Generation */}
                  {serializationMode === 'GENERATE' && (
                      <div className={`p-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center ${isTouch ? 'py-10' : ''} ${isSerialized ? 'bg-green-50 border-green-200' : ''}`}>
                        
                        <div className="flex flex-col items-center gap-4">
                            <Barcode size={isTouch ? 64 : 48} className={`mx-auto ${isSerialized ? 'text-green-500' : 'text-slate-300'}`} />
                            
                            {isSerialized ? (
                                <div>
                                    <h4 className="text-lg font-bold text-green-700">Serialization Completed</h4>
                                    <p className="text-xs text-green-600 mt-1">{model.serializedItems.length} IDs generated and verified.</p>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-green-800 bg-green-100 px-3 py-1.5 rounded-full w-fit mx-auto">
                                        <CheckCircle2 size={14} /> Ready for QC Inspection
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h4 className={`${isTouch ? 'text-lg' : 'text-sm'} font-bold text-slate-700`}>Generate {model.receipt.quantityReceived} Serials</h4>
                                    <p className="text-xs text-slate-500 mt-1">Tags will be prefixed with {model.receipt.materialCode.split('-')[0] || 'MAT'}-2026</p>
                                    
                                    <div className={`mt-6 flex justify-center gap-6 ${isTouch ? 'scale-125 my-8' : ''}`}>
                                        <button 
                                            onClick={handleCommitSerialization}
                                            disabled={model.isSyncing}
                                            className="px-6 py-3 bg-brand-600 text-white rounded-md text-sm font-bold shadow-md hover:bg-brand-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Wand2 size={16} /> Generate Serials
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                      </div>
                  )}

                  {/* Method 2: Scan Verification */}
                  {serializationMode === 'SCAN' && (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                         <div className="flex flex-col items-center gap-4">
                            <h4 className="text-sm font-bold text-slate-700">Scan Manufacturer Serials</h4>
                            
                            {!isSerialized && (
                                <div className="w-full max-w-md relative">
                                   <input 
                                      type="text" 
                                      placeholder="Focus here to scan..." 
                                      className="w-full border border-slate-300 rounded p-3 pl-10 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                                      value={scanInput}
                                      onChange={(e) => setScanInput(e.target.value)}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleScanVerification(scanInput);
                                      }}
                                      autoFocus
                                   />
                                   <ScanLine size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4 w-full max-w-md">
                                <div className="flex-1 bg-white p-3 rounded border border-slate-200 text-center">
                                   <div className="text-xs text-slate-500 uppercase font-bold">Scanned</div>
                                   <div className="text-xl font-mono font-bold text-slate-800">{model.serializedItems.length}</div>
                                </div>
                                <div className="flex-1 bg-white p-3 rounded border border-slate-200 text-center">
                                   <div className="text-xs text-slate-500 uppercase font-bold">Target</div>
                                   <div className="text-xl font-mono font-bold text-slate-400">/ {model.receipt.quantityReceived}</div>
                                </div>
                            </div>

                            {!isSerialized && (
                                <button 
                                    onClick={() => handleScanVerification(scanInput || `MFR-${Date.now().toString().slice(-6)}`)}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                    Simulate Hardware Trigger
                                </button>
                            )}
                            
                            {!isSerialized && model.serializedItems.length >= model.receipt.quantityReceived && (
                                <button 
                                    onClick={handleCommitSerialization}
                                    className="w-full max-w-md mt-4 px-6 py-3 bg-green-600 text-white rounded-md text-sm font-bold shadow-md hover:bg-green-700 transition-all"
                                >
                                    Complete Verification
                                </button>
                            )}

                            {isSerialized && (
                                <div className="mt-2 text-green-600 font-bold text-sm flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Verification Complete
                                </div>
                            )}
                         </div>
                      </div>
                  )}

                  {/* Serial Items List - Display for both modes if items exist */}
                  {model.serializedItems.length > 0 && (
                      <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase">Serial Registry ({model.serializedItems.length})</span>
                              <span className="text-[10px] text-slate-400">
                                Verified: {model.serializedItems.filter(i => i.isVerified).length}
                              </span>
                          </div>
                          <div className="max-h-60 overflow-y-auto bg-white p-0">
                              <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                      <tr>
                                          <th className="px-4 py-2 font-medium">Serial Number</th>
                                          <th className="px-4 py-2 font-medium text-right">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {model.serializedItems.map((item, idx) => (
                                          <tr key={idx} className={item.isVerified ? 'bg-green-50/30' : ''}>
                                              <td className="px-4 py-2 font-mono text-slate-700">{item.serial}</td>
                                              <td className="px-4 py-2 text-right">
                                                  {item.isVerified ? (
                                                      <span className="text-green-600 font-bold flex items-center justify-end gap-1">
                                                          <CheckCircle2 size={10} /> {serializationMode === 'GENERATE' ? 'Generated' : 'Verified'}
                                                      </span>
                                                  ) : (
                                                      <span className="text-amber-500 font-medium">Pending Scan</span>
                                                  )}
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

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

                  <div className="flex justify-between items-center mt-8">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded flex gap-3 flex-1 mr-4">
                        <ClipboardCheck className="text-blue-600 shrink-0" size={isTouch ? 24 : 20} />
                        <div>
                           <h4 className={`${isTouch ? 'text-base' : 'text-sm'} font-bold text-blue-900`}>Standard QC Check: AIS-156</h4>
                           <p className="text-xs text-blue-700 mt-0.5">Visual damage, dimension check, and OCV sampling required.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleCaptureEvidence}
                        className="flex flex-col items-center text-slate-400 hover:text-brand-600 transition-colors"
                        title="Capture Evidence"
                      >
                          <div className="p-2 border rounded bg-white hover:border-brand-300"><Camera size={20} /></div>
                          <span className="text-[9px] font-bold mt-1 uppercase">Evidence</span>
                      </button>
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
                    onClick={handleProceedToQc}
                    disabled={model.role !== 'Stores' || !isSerialized || model.isSyncing}
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
