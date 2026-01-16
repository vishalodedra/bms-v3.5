import React from 'react';
import { AlertOctagon, ArrowRight } from 'lucide-react';

interface GateNoticeProps {
  title?: string;
  reason: string;
  requiredAction: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * GateNotice Component
 * 
 * Standardized UX for "Blocked / Requires Context" states.
 * Used when a user navigates to a context-dependent view without the necessary state.
 */
export const GateNotice: React.FC<GateNoticeProps> = ({
  title = "BLOCKED",
  reason,
  requiredAction,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border-l-4 border-l-red-500 border-y border-r border-slate-200 p-8 flex flex-col items-center text-center">
        
        <div className="p-3 bg-red-50 rounded-full mb-4 border border-red-100">
          <AlertOctagon size={32} className="text-red-500" aria-hidden="true" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide mb-6">
          {title}
        </h2>

        <div className="w-full space-y-4 mb-8">
            <div className="bg-slate-50 border border-slate-100 rounded p-3 text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Reason</div>
                <p className="text-slate-700 font-medium text-sm">{reason}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded p-3 text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Required Action</div>
                <p className="text-slate-700 font-medium text-sm">{requiredAction}</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPrimary}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {primaryLabel} <ArrowRight size={16} />
          </button>
          
          {onSecondary && secondaryLabel && (
            <button
              onClick={onSecondary}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-md font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {secondaryLabel}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
