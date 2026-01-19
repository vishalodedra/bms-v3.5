
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, 
  RefreshCw, 
  Layers, 
  Search, 
  ArrowRight, 
  Eye, 
  AlertCircle,
  Play
} from 'lucide-react';
import { apiFetch } from '../../../services/apiHarness';
import { MODULE_FLOW_ENDPOINTS, type ModuleFlowInstance } from '../moduleFlowContract';
import { BATCH_FLOW_ENDPOINTS, type BatchFlowInstance } from '../../batch';
import { Modal } from '../../../components/Modal';

export const ModuleListing: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<ModuleFlowInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Batch Selection for New Assembly
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBatches, setActiveBatches] = useState<BatchFlowInstance[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(MODULE_FLOW_ENDPOINTS.list);
      const result = await res.json();
      if (result.ok) setFlows(result.data);
    } catch (e) {
      console.error("S5: Failed to fetch flows", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleStartAssembly = async () => {
    setIsModalOpen(true);
    setIsLoadingBatches(true);
    try {
      const res = await apiFetch(BATCH_FLOW_ENDPOINTS.list);
      const json = await res.json();
      if (json.ok) {
        // STRICT SOP: Only 'InProgress' batches allowed. No Draft, No Approved, No Completed.
        const inProgress = (json.data as BatchFlowInstance[]).filter(b => b.state === 'InProgress');
        setActiveBatches(inProgress);
      }
    } catch (e) {
      console.error("Failed to load batches", e);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleSelectBatch = (batchId: string) => {
    setIsModalOpen(false);
    navigate(`/s5/batches/${batchId}/modules/assemble`);
  };

  const renderStatusBadge = (state: string) => {
    const styles: Record<string, string> = {
      'InAssembly': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'PendingQA': 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[state] || 'bg-slate-100'}`}>
        {state}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Production <span className="text-slate-300">/</span> Module Line
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             Module Assembly Console (S5)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Cell Aggregation, Module Assembly & Serialization.</p>
        </div>
        <button 
          onClick={handleStartAssembly}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-bold hover:bg-brand-700 shadow-sm transition-colors"
        >
          <Wand2 size={16} /> Start Assembly
        </button>
      </div>

      {/* Main Listing */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                  <Layers size={16} className="text-slate-700" />
                  <h3 className="font-semibold text-slate-700">Production Registry</h3>
                  <button 
                    onClick={fetchFlows} 
                    className={`ml-2 p-1 rounded hover:bg-slate-200 text-slate-400 transition-all ${isLoading ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw size={12} />
                  </button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search Modules..." 
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none w-64"
                />
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Module Serial</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Batch Code</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Created</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {flows.length === 0 && !isLoading && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                           <div className="flex flex-col items-center gap-2">
                              <Layers size={32} className="text-slate-300" />
                              <p>No modules assembled yet.</p>
                           </div>
                        </td>
                     </tr>
                  )}
                  {flows.map((flow) => (
                      <tr key={flow.instanceId} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 font-mono font-bold text-slate-700">
                             {flow.draft.moduleSerial || <span className="text-slate-400 italic">Pending...</span>}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-600">{flow.draft.batchId}</td>
                          <td className="px-6 py-3 text-slate-600">{flow.draft.skuCode}</td>
                          <td className="px-6 py-3 text-center">
                              {renderStatusBadge(flow.state)}
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-xs text-slate-500">
                             {new Date(flow.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                              <button 
                                  onClick={() => navigate(flow.instanceId)}
                                  className="text-brand-600 hover:text-brand-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-brand-50 transition-colors flex items-center gap-1 ml-auto"
                              >
                                  <Eye size={14} /> View
                              </button>
                          </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Batch Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Active Batch"
      >
         <div className="space-y-4">
            <p className="text-sm text-slate-500">Choose a running batch to start module assembly.</p>
            
            {isLoadingBatches ? (
               <div className="py-8 flex justify-center"><RefreshCw className="animate-spin text-brand-500" /></div>
            ) : activeBatches.length === 0 ? (
               <div className="p-4 bg-amber-50 border border-amber-200 rounded text-center text-amber-800 text-sm">
                  <AlertCircle className="mx-auto mb-2 text-amber-600" size={24} />
                  <p className="font-bold mb-1">No Active Batches Running</p>
                  <p className="mb-2">Module assembly (S5) can only be performed while a batch is <strong>In Progress</strong>.</p>
                  <p className="text-xs">Please start a batch in S4 Planning before proceeding.</p>
               </div>
            ) : (
               <div className="grid gap-2">
                  {activeBatches.map(batch => (
                     <button
                        key={batch.instanceId}
                        onClick={() => handleSelectBatch(batch.instanceId)}
                        className="p-3 text-left border border-slate-200 rounded hover:border-brand-500 hover:bg-brand-50 transition-all group"
                     >
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-slate-800 flex items-center gap-2">
                              <Play size={14} className="text-green-600" /> {batch.draft.batchName}
                           </span>
                           <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500" />
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1 pl-6">{batch.draft.skuCode}</div>
                     </button>
                  ))}
               </div>
            )}
         </div>
      </Modal>

    </div>
  );
};
