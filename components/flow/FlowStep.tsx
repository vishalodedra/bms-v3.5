import React from 'react';

/**
 * FlowStep
 * A standardized shell for a single step within an MES flow.
 * @foundation V34-FND-BP-07
 */

interface FlowStepProps {
  stepTitle: string;
  stepHint?: string;
  children: React.ReactNode;
}

export const FlowStep: React.FC<FlowStepProps> = ({ stepTitle, stepHint, children }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          {stepTitle}
        </h3>
        {stepHint && (
          <p className="text-xs text-slate-500 mt-1 italic">
            {stepHint}
          </p>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};