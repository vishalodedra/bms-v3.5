
/**
 * Module Assembly Wizard (FLOW-006)
 * Step-wizard for S5 Module Assembly & Serialization.
 * @foundation V34-S5-FLOW-006-PP-02
 * @updated V34-S5-SPA-FP-38
 * @updated V34-S5-SPA-FP-39 (Workstation UX)
 * @updated V34-S1-SKU-DEF-41 (Dynamic Cell Target)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  CheckCircle2, 
  ChevronRight, 
  Barcode, 
  ArrowRight, 
  RotateCcw, 
  Cloud, 
  Loader2, 
  AlertCircle, 
  Cpu, 
  Layers, 
  Zap, 
  Play, 
  Info,
  Trash2,
  Scan
} from 'lucide-react';
import { FlowShell, FlowStep, FlowFooter } from '../../../components/flow';
import { apiFetch } from '../../../services/apiHarness';
import { MODULE_FLOW_ENDPOINTS, type ModuleFlowInstance } from '../moduleFlowContract';
import { BATCH_FLOW_ENDPOINTS, type BatchFlowInstance } from '../../batch';
import { SKU_FLOW_ENDPOINTS, type SkuFlowInstance } from '../../sku';

interface ModuleWizardProps {
  instanceId?: string | null;
  preselectedBatchId?: string; // New prop for route-based creation
  onExit: () => void;
}

export const ModuleWizard: React.FC<ModuleWizardProps> = ({ instanceId, preselectedBatchId, onExit }) => {
  const [model, setModel] = useState<ModuleFlowInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Creation State
  const [activeBatches, setActiveBatches] = useState<BatchFlowInstance[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || '');
  
  // Execution State
  const [availableCells, setAvailableCells] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  
  // Workstation Inputs
  const [scanInput, setScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);
  
  // V34-S1-SKU-DEF-41: Target from S1 SKU
  const [cellCountTarget, setCellCountTarget] = useState(0); 

  // Step Calculation
  const step = !model ? 'BATCH_SELECT' : 
               model.state === 'InAssembly' && model.draft.cellSerials.length === 0 ? 'AGGREGATION' :
               model.state === 'InAssembly' && !model.draft.moduleSerial ? 'SERIALIZATION' :
               model.state === 'InAssembly' ? 'SUMMARY' : 'COMPLETION';

  // Load Active Batches on Mount (Only if not preselected)
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await apiFetch(BATCH_FLOW_ENDPOINTS.list);
        const json = await res.json();
        if (json.ok) {
          const inProgress = (json.data as BatchFlowInstance[]).filter(b => b.state === 'InProgress');
          setActiveBatches(inProgress);
        }
      } catch (e) {
        console.error("Failed to load batches", e);
      }
    };
    if (!instanceId && !preselectedBatchId) fetchBatches();
  }, [instanceId, preselectedBatchId]);

  // Handle preselected batch validation and auto-start
  useEffect(() => {
    const initPreselected = async () => {
        if (!preselectedBatchId || instanceId || model) return;
        
        setIsLoading(true);
        try {
            // Verify batch is valid and InProgress
            const res = await apiFetch(`${BATCH_FLOW_ENDPOINTS.get}?id=${preselectedBatchId}`);
            const json = await res.json();
            
            if (json.ok) {
                const batch = json.data as BatchFlowInstance;
                if (batch.state !== 'InProgress') {
                    setError(`Batch ${batch.draft.batchName} is not active (State: ${batch.state}). Cannot assemble.`);
                } else {
                    // Auto-start session for this batch
                    await startSessionForBatch(batch);
                }
            } else {
                setError("Invalid Batch ID provided.");
            }
        } catch (e) {
            setError("Failed to validate batch.");
        } finally {
            setIsLoading(false);
        }
    };
    
    initPreselected();
  }, [preselectedBatchId]);

  // Focus scan input when in aggregation step
  useEffect(() => {
    if (step === 'AGGREGATION') {
        setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Load Instance
  useEffect(() => {
    if (instanceId) {
      loadInstance(instanceId);
    }
  }, [instanceId]);

  const loadInstance = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`${MODULE_FLOW_ENDPOINTS.get}?id=${id}`);
      const json = await res.json();
      if (json.ok) {
        setModel(json.data);
        // If in aggregation step, load available cells from the batch
        if (json.data.state === 'InAssembly') {
           loadCellsForBatch(json.data.draft.batchId);
           // Restore locally selected cells from draft if continuing session
           setSelectedCells(json.data.draft.cellSerials || []);
           // Resolve target for existing instance
           resolveSkuTarget(json.data.draft.skuCode);
        }
      } else {
        setError(json.error?.message);
      }
    } catch (e) {
      setError("Failed to load module instance");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCellsForBatch = async (batchId: string) => {
    try {
        const res = await apiFetch(`${BATCH_FLOW_ENDPOINTS.get}?id=${batchId}`);
        const json = await res.json();
        if (json.ok) {
            const batch = json.data as BatchFlowInstance;
            // Mock: If batch has allocatedInventoryIds, use them. Else generate dummies.
            const cells = batch.draft.allocatedInventoryIds || [
                'CELL-LFP-21700-001', 'CELL-LFP-21700-002', 'CELL-LFP-21700-003', 'CELL-LFP-21700-004',
                'CELL-LFP-21700-005', 'CELL-LFP-21700-006', 'CELL-LFP-21700-007', 'CELL-LFP-21700-008'
            ];
            setAvailableCells(cells);
        }
    } catch (e) {
        console.error("Failed to load cells", e);
    }
  };

  const resolveSkuTarget = async (skuCode: string) => {
     try {
         const res = await apiFetch(SKU_FLOW_ENDPOINTS.list);
         const json = await res.json();
         if (json.ok) {
             const skus = json.data as SkuFlowInstance[];
             const targetSku = skus.find(s => s.draft.skuCode === skuCode && s.state === 'Active');
             if (targetSku && targetSku.draft.cellsPerModule) {
                 setCellCountTarget(targetSku.draft.cellsPerModule);
             } else {
                 console.warn("SKU definition not found or missing cellsPerModule. Defaulting to 12.");
                 setCellCountTarget(12); // Fallback
             }
         }
     } catch (e) {
         console.error("Failed to resolve SKU target", e);
     }
  };

  const startSessionForBatch = async (batch: BatchFlowInstance) => {
      try {
        const res = await apiFetch(MODULE_FLOW_ENDPOINTS.create, {
            method: 'POST',
            body: JSON.stringify({ 
                batchId: batch.instanceId,
                skuCode: batch.draft.skuCode,
                assemblyStation: "Line A - Station 1"
            })
        });
        const json = await res.json();
        if (json.ok) {
            setModel(json.data);
            loadCellsForBatch(batch.instanceId);
            resolveSkuTarget(batch.draft.skuCode);
        } else {
            setError(json.error?.message);
        }
      } catch (e) {
          setError("Failed to initialize session.");
      }
  };

  // Handlers
  const handleStartSession = async () => {
    if (!selectedBatchId) return;
    setIsLoading(true);
    try {
      const batch = activeBatches.find(b => b.instanceId === selectedBatchId);
      if (batch) {
          await startSessionForBatch(batch);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const serial = scanInput.trim();
      if (!serial) return;

      // Validation 1: Is this cell allocated to the batch?
      if (!availableCells.includes(serial)) {
          alert(`Error: Cell ${serial} is not allocated to this batch.`);
          setScanInput('');
          return;
      }

      // Validation 2: Is duplicate?
      if (selectedCells.includes(serial)) {
          alert(`Warning: Cell ${serial} already scanned.`);
          setScanInput('');
          return;
      }
      
      // Validation 3: Target met?
      if (cellCountTarget > 0 && selectedCells.length >= cellCountTarget) {
          alert("Module capacity reached. Please proceed to aggregation.");
          setScanInput('');
          return;
      }

      setSelectedCells(prev => [...prev, serial]);
      setScanInput('');
  };

  const handleRemoveCell = (serial: string) => {
      setSelectedCells(prev => prev.filter(s => s !== serial));
  };

  const handleAggregate = async () => {
    if (!model || selectedCells.length === 0) return;
    setIsLoading(true);
    try {
        const res = await apiFetch(MODULE_FLOW_ENDPOINTS.addCells, {
            method: 'POST',
            body: JSON.stringify({
                instanceId: model.instanceId,
                cellSerials: selectedCells
            })
        });
        const json = await res.json();
        if (json.ok) setModel(json.data);
        else setError(json.error?.message);
    } catch (e) {
        setError("Aggregation failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSerialize = async () => {
    if (!model) return;
    setIsLoading(true);
    try {
        const res = await apiFetch(MODULE_FLOW_ENDPOINTS.serialize, {
            method: 'POST',
            body: JSON.stringify({ instanceId: model.instanceId })
        });
        const json = await res.json();
        if (json.ok) setModel(json.data);
        else setError(json.error?.message);
    } catch (e) {
        setError("Serialization failed");
    } finally {
        setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!model) return;
    setIsLoading(true);
    try {
        const res = await apiFetch(MODULE_FLOW_ENDPOINTS.complete, {
            method: 'POST',
            body: JSON.stringify({ instanceId: model.instanceId })
        });
        const json = await res.json();
        if (json.ok) setModel(json.data);
        else setError(json.error?.message);
    } catch (e) {
        setError("Completion failed");
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to pre-fill scan for demo purposes
  const demoFillScan = () => {
      const remaining = availableCells.filter(c => !selectedCells.includes(c));
      if (remaining.length > 0) {
          setScanInput(remaining[0]);
      }
  };

  if (isLoading && !model && step !== 'BATCH_SELECT') {
      return (
        <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="animate-spin" size={32} />
        </div>
      );
  }

  return (
    <FlowShell 
      title="Module Assembly (FLOW-006)"
      subtitle="Cell Aggregation & Serialization"
      rightSlot={
          <div className="flex items-center gap-2 text-xs text-slate-500">
              <Cloud size={14} />
              <span>{model?.instanceId || 'New Session'}</span>
          </div>
      }
    >
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
        </div>
      )}

      {step === 'BATCH_SELECT' && (
        <FlowStep stepTitle="Select Active Batch" stepHint="Choose a running batch to start assembly.">
            {/* If blocked by error (e.g. invalid batch ID in URL), show only error */}
            {!error && (
                activeBatches.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                        <AlertCircle className="mx-auto mb-2 text-slate-400" size={32} />
                        <p className="font-bold">No Active Batches Found</p>
                        <p className="text-xs mt-1">Please start a batch in S4 Planning first.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {activeBatches.map(batch => (
                            <div 
                                key={batch.instanceId}
                                onClick={() => setSelectedBatchId(batch.instanceId)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedBatchId === batch.instanceId 
                                    ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' 
                                    : 'bg-white border-slate-200 hover:border-brand-200'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-800">{batch.draft.batchName}</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">{batch.state}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">{batch.draft.skuCode}</div>
                                <div className="text-xs text-slate-400 mt-2">Planned Qty: {batch.draft.plannedQuantity}</div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </FlowStep>
      )}

      {step === 'AGGREGATION' && model && (
        <FlowStep stepTitle="Assemble Module" stepHint="Scan cell serials to build module composition.">
            
            {/* Context Header */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex justify-between items-center text-sm">
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Active Batch</div>
                    <div className="font-mono font-bold text-slate-800">{model.draft.batchId}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase">Target Composition</div>
                    <div className="font-bold text-slate-800">{cellCountTarget > 0 ? cellCountTarget : '...'} Cells / Module</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Scan Input */}
                <div className="space-y-4">
                    <form onSubmit={handleScanSubmit} className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase">Scan Cell Barcode</label>
                        <div className="flex gap-2">
                            <input 
                                ref={scanInputRef}
                                type="text" 
                                className="flex-1 border-2 border-slate-300 rounded-md p-3 text-lg font-mono focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all"
                                placeholder="Scan..."
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                disabled={cellCountTarget > 0 && selectedCells.length >= cellCountTarget}
                            />
                            <button 
                                type="submit"
                                disabled={!scanInput || (cellCountTarget > 0 && selectedCells.length >= cellCountTarget)}
                                className="bg-slate-800 text-white px-4 rounded-md font-bold disabled:opacity-50"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>

                    <div className="text-xs text-slate-400">
                        <button onClick={demoFillScan} className="underline hover:text-brand-600">Demo: Autofill Next Valid ID</button>
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1 uppercase">
                            <span>Assembly Progress</span>
                            <span>{selectedCells.length} / {cellCountTarget}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${
                                    selectedCells.length >= cellCountTarget ? 'bg-green-500' : 'bg-brand-500'
                                }`} 
                                style={{ width: `${cellCountTarget > 0 ? (selectedCells.length / cellCountTarget) * 100 : 0}%` }}
                            ></div>
                        </div>
                        {cellCountTarget > 0 && selectedCells.length >= cellCountTarget && (
                            <div className="mt-2 text-center text-xs font-bold text-green-600 flex items-center justify-center gap-1 animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={14} /> Module Composition Complete
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Scanned List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-80 bg-white">
                    <div className="bg-slate-50 p-3 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase flex justify-between items-center">
                        <span className="flex items-center gap-2"><Barcode size={14} /> Scanned Cells</span>
                        <span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px]">{selectedCells.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {selectedCells.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Scan size={32} className="mb-2 opacity-50" />
                                <span className="text-xs italic">Waiting for scan...</span>
                            </div>
                        ) : (
                            selectedCells.map((serial, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 group">
                                    <span className="font-mono text-xs text-slate-700">{serial}</span>
                                    <button 
                                        onClick={() => handleRemoveCell(serial)}
                                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Undo Scan"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </FlowStep>
      )}

      {step === 'SERIALIZATION' && model && (
        <FlowStep stepTitle="Module Serialization" stepHint="Generate unique ID for this assembly.">
            <div className="flex flex-col items-center justify-center py-8 gap-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-slate-200">
                    <Barcode size={40} className="text-slate-400" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-700">Ready to Serialize</h3>
                    <p className="text-sm text-slate-500">Cells Mapped: {model.draft.cellSerials.length}</p>
                </div>
                <button 
                    onClick={handleSerialize}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <Zap size={18} /> Generate Serial Number
                </button>
            </div>
        </FlowStep>
      )}

      {step === 'SUMMARY' && model && (
        <FlowStep stepTitle="Review & Complete" stepHint="Verify details before finalizing.">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Box size={18} className="text-brand-600" />
                        {model.draft.moduleSerial}
                    </h4>
                </div>
                <div className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">SKU Code</span>
                        <span className="font-mono text-slate-800">{model.draft.skuCode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Cell Count</span>
                        <span className="font-bold text-slate-800">{model.draft.cellSerials.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Station</span>
                        <span className="text-slate-800">{model.draft.assemblyStation}</span>
                    </div>
                </div>
            </div>
        </FlowStep>
      )}

      {step === 'COMPLETION' && model && (
        <FlowStep stepTitle="Assembly Complete" stepHint="Module is ready for QA.">
            <div className="flex flex-col items-center py-8 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Module Assembled</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">
                    {model.draft.moduleSerial} has been moved to the Pending QA queue.
                </p>
                <div className="mt-6 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex items-center gap-2">
                    <Info size={14} />
                    <span>Traceability Record Created</span>
                </div>
            </div>
        </FlowStep>
      )}

      <FlowFooter 
        left={
            <button onClick={onExit} className="text-slate-500 hover:text-slate-700 font-medium text-sm">
                Cancel
            </button>
        }
        right={
            <>
                {step === 'BATCH_SELECT' && !error && (
                    <button 
                        onClick={handleStartSession} 
                        disabled={!selectedBatchId || isLoading}
                        className="bg-brand-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        Start Assembly <ArrowRight size={16} />
                    </button>
                )}
                {step === 'AGGREGATION' && (
                    <button 
                        onClick={handleAggregate} 
                        disabled={selectedCells.length < cellCountTarget || isLoading}
                        className="bg-brand-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        Confirm Assembly <ChevronRight size={16} />
                    </button>
                )}
                {step === 'SUMMARY' && (
                    <button 
                        onClick={handleComplete} 
                        disabled={isLoading}
                        className="bg-green-600 text-white px-6 py-2 rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        Submit to QA <CheckCircle2 size={16} />
                    </button>
                )}
                {step === 'COMPLETION' && (
                    <button 
                        onClick={onExit} 
                        className="bg-slate-800 text-white px-6 py-2 rounded font-bold text-sm hover:bg-slate-900 transition-colors"
                    >
                        Return to List
                    </button>
                )}
            </>
        }
      />
    </FlowShell>
  );
};
