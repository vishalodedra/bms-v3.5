
/**
 * Batch Flow Wizard (FLOW-002)
 * Standardized step-wizard for Batch / Work Order lifecycle.
 * Wired to simulated /api/flows/batch/* endpoints.
 * @foundation V34-S2-FLOW-002-PP-03
 * @updated V34-S4-SPA-FP-30 (Dynamic SKU & Material Allocation)
 * @updated V34-S4-FIX-32 (Post-Submit Navigation)
 * @updated V34-S4-FIX-33 (Redirect to Listing)
 * @updated V34-S4-STAB-34 (SOP Guard Messages)
 * @updated V34-S4-TRANS-35 (Draft to Approved Transition)
 * @updated V34-S4-FIX-36 (Execution Metrics State Guard)
 * @updated V34-S4-ALLOC-42 (S1-Linked Allocation Logic)
 * @updated V34-S4-MANUAL-ALLOC-43 (Strict Manual Allocation & Approval Fix)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Box,
  Layers,
  Factory,
  Grid,
  Wand2,
  Database,
  CheckSquare,
  Square
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { useDeviceLayout } from '../../../hooks/useDeviceLayout';
import { 
  type BatchDraft, 
  type BatchFlowRole, 
  type BatchFlowInstance,
  BATCH_FLOW_ENDPOINTS,
  type CreateBatchReq,
  type ApproveBatchReq,
  type StartBatchReq,
  type CompleteBatchReq
} from '../index';
import { 
  BatchWizardModel, 
  createDefaultBatchWizardModel,
  resolveBatchStepFromState
} from './batchWizardModel';
import { apiFetch } from '../../../services/apiHarness';
import { SKU_FLOW_ENDPOINTS, type SkuFlowInstance } from '../../sku';
import { INBOUND_FLOW_ENDPOINTS, type InboundFlowInstance } from '../../inbound';

interface BatchFlowWizardProps {
  instanceId?: string | null;
  onExit: () => void;
}

interface ExtendedBatchWizardModel extends BatchWizardModel {
  instanceId?: string;
  isSyncing?: boolean;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}

// Helper types for dynamic data
interface AvailableSku {
  code: string;
  name: string;
  cellsPerModule: number; // V34-S4-ALLOC-42
}

interface AvailableMaterial {
  serial: string;
  grn: string;
  material: string;
}

export const BatchFlowWizard: React.FC<BatchFlowWizardProps> = ({ instanceId, onExit }) => {
  const layout = useDeviceLayout();
  const navigate = useNavigate();
  const [model, setModel] = useState<ExtendedBatchWizardModel>(() => ({
    ...createDefaultBatchWizardModel(),
    isLoading: !!instanceId
  }));

  // Dynamic Data State
  const [activeSkus, setActiveSkus] = useState<AvailableSku[]>([]);
  const [skuDiagnostics, setSkuDiagnostics] = useState({ total: 0, active: 0 });
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterial[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const isDesktop = layout === 'desktop';

  // Load existing instance
  useEffect(() => {
    if (instanceId && !model.instanceId) {
      loadInstance(instanceId);
    }
  }, [instanceId]);

  // Load Dependencies (SKUs, Materials)
  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingData(true);
      try {
        // Fetch SKUs
        const skuRes = await apiFetch(SKU_FLOW_ENDPOINTS.list);
        const skuJson = await skuRes.json();
        if (skuJson.ok) {
          const allSkus = skuJson.data as SkuFlowInstance[];
          // Strictly filter for 'Active' state per S4 SOP
          const active = allSkus
            .filter(s => s.state === 'Active')
            .map(s => ({ 
                code: s.draft.skuCode, 
                name: s.draft.skuName,
                cellsPerModule: s.draft.cellsPerModule || 0 // V34-S4-ALLOC-42
            }));
          
          setActiveSkus(active);
          setSkuDiagnostics({ total: allSkus.length, active: active.length });
        }

        // Fetch Inventory
        const invRes = await apiFetch(INBOUND_FLOW_ENDPOINTS.list);
        const invJson = await invRes.json();
        if (invJson.ok) {
          const flows = invJson.data as InboundFlowInstance[];
          const releasedItems: AvailableMaterial[] = [];
          
          flows.forEach(f => {
            // Only consider flows where QC is effectively done/passed
            if (['Released', 'Completed', 'Disposition'].includes(f.state)) {
               f.serializedItems.forEach(item => {
                 if (item.disposition === 'RELEASED') {
                   releasedItems.push({
                     serial: item.serialNumber,
                     grn: f.receipt.grnNumber,
                     material: f.receipt.materialCode
                   });
                 }
               });
            }
          });
          setAvailableMaterials(releasedItems);
        }
      } catch (e) {
        console.error("Failed to load batch dependencies", e);
      } finally {
        setLoadingData(false);
      }
    };

    // V34-S4-TRANS-35: Load dependencies if in DRAFT or APPROVAL to ensure validation checks can run
    if (model.step === 'DRAFT' || model.step === 'APPROVAL') {
      loadDependencies();
    }
  }, [model.step]);

  // --- Derived Allocation Logic (V34-S4-ALLOC-42) ---
  const selectedSkuInfo = activeSkus.find(s => s.code === model.draft.skuCode);
  const cellsPerModule = selectedSkuInfo?.cellsPerModule || 0;
  const plannedModules = model.draft.plannedQuantity || 0;
  const requiredCells = plannedModules * cellsPerModule;
  const currentAllocation = model.draft.allocatedInventoryIds || [];
  const allocatedCount = currentAllocation.length;
  const isAllocationComplete = allocatedCount === requiredCells && requiredCells > 0;
  const isAllocationOver = allocatedCount > requiredCells;

  const loadInstance = async (id: string) => {
    setModel(m => ({ ...m, isLoading: true, error: null, success: null }));
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

  // V34-S4-MANUAL-ALLOC-43: Manual Selection Handler
  const handleToggleAllocation = (serial: string) => {
    const current = new Set(model.draft.allocatedInventoryIds || []);
    if (current.has(serial)) {
        current.delete(serial);
    } else {
        // Prevent over-selection per SOP
        if (current.size >= requiredCells) {
            setModel(m => ({ ...m, error: `Cannot allocate more than ${requiredCells} cells.` }));
            return; 
        }
        current.add(serial);
        setModel(m => ({ ...m, error: null }));
    }
    handleUpdateDraft('allocatedInventoryIds', Array.from(current));
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

  // --- ACTIONS ---

  const handleSaveDraft = async () => {
    if (model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      if (!model.instanceId) {
        // Create new
        const payload: CreateBatchReq = { draft: model.draft };
        const res = await apiFetch(BATCH_FLOW_ENDPOINTS.create, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.ok) {
            syncModel(result.data);
            // Stay in Wizard but instance created
        } 
        else handleApiError(result.error);
      } else {
        // Update (Not fully implemented in sim, act as if saved)
        setTimeout(() => {
          setModel(m => ({ ...m, isSyncing: false, error: null, success: "Draft Saved" }));
        }, 500);
      }
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleApprove = async () => {
    if (!model.instanceId || model.isSyncing) return;
    
    // Strict S4 Logic: Cannot proceed if allocation mismatch
    if (!isAllocationComplete) {
       setModel(m => ({ ...m, error: `Allocation Mismatch. Required: ${requiredCells}, Allocated: ${allocatedCount}` }));
       return;
    }

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
          setModel(m => ({ ...m, success: "Batch Approved Successfully" }));
      }
      else handleApiError(result.error);
    } catch (e) {
      handleApiError(e);
    }
  };

  const handleStart = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: StartBatchReq = { instanceId: model.instanceId };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.start, {
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

  const handleComplete = async () => {
    if (!model.instanceId || model.isSyncing) return;
    setModel(m => ({ ...m, isSyncing: true, error: null }));

    try {
      const payload: CompleteBatchReq = { instanceId: model.instanceId };
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.complete, {
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
    setModel(createDefaultBatchWizardModel());
  };

  // UI Components
  const DeviceIndicator = (
    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mr-4 select-none opacity-50">
      {isDesktop ? <Monitor size={10} /> : <Tablet size={10} />}
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

  return (
    <FlowShell 
      title="Batch Planning (FLOW-002)" 
      subtitle="Production Scheduling & Execution"
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

        {/* Global Error/Success Banner */}
        {model.error && (
          <div className="px-6 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span className="font-medium">{model.error}</span>
          </div>
        )}
        {model.success && (
          <div className="px-6 py-2 bg-green-50 text-green-700 text-xs border-b border-green-100 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span className="font-medium">{model.success}</span>
          </div>
        )}

        <div className={`flex-1 ${(model.isSyncing || model.isLoading) ? 'opacity-50 pointer-events-none' : ''}`}>
          {model.isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-brand-500" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Batch...</p>
            </div>
          ) : (
            <>
              {model.step === "DRAFT" && (
                <FlowStep 
                  stepTitle="Draft Production Batch" 
                  stepHint="Define production target and allocate materials."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 uppercase">Batch Name</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="e.g. B-2026-01-001"
                          value={model.draft.batchName}
                          onChange={e => handleUpdateDraft('batchName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 uppercase">Product SKU (Active Only)</label>
                        <select 
                          className="w-full border border-slate-300 rounded p-2 text-sm outline-none bg-white font-mono"
                          value={model.draft.skuCode}
                          onChange={e => handleUpdateDraft('skuCode', e.target.value)}
                        >
                          <option value="">Select Active SKU...</option>
                          {activeSkus.map(sku => (
                            <option key={sku.code} value={sku.code}>{sku.code} ({sku.name})</option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                           <span>Found {skuDiagnostics.active} Active SKUs</span>
                           {skuDiagnostics.total === 0 && <span className="text-red-500">No SKUs in Registry (S1)</span>}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600 uppercase">Planned Quantity (Modules)</label>
                        <input 
                          type="number" 
                          className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="0"
                          min="1"
                          value={model.draft.plannedQuantity || ''}
                          onChange={e => handleUpdateDraft('plannedQuantity', parseInt(e.target.value) || 0)}
                        />
                        {selectedSkuInfo && (
                            <p className="text-[10px] text-blue-600 font-medium">
                                Definition: 1 Module = {selectedSkuInfo.cellsPerModule} Cells
                            </p>
                        )}
                      </div>
                    </div>

                    {/* V34-S4-MANUAL-ALLOC-43: Manual Allocation Panel */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                            <Database size={16} className="text-brand-600" />
                            <h4 className="font-bold text-sm text-slate-700">Material Allocation (S3 Inventory)</h4>
                        </div>

                        {model.draft.skuCode && model.draft.plannedQuantity > 0 ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="grid grid-cols-2 gap-4 text-xs mb-3 shrink-0">
                                    <div className="bg-white p-2 rounded border border-slate-200">
                                        <div className="text-slate-500 uppercase font-bold text-[9px]">Required Cells</div>
                                        <div className="text-lg font-mono font-bold text-slate-800">{requiredCells}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-200">
                                        <div className="text-slate-500 uppercase font-bold text-[9px]">Allocated</div>
                                        <div className={`text-lg font-mono font-bold ${isAllocationComplete ? 'text-green-600' : isAllocationOver ? 'text-red-600' : 'text-amber-600'}`}>
                                            {allocatedCount}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3 shrink-0">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            isAllocationOver ? 'bg-red-500' : isAllocationComplete ? 'bg-green-500' : 'bg-blue-500'
                                        }`} 
                                        style={{ width: `${Math.min(100, (allocatedCount / Math.max(1, requiredCells)) * 100)}%` }}
                                    ></div>
                                </div>

                                <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider shrink-0">
                                    Available Cells (Manual Selection)
                                </div>

                                {/* Manual Selection List */}
                                <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded p-1 space-y-1 custom-scrollbar">
                                    {availableMaterials.length === 0 ? (
                                        <div className="text-center p-4 text-slate-400 text-xs italic">No released cells available in S3.</div>
                                    ) : (
                                        availableMaterials.map(mat => {
                                            const isSelected = currentAllocation.includes(mat.serial);
                                            return (
                                                <div 
                                                    key={mat.serial} 
                                                    onClick={() => handleToggleAllocation(mat.serial)}
                                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${
                                                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                        {isSelected && <CheckSquare size={10} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between">
                                                            <span className="font-mono text-xs font-bold text-slate-700">{mat.serial}</span>
                                                            <span className="text-[10px] text-slate-400">{mat.grn}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 truncate">{mat.material}</div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {isAllocationOver && (
                                    <div className="mt-2 text-[10px] text-red-600 font-bold flex items-center gap-1 bg-red-50 p-2 rounded border border-red-100 shrink-0">
                                        <AlertCircle size={12} /> Over-allocated! Reduce selection.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                                <Grid size={24} className="mb-2 opacity-20" />
                                Please select SKU and Quantity to calculate material requirements.
                            </div>
                        )}
                    </div>
                  </div>
                </FlowStep>
              )}

              {model.step === "EXECUTION" && model.state === 'Approved' && (
                <FlowStep 
                  stepTitle="Batch Execution" 
                  stepHint="Authorize and release production work order."
                >
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                     <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-[10px] uppercase font-bold text-slate-500">Batch ID</div>
                           <div className="font-mono font-bold text-slate-800">{model.instanceId}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] uppercase font-bold text-slate-500">Status</div>
                           <div className="font-bold text-green-600 uppercase">{model.state}</div>
                        </div>
                     </div>
                     <div className="p-6 grid grid-cols-3 gap-6">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase">Product</label>
                           <div className="font-bold text-slate-700">{model.draft.skuCode}</div>
                           <div className="text-xs text-slate-500">{model.draft.batchName}</div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase">Volume</label>
                           <div className="font-bold text-slate-700">{model.draft.plannedQuantity} Modules</div>
                           <div className="text-xs text-slate-500">Allocated: {model.draft.allocatedInventoryIds?.length} Cells</div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase">Readiness</label>
                           <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                              <CheckCircle2 size={12} /> Materials Reserved
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                          <Play size={32} className="ml-1" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Ready to Start</h3>
                      <p className="text-slate-500 max-w-sm mt-2 text-sm">
                          Batch is approved and materials are staged.
                          Release the work order to the line to begin execution.
                      </p>
                      <div className="mt-6 flex gap-3">
                          <button 
                            onClick={handleStart}
                            disabled={model.role !== 'Supervisor'}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center gap-2 transition-all"
                          >
                            <Play size={16} fill="currentColor" /> Release Work Order
                          </button>
                      </div>
                      {model.role !== 'Supervisor' && <p className="text-[10px] text-amber-600 mt-2 font-bold">Supervisor Role Required</p>}
                  </div>
                </FlowStep>
              )}

              {model.step === "EXECUTION" && model.state === 'InProgress' && (
                <FlowStep 
                  stepTitle="Batch Execution" 
                  stepHint="Monitor production progress."
                >
                      /* InProgress View */
                      <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Target Output</div>
                                  <div className="text-2xl font-mono font-bold text-slate-800">{model.draft.plannedQuantity}</div>
                              </div>
                              <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Produced</div>
                                  <div className="text-2xl font-mono font-bold text-blue-600">0</div> 
                                  <div className="text-[10px] text-slate-400">Live telemetry pending (S5)</div>
                              </div>
                              <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Line Status</div>
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="font-bold text-green-700">Running</span>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded border border-slate-200 flex flex-col items-center justify-center text-center">
                              <Factory size={32} className="text-slate-300 mb-2" />
                              <p className="text-sm font-medium text-slate-600">Production is managed in S5 Module Assembly.</p>
                              <button 
                                onClick={() => navigate('/s5/modules')}
                                className="mt-3 text-xs bg-white border border-slate-300 px-3 py-1.5 rounded font-bold text-brand-600 hover:text-brand-800"
                              >
                                Go to Module Assembly Console
                              </button>
                          </div>
                      </div>
                </FlowStep>
              )}

              {model.step === "COMPLETION" && (
                <FlowStep 
                  stepTitle="Batch Complete" 
                  stepHint="Production run finalized."
                >
                   <div className="flex flex-col items-center py-8 text-center">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Batch Closed</h3>
                      <p className="text-slate-500 max-w-sm mt-2 text-sm">
                        Batch <strong>{model.draft.batchName}</strong> has been successfully completed. 
                        Inventory has been handed over to QC/FG.
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
              Exit
            </button>
          }
          right={
            <div className="flex items-center gap-3">
              {model.step === "DRAFT" && (
                <>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded border border-transparent transition-all"
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                  {/* Create / Update Draft */}
                  <button 
                    onClick={handleSaveDraft}
                    disabled={model.isSyncing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    Save Draft
                  </button>
                  {/* Approve / Submit */}
                  {model.role === 'Supervisor' && model.instanceId ? (
                      <button 
                        onClick={handleApprove}
                        disabled={!isAllocationComplete || model.isSyncing}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                      >
                        Approve Batch <CheckCircle2 size={16} />
                      </button>
                  ) : (
                      <div className="text-xs text-slate-400 font-medium px-2">
                          Supervisor approval required
                      </div>
                  )}
                </>
              )}

              {model.step === "EXECUTION" && model.state === 'InProgress' && (
                 <button 
                    onClick={handleComplete}
                    disabled={(model.role !== 'Supervisor' && model.role !== 'Operator') || model.isSyncing}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 text-white rounded font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Close Batch <CheckCircle2 size={16} />
                  </button>
              )}

              {model.step === "COMPLETION" && (
                 <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-brand-600 text-white rounded font-bold text-sm hover:bg-brand-700 transition-all shadow-sm"
                  >
                    Start New Batch <RotateCcw size={16} />
                  </button>
              )}
            </div>
          }
        />
      </div>
    </FlowShell>
  );
};
