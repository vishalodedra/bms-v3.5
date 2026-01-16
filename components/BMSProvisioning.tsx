import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Cpu, 
  Link, 
  Wifi, 
  Download, 
  CheckCircle2, 
  ScanLine, 
  FileCode,
  Settings,
  Battery,
  AlertTriangle,
  Radio,
  Database,
  Play,
  Save,
  Server,
  History,
  ArrowRight,
  Radar
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS10Context, S10Context } from '../stages/s10/s10Contract';
import { getS10ActionState, S10ActionId } from '../stages/s10/s10Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface ProvisioningPack {
  id: string;
  packId: string;
  sku: string;
  approvalDate: string;
  status: 'Pending' | 'Provisioned';
  targetProfile: string;
}

// Mock Data
const PROVISIONING_QUEUE: ProvisioningPack[] = [
  {
    id: 'prov-001',
    packId: 'PCK-2026-001-012',
    sku: 'BP-LFP-48V-2.5K',
    approvalDate: '2026-01-11 14:30',
    status: 'Pending',
    targetProfile: 'LFP-48V-STD-V2.1'
  },
  {
    id: 'prov-002',
    packId: 'PCK-2026-001-014',
    sku: 'BP-LFP-48V-2.5K',
    approvalDate: '2026-01-11 16:15',
    status: 'Pending',
    targetProfile: 'LFP-48V-STD-V2.1'
  },
  {
    id: 'prov-003',
    packId: 'PCK-2026-002-005',
    sku: 'BP-NMC-800V-75K',
    approvalDate: '2026-01-11 10:00',
    status: 'Pending',
    targetProfile: 'NMC-HV-PERF-V3.0'
  }
];

interface BMSProvisioningProps {
  onNavigate?: (view: NavView) => void;
}

