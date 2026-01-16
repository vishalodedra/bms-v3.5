import React from 'react';

/**
 * FlowShell
 * Common layout wrapper for MES step-wizard flows.
 * @foundation V34-FND-BP-07
 */

interface FlowShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const FlowShell: React.FC<FlowShellProps> = ({ title, subtitle, children, rightSlot }) => {
  return (
    <div className="bg-white rounded-xl border border-industrial-border shadow-sm flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
      <header className="px-6 py-4 border-b border-industrial-border bg-slate-50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {rightSlot && (
          <div className="flex items-center gap-2">
            {rightSlot}
          </div>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {children}
      </div>
    </div>
  );
};