import React from 'react';
import { RefreshCw, Clock, ArrowRight, Wand2 } from 'lucide-react';
import { AnyFlowInstance, FlowId } from '../../types';

/**
 * FlowInstanceList
 * Standardized sidebar list for MES Pilot flows.
 * @foundation V34-MES-PP-11
 */

interface FlowInstanceListProps {
  title: string;
  flowId: FlowId;
  instances: AnyFlowInstance[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelect: (instanceId: string) => void;
  onStartNew: () => void;
  emptyMessage?: string;
}

export const FlowInstanceList: React.FC<FlowInstanceListProps> = ({
  title,
  flowId,
  instances,
  isLoading,
  onRefresh,
  onSelect,
  onStartNew,
  emptyMessage = "No active flows found."
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-brand-50/30 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Wand2 size={16} className="text-brand-600" />
            {title}
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pilot Instances</span>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-all ${isLoading ? 'animate-spin' : ''}`}
          title="Refresh List"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
        {instances.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center opacity-60">
            <Clock className="text-slate-300 mb-2" size={24} />
            <p className="text-xs text-slate-500 font-medium">{emptyMessage}</p>
            <button 
              onClick={onStartNew}
              className="text-[10px] text-brand-600 font-bold uppercase mt-2 hover:underline"
            >
              Start New Flow
            </button>
          </div>
        ) : (
          instances.map(flow => (
            <div 
              key={flow.instanceId}
              onClick={() => onSelect(flow.instanceId)}
              className="p-3 bg-white border border-slate-200 rounded-md hover:border-brand-300 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-800 text-xs font-mono">{flow.instanceId}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  ['Active', 'Approved', 'Released', 'Delivered', 'Closed'].includes(flow.state) ? 'bg-green-100 text-green-700' : 
                  ['Review', 'InProgress', 'QCPending', 'Dispatched', 'Pending'].includes(flow.state) ? 'bg-blue-100 text-blue-700' :
                  ['Rejected', 'Blocked', 'Scrapped', 'Cancelled'].includes(flow.state) ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {flow.state}
                </span>
              </div>
              
              <div className="text-[11px] font-medium text-slate-600 truncate mt-1">
                 {/* Adaptive labels based on flow ID */}
                 {flow.flowId === 'FLOW-001' && (flow as any).draft?.skuCode}
                 {flow.flowId === 'FLOW-002' && (flow as any).draft?.batchName}
                 {flow.flowId === 'FLOW-003' && (flow as any).receipt?.grnNumber}
                 {flow.flowId === 'FLOW-004' && (flow as any).draft?.packId}
                 {flow.flowId === 'FLOW-005' && (flow as any).draft?.consignmentId}
              </div>

              <div className="flex justify-between items-center mt-2">
                 <span className="text-[9px] text-slate-400 font-mono italic">
                    {new Date(flow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 <span className="text-[9px] text-brand-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    RESUME <ArrowRight size={10} />
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};