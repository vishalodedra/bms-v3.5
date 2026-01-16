/**
 * S9 Battery Registry Screen
 * Updated to include the Final QA Flow Wizard (FLOW-004) and Instance List.
 * @foundation V34-MES-PP-11
 */

import React, { useState, useEffect } from 'react';
import { BatteryRegistry } from '../../components/BatteryRegistry';
import { FinalQaWizard } from '../../flows/finalQa/ui/FinalQaWizard';
import { FlowInstanceList } from '../../components/flow';
import { Wand2, X } from 'lucide-react';
import { NavView, AnyFlowInstance } from '../../types';
import { apiFetch } from '../../services/apiHarness';
import { FINAL_QA_FLOW_ENDPOINTS } from '../../flows/finalQa';

interface S9FinalQaScreenProps {
  onNavigate?: (view: NavView) => void;
}

export const S9FinalQaScreen: React.FC<S9FinalQaScreenProps> = (props) => {
  const [showWizard, setShowWizard] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [apiFlows, setApiFlows] = useState<AnyFlowInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(FINAL_QA_FLOW_ENDPOINTS.list);
      const result = await res.json();
      if (result.ok) setApiFlows(result.data);
    } catch (e) {
      console.error("S9: Failed to fetch flows", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

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
    fetchFlows();
  };

  return (
    <div className="h-full flex flex-col space-y-4">
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
          {showWizard ? 'Exit Wizard' : 'Start Final QA Flow'}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {showWizard ? (
          <FinalQaWizard instanceId={activeInstanceId} onExit={handleExit} />
        ) : (
          <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-4 h-full overflow-hidden">
               <FlowInstanceList 
                 title="QA Sessions"
                 flowId="FLOW-004"
                 instances={apiFlows}
                 isLoading={isLoading}
                 onRefresh={fetchFlows}
                 onSelect={handleResume}
                 onStartNew={handleStartNew}
                 emptyMessage="No pending pack QA sessions."
               />
            </div>
            <div className="col-span-8 h-full overflow-hidden">
               <BatteryRegistry {...props} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};