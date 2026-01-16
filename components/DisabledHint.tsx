import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface DisabledHintProps {
  reason: string;
  nextActionHint?: string;
  className?: string;
}

/**
 * DisabledHint Component
 * 
 * Displays a subtle explanation for why an adjacent action is disabled.
 * Purely visual; does not control the disabled state itself.
 */
export const DisabledHint: React.FC<DisabledHintProps> = ({ 
  reason, 
  nextActionHint, 
  className = '' 
}) => {
  return (
    <div className={`mt-2 flex items-start gap-1.5 text-[10px] text-slate-400 max-w-xs ${className}`}>
      <Lock size={12} className="shrink-0 mt-0.5 text-slate-300" aria-hidden="true" />
      <div className="leading-tight">
        <span className="font-medium text-slate-500">{reason}</span>
        {nextActionHint && (
          <>
            <span className="mx-1 text-slate-300">•</span>
            <span className="italic">{nextActionHint}</span>
          </>
        )}
      </div>
    </div>
  );
};
