import React, { useState, useEffect } from 'react';
import { FlowInstanceList } from './flow/FlowInstanceList';
import { Wand2, X } from 'lucide-react';
import { NavView, AnyFlowInstance } from '../types';
import { apiFetch } from '../services/apiHarness';

/**
 * GenericFlowScreen
 * 
 * Reusable wrapper component for all MES Pilot Flows (S3, S9, S11, etc.).
 * Handles the "Wizard vs. List" toggle state, API fetching, and layout.
 * 
 * @foundation V34-CORE-FP-05
 */

export interface GenericFlowScreenProps {
  onNavigate?: (view: NavView) => void;
  // Configuration Props
  flowId: string; // "FLOW-001", etc.
  listEndpoint: string; // e.g. "/api/flows/inbound/list"
  listTitle: string;
  emptyMessage?: string;
  // Components
  MainComponent: React.ComponentType<{ onNavigate?: (view: NavView) => void }>;
  WizardComponent: React.ComponentType<{ instanceId?: string | null; onExit: () => void }>;
  // Button Label
  startLabel: string;
}

export const GenericFlowScreen: React.FC<GenericFlowScreenProps> = ({
  onNavigate,
  flowId,
  listEndpoint,
  listTitle,
  emptyMessage = "No active flows found.",
  MainComponent,
  WizardComponent,
  startLabel
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [apiFlows, setApiFlows] = useState<AnyFlowInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(listEndpoint);
      const result = await res.json();
      if (result.ok) setApiFlows(result.data);
    } catch (e) {
      console.error(`GenericFlowScreen (${flowId}): Failed to fetch flows`, e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFlows();
  }, [flowId, listEndpoint]);

  const handleStartNew = () => {
    setActiveInstanceId(null);
    setShowWizard(true);
  };

  const handleResume = (id: string) => {
    setActiveInstanceId(id);
    setShowWizard(true);
  };

  const handleExit = () => {
    setShowWizard(false);
    setActiveInstanceId(null);
    fetchFlows(); // Refresh list on exit
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Top Action Bar */}
      <div className="flex justify-end gap-2 shrink-0">
        <button 
          onClick={showWizard ? handleExit : handleStartNew}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold border transition-all ${
            showWizard 
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
              : 'bg-white border-brand-200 text-brand-600 hover:bg-brand-50 shadow-sm'
          }`}
        >
          {showWizard ? <X size={16} /> : <Wand2 size={16} />}
          {showWizard ? 'Exit Wizard' : startLabel}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {showWizard ? (
          <WizardComponent instanceId={activeInstanceId} onExit={handleExit} />
        ) : (
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left: Instance List */}
            <div className="col-span-3 h-full overflow-hidden">
               <FlowInstanceList 
                 title={listTitle}
                 flowId={flowId as any}
                 instances={apiFlows}
                 isLoading={isLoading}
                 onRefresh={fetchFlows}
                 onSelect={handleResume}
                 onStartNew={handleStartNew}
                 emptyMessage={emptyMessage}
               />
            </div>
            
            {/* Right: Main Detail View */}
            <div className="col-span-9 h-full overflow-hidden">
               <MainComponent onNavigate={onNavigate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};