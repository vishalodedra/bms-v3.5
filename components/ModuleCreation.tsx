
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleWizard } from '../flows/module/ui/ModuleWizard';
import { ArrowLeft } from 'lucide-react';

export const ModuleCreation: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const handleExit = () => {
    navigate('/s5/modules');
  };

  return (
    <div className="h-full flex flex-col">
        <div className="mb-4 shrink-0">
            <button 
                onClick={handleExit} 
                className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
                <ArrowLeft size={12} /> Cancel & Return to List
            </button>
        </div>
        <div className="flex-1 min-h-0">
            <ModuleWizard instanceId={null} preselectedBatchId={batchId} onExit={handleExit} />
        </div>
    </div>
  );
};
