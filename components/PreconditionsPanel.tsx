import React, { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { STAGE_PRECONDITIONS, PreconditionItem } from '../data/stagePreconditions';

interface PreconditionsPanelProps {
  stageId: string;
}

export const PreconditionsPanel: React.FC<PreconditionsPanelProps> = ({ stageId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = STAGE_PRECONDITIONS[stageId] || [];

  if (items.length === 0) return null;

  const metCount = items.filter(i => i.status === 'MET').length;
  const totalCount = items.length;
  const allMet = metCount === totalCount;

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
           <ListChecks size={16} className="text-slate-500" />
           <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operational Preconditions</span>
           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
             allMet ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
           }`}>
             {metCount}/{totalCount} MET
           </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
           <span className="text-[10px] uppercase font-medium hidden sm:inline">Checklist</span>
           {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
           {items.map((item) => (
             <div key={item.id} className="flex items-start gap-2 p-2 rounded border border-slate-100">
                <div className="mt-0.5">
                   {item.status === 'MET' && <CheckCircle2 size={14} className="text-green-500" />}
                   {item.status === 'NOT_MET' && <XCircle size={14} className="text-red-500" />}
                   {item.status === 'NA' && <MinusCircle size={14} className="text-slate-300" />}
                </div>
                <div>
                   <div className={`text-xs font-medium ${item.status === 'NOT_MET' ? 'text-red-700' : 'text-slate-700'}`}>
                      {item.label}
                   </div>
                   {item.note && <div className="text-[10px] text-slate-400">{item.note}</div>}
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};
