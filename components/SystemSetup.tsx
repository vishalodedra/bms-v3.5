
import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, APP_VERSION, NavView } from '../types';
import { 
  ShieldAlert, 
  Factory, 
  Settings, 
  FileText, 
  Globe, 
  Users, 
  Database,
  Edit2,
  Plus,
  RefreshCw,
  Lock,
  History,
  CheckCircle2,
  ArrowRight,
  Radar,
  Cpu,
  Save,
  X,
  ChevronDown
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { Modal } from './Modal';
import { getMockS0Context, S0Context } from '../stages/s0/s0Contract';
import { getS0ActionState, S0ActionId } from '../stages/s0/s0Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

interface SystemSetupProps {
  onNavigate?: (view: NavView) => void;
}

interface ManufacturingLine {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

const INITIAL_LINES: ManufacturingLine[] = [
  { id: 'L-01', name: 'Pack Assembly Line A', type: 'Pack Assembly', status: 'ACTIVE' },
  { id: 'L-02', name: 'Module Assembly Line B', type: 'Module Assembly', status: 'MAINTENANCE' }
];

export const SystemSetup: React.FC<SystemSetupProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // Context & Data State
  const [s0Context, setS0Context] = useState<S0Context>(getMockS0Context());
  const [lines, setLines] = useState<ManufacturingLine[]>(INITIAL_LINES);
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modal State
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

  // Form State
  const [plantForm, setPlantForm] = useState({
    plantName: '',
    region: '',
    plantId: ''
  });
  const [lineForm, setLineForm] = useState({
    name: '',
    code: '',
    type: 'Pack Assembly',
    status: 'ACTIVE' as const
  });

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S0'));
  }, []);

  // Sync form with context when opening plant modal
  useEffect(() => {
    if (isPlantModalOpen) {
      setPlantForm({
        plantName: s0Context.plantName,
        region: s0Context.region,
        plantId: s0Context.plantId
      });
    }
  }, [isPlantModalOpen, s0Context]);

  // Helper to resolve action state for UI
  const getAction = (actionId: S0ActionId) => getS0ActionState(role, s0Context, actionId);

  // --- Handlers ---

  const handleEditPlant = () => {
    setIsPlantModalOpen(true);
  };

  const handleSavePlant = () => {
    if (!plantForm.plantName || !plantForm.region) return; // Simple validation

    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      
      setS0Context(prev => ({ 
        ...prev, 
        plantName: plantForm.plantName,
        region: plantForm.region,
        configLastUpdated: now 
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S0',
        actionId: 'EDIT_PLANT_DETAILS',
        actorRole: role,
        message: `Updated facility details: ${plantForm.plantName}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
      setIsPlantModalOpen(false);
    }, 600);
  };

  const handleAddLine = () => {
    setLineForm({ name: '', code: '', type: 'Pack Assembly', status: 'ACTIVE' });
    setIsLineModalOpen(true);
  };

  const handleSaveLine = () => {
    if (!lineForm.name || !lineForm.code) return;

    setIsSimulating(true);
    setTimeout(() => {
      const newLine: ManufacturingLine = {
        id: lineForm.code,
        name: lineForm.name,
        type: lineForm.type,
        status: lineForm.status
      };

      setLines(prev => [...prev, newLine]);
      setS0Context(prev => ({ ...prev, activeLines: prev.activeLines + 1 }));
      
      const evt = emitAuditEvent({
        stageId: 'S0',
        actionId: 'MANAGE_LINES',
        actorRole: role,
        message: `Provisioned new line: ${newLine.name} (${newLine.id})`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
      setIsLineModalOpen(false);
    }, 800);
  };

  const handleLineStatusChange = (lineId: string, newStatus: 'ACTIVE' | 'MAINTENANCE') => {
    // Only Admin can change status directly
    if (role !== UserRole.SYSTEM_ADMIN) return;

    const line = lines.find(l => l.id === lineId);
    if (!line || line.status === newStatus) return;

    setLines(prev => prev.map(l => l.id === lineId ? { ...l, status: newStatus } : l));
    
    // Log Audit Event
    const evt = emitAuditEvent({
      stageId: 'S0',
      actionId: 'MANUFACTURING_LINE_STATUS_CHANGED',
      actorRole: role,
      message: `Line ${lineId} status changed from ${line.status} to ${newStatus}`
    });
    setLocalEvents(prev => [evt, ...prev]);
  };

  const handleSyncRegs = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS0Context(prev => ({ ...prev, configLastUpdated: now }));

      const evt = emitAuditEvent({
        stageId: 'S0',
        actionId: 'UPDATE_REGULATIONS',
        actorRole: role,
        message: 'Synchronized regulatory definitions from cloud'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handlePublishSOP = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const nextVer = s0Context.activeSopVersion.split('-')[0] + '-RC' + (parseInt(s0Context.activeSopVersion.split('-RC')[1] || '1') + 1);
      setS0Context(prev => ({ ...prev, activeSopVersion: nextVer }));

      const evt = emitAuditEvent({
        stageId: 'S0',
        actionId: 'SYNC_SOP',
        actorRole: role,
        message: `Published SOP Revision ${nextVer}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1200);
  };

  const handleNavToS1 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S0',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S1: SKU & Blueprint from S0'
      });
      onNavigate('sku_blueprint');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const hasAccess = role === UserRole.SYSTEM_ADMIN || role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view System Setup.</p>
      </div>
    );
  }

  // Pre-calculate action states
  const editPlantState = getAction('EDIT_PLANT_DETAILS');
  const manageLinesState = getAction('MANAGE_LINES');
  const updateRegsState = getAction('UPDATE_REGULATIONS');
  const syncSopState = getAction('SYNC_SOP');

  const isReadyForNext = s0Context.status === 'READY';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* --- MODALS --- */}
      
      {/* Plant Edit Modal */}
      <Modal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        title="Edit Facility Configuration"
        footer={
          <>
            <button 
              onClick={() => setIsPlantModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button 
              onClick={handleSavePlant}
              disabled={isSimulating}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save Changes
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Facility Name</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              value={plantForm.plantName}
              onChange={e => setPlantForm(prev => ({...prev, plantName: e.target.value}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Region / Location</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              value={plantForm.region}
              onChange={e => setPlantForm(prev => ({...prev, region: e.target.value}))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plant ID (Immutable)</label>
            <input 
              type="text" 
              className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded p-2 text-sm font-mono cursor-not-allowed"
              value={plantForm.plantId}
              disabled
            />
          </div>
        </div>
      </Modal>

      {/* Add Line Modal */}
      <Modal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        title="Provision Manufacturing Line"
        footer={
          <>
            <button 
              onClick={() => setIsLineModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveLine}
              disabled={isSimulating || !lineForm.name || !lineForm.code}
              className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
              Provision Line
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Line Name</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="e.g. Line C (High Voltage)"
              value={lineForm.name}
              onChange={e => setLineForm(prev => ({...prev, name: e.target.value}))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Line Code</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="L-XX"
                value={lineForm.code}
                onChange={e => setLineForm(prev => ({...prev, code: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select 
                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                value={lineForm.type}
                onChange={e => setLineForm(prev => ({...prev, type: e.target.value}))}
              >
                <option value="Pack Assembly">Pack Assembly</option>
                <option value="Module Assembly">Module Assembly</option>
                <option value="QA">Quality Assurance</option>
                <option value="Provisioning">Provisioning</option>
              </select>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex gap-2">
            <Cpu size={16} className="shrink-0" />
            <p>New lines will be initialized in <strong>ACTIVE</strong> state. Workstations must be configured separately in S5/S7.</p>
          </div>
        </div>
      </Modal>

      {/* --- SCREEN CONTENT --- */}

      {/* Standard Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System Setup <span className="text-slate-300">/</span> Overview
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Settings className="text-brand-600" size={24} />
             System Setup (S0)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Plant configuration, regulatory context, and user registry.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold border border-amber-200">
            GOVERNANCE MODE
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Database size={10} /> Context Loaded: {s0Context.status}
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S0" />
      <PreconditionsPanel stageId="S0" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S0 Activity (Session)
           </div>
           <div className="space-y-2">
              {localEvents.slice(0, 3).map(evt => (
                 <div key={evt.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                    <span className="font-bold text-slate-700 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">{evt.actorRole}</span>
                    <span className="text-slate-600 flex-1 truncate">{evt.message}</span>
                    <CheckCircle2 size={14} className="text-green-500" />
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Next Step Guidance Panel */}
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-3 ${!onNavigate ? 'hidden' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <ArrowRight size={20} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Next Recommended Action</h3>
            <p className="text-xs text-blue-700 mt-1 max-w-lg">
              {isReadyForNext 
                ? "System configuration is valid. Proceed to Product Definition (S1) to define SKUs and blueprints." 
                : "Configuration pending. Complete S0 setup actions to unlock downstream stages."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button 
             onClick={handleNavToControlTower} 
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
           >
             <Radar size={14} /> Control Tower
           </button>
           <div className="flex-1 sm:flex-none flex flex-col items-center">
             <button 
               onClick={handleNavToS1} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Cpu size={14} /> Go to S1: Blueprint
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Preconditions Not Met</span>
             )}
           </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Plant Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Factory size={20} />
              <h2 className="font-bold">Plant / Facility Overview</h2>
            </div>
            <button 
              disabled={!editPlantState.enabled}
              onClick={handleEditPlant}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-brand-600 font-medium transition-colors"
              title={editPlantState.reason}
            >
              <Edit2 size={12} /> Edit
            </button>
          </div>
          
          <div className="space-y-3 text-sm flex-1">
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Facility Name</span>
                <span className="font-medium text-slate-800">{s0Context.plantName}</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">{s0Context.region}</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Facility ID</span>
                <span className="font-mono text-slate-600">{s0Context.plantId}</span>
             </div>
             <div className="flex justify-between pt-1">
                <span className="text-slate-500">Config Last Updated</span>
                <span className="font-mono text-xs text-slate-400">{s0Context.configLastUpdated}</span>
             </div>
          </div>
          
          {!editPlantState.enabled && (
             <DisabledHint reason={editPlantState.reason || 'Blocked'} className="mt-3 justify-end" />
          )}
        </div>

        {/* Manufacturing Lines */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Settings size={20} />
              <h2 className="font-bold">Manufacturing Lines</h2>
            </div>
            <button 
              disabled={!manageLinesState.enabled}
              onClick={handleAddLine}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed font-medium transition-colors border border-transparent disabled:border-slate-200"
              title={manageLinesState.reason}
            >
              <Plus size={12} /> Add Line
            </button>
          </div>

          <div className="space-y-3 flex-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
             {lines.map((line) => (
               <div key={line.id} className={`flex items-center justify-between p-3 rounded border ${line.status === 'MAINTENANCE' ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div>
                    <span className="font-medium text-slate-700 block text-sm">{line.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{line.id} • {line.type}</span>
                  </div>
                  {role === UserRole.SYSTEM_ADMIN ? (
                    <div className="relative group">
                      <select 
                        value={line.status}
                        onChange={(e) => handleLineStatusChange(line.id, e.target.value as any)}
                        className={`appearance-none pl-3 pr-6 py-0.5 text-xs rounded-full font-bold cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 ${
                          line.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 
                          line.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-slate-200 text-slate-500 border-slate-300'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1.5 pointer-events-none opacity-50" />
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold border ${
                      line.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 
                      line.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-200 text-slate-500 border-slate-300'
                    }`}>
                      {line.status}
                    </span>
                  )}
               </div>
             ))}
          </div>

          {!manageLinesState.enabled && (
             <DisabledHint reason={manageLinesState.reason || 'Blocked'} className="mt-3 justify-end" />
          )}
        </div>

        {/* Regulatory Context */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border flex flex-col">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Globe size={20} />
              <h2 className="font-bold">Regulatory Context</h2>
            </div>
            <button 
              disabled={!updateRegsState.enabled}
              onClick={handleSyncRegs}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 font-medium transition-colors"
              title={updateRegsState.reason}
            >
              <RefreshCw size={12} /> Sync
            </button>
          </div>

          <div className="flex flex-wrap gap-2 flex-1 content-start">
             <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">AIS-156 Amd 3</span>
             <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">EU Battery Reg 2023/1542</span>
             <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">PLI Scheme Compliant</span>
             <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-semibold">Battery Aadhaar Enabled</span>
          </div>

          {!updateRegsState.enabled && (
             <DisabledHint reason={updateRegsState.reason || 'Blocked'} className="mt-3 justify-end" />
          )}
        </div>

        {/* SOP Version & Governance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border flex flex-col">
           <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-brand-700">
              <FileText size={20} />
              <h2 className="font-bold">SOP Governance</h2>
            </div>
            <button 
              disabled={!syncSopState.enabled}
              onClick={handlePublishSOP}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 font-medium transition-colors"
              title={syncSopState.reason}
            >
              <Lock size={12} /> Publish
            </button>
          </div>

           <div className="space-y-3 text-sm flex-1">
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Active SOP Version</span>
                <span className="font-mono font-bold text-brand-600">{APP_VERSION}</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Internal Revision</span>
                <span className="font-mono text-slate-600">{s0Context.activeSopVersion}</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Last Audit</span>
                <span className="font-medium text-slate-800">2025-12-15</span>
             </div>
          </div>

          {!syncSopState.enabled && (
             <DisabledHint reason={syncSopState.reason || 'Blocked'} className="mt-3 justify-end" />
          )}
        </div>

      </div>
      
      {/* Role Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border">
          <div className="flex items-center gap-2 mb-4 text-brand-700">
            <Users size={20} />
            <h2 className="font-bold">User Role Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Access Level</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">Active Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-800 font-medium">System Admin</td>
                  <td className="px-4 py-3 text-slate-600">Full Access</td>
                  <td className="px-4 py-3 font-mono text-right">1</td>
                </tr>
                 <tr>
                  <td className="px-4 py-3 text-slate-800 font-medium">Management</td>
                  <td className="px-4 py-3 text-slate-600">Read / Audit</td>
                  <td className="px-4 py-3 font-mono text-right">2</td>
                </tr>
                 <tr>
                  <td className="px-4 py-3 text-slate-800 font-medium">Operator</td>
                  <td className="px-4 py-3 text-slate-600">Execution Only</td>
                  <td className="px-4 py-3 font-mono text-right">14</td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
