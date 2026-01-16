import React from 'react';

/**
 * FlowFooter
 * Standard action area for MES flow navigation and submission.
 * @foundation V34-FND-BP-07
 */

interface FlowFooterProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const FlowFooter: React.FC<FlowFooterProps> = ({ left, right }) => {
  return (
    <footer className="px-6 py-4 bg-slate-50 border-t border-industrial-border flex justify-between items-center shrink-0">
      <div className="flex items-center gap-3">
        {left}
      </div>
      <div className="flex items-center gap-3">
        {right}
      </div>
    </footer>
  );
};