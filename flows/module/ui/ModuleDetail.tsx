
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, Layers, Calendar, CheckCircle2, Factory } from 'lucide-react';
import { apiFetch } from '../../../services/apiHarness';
import { MODULE_FLOW_ENDPOINTS, type ModuleFlowInstance } from '../moduleFlowContract';

export const ModuleDetail: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<ModuleFlowInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (moduleId) {
       apiFetch(`${MODULE_FLOW_ENDPOINTS.get}?id=${moduleId}`)
         .then(res => res.json())
         .then(json => {
            if (json.ok) setModule(json.data);
            else setError(json.error?.message || "Failed to load module");
         })
         .catch(() => setError("Network error"));
    }
  }, [moduleId]);

  if (error) {
      return (
          <div className="p-8 text-center">
              <div className="text-red-500 font-bold mb-2">Error</div>
              <div className="text-slate-600">{error}</div>
              <button onClick={() => navigate('..')} className="mt-4 text-brand-600 hover:underline">Return to List</button>
          </div>
      );
  }

  if (!module) return <div className="p-8 text-center text-slate-400">Loading details...</div>;

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
       <div className="mb-4">
         <button onClick={() => navigate('..')} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
            <ArrowLeft size={12} /> Back to Modules
         </button>
       </div>

       <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden flex-1">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                   <Box className="text-brand-600" />
                   {module.draft.moduleSerial || 'Unserialized Draft'}
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-mono">ID: {module.instanceId}</p>
             </div>
             <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    module.state === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                    {module.state}
                </span>
                <div className="text-xs text-slate-400 mt-2 font-mono">{new Date(module.updatedAt).toLocaleString()}</div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Context Info */}
                <section className="space-y-4">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Production Context</h3>
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between p-3 bg-slate-50 rounded border border-slate-100">
                         <span className="text-slate-500">Batch Reference</span>
                         <span className="font-mono font-medium text-slate-800">{module.draft.batchId}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded border border-slate-100">
                         <span className="text-slate-500">Product SKU</span>
                         <span className="font-mono font-medium text-slate-800">{module.draft.skuCode}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded border border-slate-100">
                         <span className="text-slate-500">Assembly Station</span>
                         <span className="font-medium text-slate-800">{module.draft.assemblyStation || 'N/A'}</span>
                      </div>
                   </div>
                </section>

                {/* Composition */}
                <section className="space-y-4">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between">
                      <span>Cell Composition</span>
                      <span>{module.draft.cellSerials.length} Cells</span>
                   </h3>
                   <div className="max-h-64 overflow-y-auto border border-slate-200 rounded bg-slate-50 p-2">
                      <div className="grid grid-cols-2 gap-2">
                         {module.draft.cellSerials.map((cell, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-slate-100 text-xs font-mono text-slate-600 flex items-center gap-2">
                               <Layers size={10} className="text-slate-400" /> {cell}
                            </div>
                         ))}
                      </div>
                   </div>
                </section>

             </div>

             {/* Audit Footer */}
             <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                   <Calendar size={14} /> Created: {new Date(module.createdAt).toLocaleString()}
                </div>
                {module.completedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                       <CheckCircle2 size={14} /> Completed: {new Date(module.completedAt).toLocaleString()}
                    </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                   <Factory size={14} /> Traceability Record Locked
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