export const BMSProvisioning: React.FC<BMSProvisioningProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedPack, setSelectedPack] = useState<ProvisioningPack>(PROVISIONING_QUEUE[0]);
  const [bmsSerial, setBmsSerial] = useState('');

  // S10 Context & Event State
  const [s10Context, setS10Context] = useState<S10Context>(getMockS10Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S10'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S10ActionId) => getS10ActionState(role, s10Context, actionId);

  // Action Handlers
  const handleStartSession = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS10Context(prev => ({
        ...prev,
        provisioningStatus: 'PROVISIONING',
        packsInProgressCount: prev.packsInProgressCount + 1,
        packsQueuedCount: Math.max(0, prev.packsQueuedCount - 1)
      }));
      const evt = emitAuditEvent({
        stageId: 'S10',
        actionId: 'START_SESSION',
        actorRole: role,
        message: `Provisioning session started for ${selectedPack.packId}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleFlashFirmware = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS10Context(prev => ({
        ...prev,
        provisioningStatus: 'VERIFYING'
      }));
      const evt = emitAuditEvent({
        stageId: 'S10',
        actionId: 'FLASH_FIRMWARE',
        actorRole: role,
        message: 'Firmware binary flashed successfully (v2.4.1)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleVerifyConfig = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Status remains VERIFYING until completion, just adding an audit log
      const evt = emitAuditEvent({
        stageId: 'S10',
        actionId: 'VERIFY_CONFIG',
        actorRole: role,
        message: 'Configuration parameters read-back verified'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteProvisioning = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS10Context(prev => ({
        ...prev,
        provisioningStatus: 'COMPLETED',
        packsInProgressCount: Math.max(0, prev.packsInProgressCount - 1),
        packsCompletedCount: prev.packsCompletedCount + 1,
        lastProvisionedAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S10',
        actionId: 'COMPLETE_PROVISIONING',
        actorRole: role,
        message: `Identity bound: ${bmsSerial || 'BMS-AUTO-GEN'} -> ${selectedPack.packId}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const handleNavToS11 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S10',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S11: Finished Goods from S10 Next Step panel'
      });
      onNavigate('finished_goods');
    }
  };

  // Guard States
  const startSessionState = getAction('START_SESSION');
  const flashFirmwareState = getAction('FLASH_FIRMWARE');
  const verifyConfigState = getAction('VERIFY_CONFIG');
  const completeProvisioningState = getAction('COMPLETE_PROVISIONING');

  // Next Step Readiness
  const isReadyForNext = s10Context.provisioningStatus === 'COMPLETED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.ENGINEERING || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.OPERATOR ||
    role === UserRole.MANAGEMENT;

  const isAuditor = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view BMS Provisioning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Trace & Identity <span className="text-slate-300">/</span> Provisioning
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Cpu className="text-brand-600" size={24} />
             BMS Provisioning (S10)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Firmware flashing, configuration injection, and digital identity binding (Trace).</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono border ${s10Context.firmwareRepoStatus === 'ONLINE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
               <Wifi size={14} />
               <span>REPO: {s10Context.firmwareRepoStatus}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>Queued: {s10Context.packsQueuedCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s10Context.provisioningStatus === 'IDLE' ? 'text-slate-600' : 'text-blue-600'}`}>
              {s10Context.provisioningStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S10" />
      <PreconditionsPanel stageId="S10" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S10 Activity (Session)
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
                ? "Provisioning complete. BMS identity bound to Pack ID. Proceed to Finished Goods (S11) for warehousing." 
                : "Provisioning active. Complete firmware flash and verification to finalize the unit."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button 
             onClick={handleNavToControlTower} 
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
           >
             <Radar size={14} /> Open Control Tower
           </button>
           <div className="flex-1 sm:flex-none flex flex-col items-center">
             <button 
               onClick={handleNavToS11} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Save size={14} /> Go to S11: Finished Goods
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Provisioning Incomplete</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Battery size={16} />
               Eligible Packs
             </h3>
             <span className="text-xs text-slate-400">Approved & Ready for Commissioning</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {PROVISIONING_QUEUE.map((pack) => (
              <div 
                key={pack.id} 
                onClick={() => setSelectedPack(pack)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedPack.id === pack.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{pack.packId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    pack.status === 'Provisioned' ? 'bg-green-100 text-green-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {pack.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{pack.sku}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                   <Settings size={10} />
                   <span className="font-mono">{pack.targetProfile}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Provisioning Workstation */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <Battery size={24} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPack.packId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Profile: {selectedPack.targetProfile}</p>
                </div>
              </div>
            </div>
            {/* Start Button */}
            <div className="flex flex-col items-end">
               <button 
                 onClick={handleStartSession}
                 disabled={!startSessionState.enabled || isSimulating}
                 className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 transition-colors"
                 title={startSessionState.reason}
               >
                 <Play size={16} /> Start Session
               </button>
               {!startSessionState.enabled && (
                  <DisabledHint reason={startSessionState.reason || 'Blocked'} className="mt-1" />
               )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Identity Binding */}
            <section className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <ScanLine size={16} className="text-brand-500" />
                    BMS Identity Binding
                </h3>
                <p className="text-xs text-slate-400 mb-4">Establishes permanent component lineage (Trace).</p>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">BMS Serial Number (Scan / Input)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full text-sm p-2 pl-9 border border-slate-300 rounded focus:outline-none focus:border-brand-500 font-mono"
                                placeholder="Scan BMS Barcode..."
                                value={bmsSerial}
                                onChange={(e) => setBmsSerial(e.target.value)}
                                disabled={isAuditor}
                            />
                            <Radio size={14} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Target Firmware Version</label>
                        <div className="relative">
                            <select 
                                className="w-full text-sm p-2 pl-9 border border-slate-300 rounded focus:outline-none focus:border-brand-500 appearance-none bg-white"
                                disabled={isAuditor}
                            >
                                <option>v2.4.1 (Stable) - Recommended</option>
                                <option>v2.4.0 (Previous)</option>
                                <option>v3.0.0 (Beta)</option>
                            </select>
                            <FileCode size={14} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Provisioning Actions (Guard-Controlled) */}
            <section>
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Link size={16} className="text-brand-500" />
                    Commissioning Actions
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                    {/* Flash Firmware */}
                    <div className="flex flex-col">
                      <button 
                          onClick={handleFlashFirmware}
                          disabled={!flashFirmwareState.enabled || isSimulating} 
                          className="w-full h-24 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-bold text-sm flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-sm transition-colors"
                          title={flashFirmwareState.reason}
                      >
                          <Download size={24} className={flashFirmwareState.enabled ? "text-blue-500" : "text-slate-300"} />
                          <span>Flash Firmware</span>
                          <span className="text-[10px] font-normal opacity-75">Write Binary</span>
                      </button>
                      {!flashFirmwareState.enabled && <DisabledHint reason={flashFirmwareState.reason || 'Blocked'} className="mx-auto mt-1" />}
                    </div>

                    {/* Verify Config */}
                    <div className="flex flex-col">
                      <button 
                          onClick={handleVerifyConfig}
                          disabled={!verifyConfigState.enabled || isSimulating} 
                          className="w-full h-24 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-bold text-sm flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-sm transition-colors"
                          title={verifyConfigState.reason}
                      >
                          <Server size={24} className={verifyConfigState.enabled ? "text-purple-500" : "text-slate-300"} />
                          <span>Verify Config</span>
                          <span className="text-[10px] font-normal opacity-75">Read-back Check</span>
                      </button>
                      {!verifyConfigState.enabled && <DisabledHint reason={verifyConfigState.reason || 'Blocked'} className="mx-auto mt-1" />}
                    </div>

                    {/* Complete & Release */}
                    <div className="flex flex-col">
                      <button 
                          onClick={handleCompleteProvisioning}
                          disabled={!completeProvisioningState.enabled || isSimulating} 
                          className="w-full h-24 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold text-sm flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-colors"
                          title={completeProvisioningState.reason}
                      >
                          <CheckCircle2 size={24} />
                          <span>Finalize</span>
                          <span className="text-[10px] font-normal opacity-75">Lock Identity</span>
                      </button>
                      {!completeProvisioningState.enabled && <DisabledHint reason={completeProvisioningState.reason || 'Blocked'} className="mx-auto mt-1" />}
                    </div>
                </div>
            </section>
            
            {/* 3. Visualization */}
            <section className="pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Provisioning Trace Sequence</span>
                    <span>Status: {s10Context.provisioningStatus}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
                        <div className={`h-full bg-green-500 transition-all duration-500 ${
                            s10Context.provisioningStatus === 'COMPLETED' ? 'w-full' :
                            s10Context.provisioningStatus === 'PROVISIONING' ? 'w-1/3' :
                            s10Context.provisioningStatus === 'VERIFYING' ? 'w-2/3' :
                            'w-0'
                        }`}></div>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <span className={`flex items-center gap-1 ${s10Context.provisioningStatus !== 'IDLE' ? 'text-slate-600' : ''}`}><CheckCircle2 size={10} /> Start</span>
                        <span className={`flex items-center gap-1 ${['PROVISIONING', 'VERIFYING', 'COMPLETED'].includes(s10Context.provisioningStatus) ? 'text-slate-600' : ''}`}><CheckCircle2 size={10} /> Flash</span>
                        <span className={`flex items-center gap-1 ${['VERIFYING', 'COMPLETED'].includes(s10Context.provisioningStatus) ? 'text-slate-600' : ''}`}><CheckCircle2 size={10} /> Verify</span>
                        <span className={`flex items-center gap-1 ${s10Context.provisioningStatus === 'COMPLETED' ? 'text-slate-600' : ''}`}><CheckCircle2 size={10} /> Bind</span>
                    </div>
                 </div>
            </section>

             <div className="p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <p>Hardware provisioning interface is mocked. No actual CAN-BUS commands are sent in this frontend demo.</p>
             </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};
