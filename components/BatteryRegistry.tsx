import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Database, 
  Search, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Globe, 
  FileBadge, 
  GitCommit, 
  Cpu, 
  Box, 
  Battery,
  History,
  UserCheck,
  Scale,
  Recycle,
  Factory,
  Truck,
  Users,
  ShieldCheck,
  ClipboardCheck,
  Play,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  Radar
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS9Context, S9Context } from '../stages/s9/s9Contract';
import { getS9ActionState, S9ActionId } from '../stages/s9/s9Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface RegistryPack {
  id: string;
  packId: string;
  skuCode: string;
  batchId: string;
  mfgDate: string;
  status: 'Approved' | 'Dispatched' | 'Hold';
  compliance: {
    batteryAadhaar: boolean;
    euPassport: boolean;
  };
  details: {
    bmsSerial: string;
    firmware: string;
    energy: string;
    weight: string;
    warranty: string;
  };
  custodian: {
    type: 'Manufacturer' | 'Logistics' | 'Customer' | 'Recycler';
    name: string;
    since: string;
    responsibilities: string[];
    basis: 'Manufacturing' | 'Dispatch' | 'Service' | 'Recycling';
  };
  material: {
    chemistry: string;
    mass: string;
    eprEligible: boolean;
    recyclingStatus: string;
  };
}

// Mock Data
const REGISTRY_DATA: RegistryPack[] = [
  {
    id: 'reg-001',
    packId: 'PCK-2026-001-010',
    skuCode: 'BP-LFP-48V-2.5K',
    batchId: 'B-2026-01-001',
    mfgDate: '2026-01-11',
    status: 'Approved',
    compliance: { batteryAadhaar: true, euPassport: false },
    details: {
      bmsSerial: 'BMS-O-99281',
      firmware: 'v2.4.1-stable',
      energy: '2.56 kWh',
      weight: '18.4 kg',
      warranty: '3 Years / 1500 Cycles'
    },
    custodian: {
        type: 'Manufacturer',
        name: 'Gigafactory 1 - Warehouse',
        since: '2026-01-11 10:00',
        responsibilities: ['Warranty', 'Safety'],
        basis: 'Manufacturing'
    },
    material: {
        chemistry: 'LFP (Lithium Iron Phosphate)',
        mass: '18.4 kg',
        eprEligible: true,
        recyclingStatus: 'Virgin Material'
    }
  },
  {
    id: 'reg-002',
    packId: 'PCK-2026-001-008',
    skuCode: 'BP-LFP-48V-2.5K',
    batchId: 'B-2026-01-001',
    mfgDate: '2026-01-10',
    status: 'Dispatched',
    compliance: { batteryAadhaar: true, euPassport: false },
    details: {
      bmsSerial: 'BMS-O-99155',
      firmware: 'v2.4.0-stable',
      energy: '2.56 kWh',
      weight: '18.5 kg',
      warranty: '3 Years / 1500 Cycles'
    },
    custodian: {
        type: 'Logistics',
        name: 'BlueDart Express',
        since: '2026-01-11 14:30',
        responsibilities: ['Transport Safety'],
        basis: 'Dispatch'
    },
    material: {
        chemistry: 'LFP (Lithium Iron Phosphate)',
        mass: '18.5 kg',
        eprEligible: true,
        recyclingStatus: 'Virgin Material'
    }
  },
  {
    id: 'reg-003',
    packId: 'PCK-2026-002-001',
    skuCode: 'BP-NMC-800V-75K',
    batchId: 'B-2026-01-002',
    mfgDate: '2026-01-11',
    status: 'Hold',
    compliance: { batteryAadhaar: true, euPassport: true },
    details: {
      bmsSerial: 'BMS-HV-2201',
      firmware: 'v3.0.0-beta',
      energy: '75.0 kWh',
      weight: '420 kg',
      warranty: '8 Years / 3000 Cycles'
    },
    custodian: {
        type: 'Manufacturer',
        name: 'Gigafactory 1 - QC Hold Area',
        since: '2026-01-11 09:15',
        responsibilities: ['Containment', 'Safety'],
        basis: 'Manufacturing'
    },
    material: {
        chemistry: 'NMC (Nickel Manganese Cobalt)',
        mass: '420 kg',
        eprEligible: true,
        recyclingStatus: 'Virgin Material'
    }
  }
];

interface BatteryRegistryProps {
  onNavigate?: (view: NavView) => void;
}

export const BatteryRegistry: React.FC<BatteryRegistryProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedPack, setSelectedPack] = useState<RegistryPack>(REGISTRY_DATA[0]);

  // S9 Context State
  const [s9Context, setS9Context] = useState<S9Context>(getMockS9Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S9'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S9ActionId) => getS9ActionState(role, s9Context, actionId);

  // Action Handlers
  const handleStartQa = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS9Context(prev => ({
        ...prev,
        finalQaStatus: 'CHECKING',
        packsUnderFinalQaCount: prev.packsUnderFinalQaCount + 1,
        packsQueuedForFinalQaCount: Math.max(0, prev.packsQueuedForFinalQaCount - 1)
      }));
      const evt = emitAuditEvent({
        stageId: 'S9',
        actionId: 'START_FINAL_QA',
        actorRole: role,
        message: 'Final QA session started for Pack'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteChecks = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Just emit event, keep status CHECKING to allow Approve/Reject decision
      const evt = emitAuditEvent({
        stageId: 'S9',
        actionId: 'COMPLETE_FINAL_QA',
        actorRole: role,
        message: 'Final QA inspection checklist completed'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleApprove = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS9Context(prev => ({
        ...prev,
        finalQaStatus: 'APPROVED',
        packsFinalApprovedCount: prev.packsFinalApprovedCount + 1,
        packsUnderFinalQaCount: Math.max(0, prev.packsUnderFinalQaCount - 1),
        lastFinalQaAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S9',
        actionId: 'MARK_FINAL_APPROVE',
        actorRole: role,
        message: 'Pack approved in Final QA. Digital Twin verified.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleReject = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS9Context(prev => ({
        ...prev,
        finalQaStatus: 'REJECTED',
        packsFinalRejectedCount: prev.packsFinalRejectedCount + 1,
        packsUnderFinalQaCount: Math.max(0, prev.packsUnderFinalQaCount - 1),
        lastFinalQaAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S9',
        actionId: 'MARK_FINAL_REJECT',
        actorRole: role,
        message: 'Pack rejected in Final QA.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleRelease = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Per instructions, keep status as APPROVED but emit event.
      // In a real app, this might navigate or reset.
      const evt = emitAuditEvent({
        stageId: 'S9',
        actionId: 'RELEASE_TO_PACKING',
        actorRole: role,
        message: 'Pack released to Packing (S12) queue'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleNavToS10 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S9',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S10 from S9 Next Step panel'
      });
      onNavigate('bms_provisioning');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.MANAGEMENT || 
    role === UserRole.ENGINEERING ||
    role === UserRole.QA_ENGINEER;

  const isAuditor = role === UserRole.MANAGEMENT;

  // Guard States
  const startQaState = getAction('START_FINAL_QA');
  const completeQaState = getAction('COMPLETE_FINAL_QA'); 
  const approveState = getAction('MARK_FINAL_APPROVE');
  const rejectState = getAction('MARK_FINAL_REJECT');
  const releaseState = getAction('RELEASE_TO_PACKING');

  const isReadyForNext = s9Context.finalQaStatus === 'APPROVED';

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view the Battery Registry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Auditor Banner */}
      {isAuditor && (
        <div className="bg-slate-100 border-l-4 border-slate-500 text-slate-700 p-3 text-sm font-bold flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>AUDITOR / REGULATOR – READ-ONLY VIEW</span>
        </div>
      )}

      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Trace & Identity <span className="text-slate-300">/</span> Final QA & Digital Twin
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Database className="text-brand-600" size={24} />
             Battery Registry (S9)
           </h1>
           <p className="text-slate-500 text-sm mt-1">System of Record for all manufactured units. Read-only Digital Twin (Trace) view.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-bold border border-slate-200">
             <History size={14} />
             <span>TRACE VIEW</span>
          </div>
          {/* S9 Context Read-Only Display */}
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
             <ClipboardCheck size={10} />
             <span>Final QA Queue: {s9Context.packsQueuedForFinalQaCount}</span>
             <span className="text-slate-300">|</span>
             <span className={`font-bold ${s9Context.finalQaStatus === 'APPROVED' ? 'text-green-600' : 
               s9Context.finalQaStatus === 'CHECKING' ? 'text-blue-600' : 'text-slate-600'}`}>
                {s9Context.finalQaStatus}
             </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S9" />
      <PreconditionsPanel stageId="S9" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S9 Activity (Session)
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
                ? "Registry entry approved. Proceed to BMS Provisioning (S10) for firmware and identity binding." 
                : "Final QA pending. Approve digital twin registry entry to enable downstream provisioning."}
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
               onClick={handleNavToS10} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Cpu size={14} /> Go to S10: BMS Provisioning
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Final QA Not Approved</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Registry List */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Search size={16} />
                  Production Ledger
                </h3>
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Filter by ID, SKU or Batch..." 
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                  disabled={true} // Always disabled for everyone per previous rules, but reinforced here.
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
             </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-0">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                 <tr>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Pack ID</th>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">SKU</th>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {REGISTRY_DATA.map((pack) => (
                   <tr 
                     key={pack.id}
                     onClick={() => setSelectedPack(pack)}
                     className={`cursor-pointer transition-colors ${
                       selectedPack.id === pack.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                     }`}
                   >
                     <td className="px-4 py-3 align-top">
                       <div className="font-bold text-slate-800">{pack.packId}</div>
                       <div className="text-[10px] text-slate-400 font-mono mt-0.5">{pack.mfgDate}</div>
                     </td>
                     <td className="px-4 py-3 text-slate-600 align-top">{pack.skuCode}</td>
                     <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          pack.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          pack.status === 'Dispatched' ? 'bg-slate-100 text-slate-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pack.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="p-2 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
             Showing {REGISTRY_DATA.length} records.
          </div>
        </div>

        {/* Right Col: Digital Twin Detail */}
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-brand-50 rounded border border-brand-100">
                    <Battery size={24} className="text-brand-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPack.packId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Digital Twin ID: {selectedPack.id}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Registry State</div>
                <div className={`text-lg font-bold ${
                    selectedPack.status === 'Approved' ? 'text-green-600' :
                    selectedPack.status === 'Dispatched' ? 'text-slate-600' : 'text-red-600'
                }`}>
                    {selectedPack.status.toUpperCase()}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* --- FINAL QA OPERATIONS (NEW PANEL) --- */}
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Stethoscope size={16} className="text-brand-500" />
                  Final QA Workstation
               </h3>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                     <button 
                       onClick={handleStartQa}
                       disabled={!startQaState.enabled}
                       className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                       title={startQaState.reason}
                     >
                        <Play size={16} /> Start QA Session
                     </button>
                     {!startQaState.enabled && <DisabledHint reason={startQaState.reason || 'Blocked'} className="mt-1" />}
                  </div>
                  <div>
                     <button 
                       onClick={handleCompleteChecks}
                       disabled={!completeQaState.enabled}
                       className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                       title={completeQaState.reason}
                     >
                        <CheckCircle size={16} /> Finish Checks
                     </button>
                     {!completeQaState.enabled && <DisabledHint reason={completeQaState.reason || 'Blocked'} className="mt-1" />}
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div className="flex flex-col">
                     <button 
                       onClick={handleApprove}
                       disabled={!approveState.enabled}
                       className="w-full flex flex-col items-center justify-center p-2 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                       title={approveState.reason}
                     >
                        <ThumbsUp size={16} className="mb-1" />
                        <span className="text-xs font-bold">APPROVE</span>
                     </button>
                  </div>
                  <div className="flex flex-col">
                     <button 
                       onClick={handleReject}
                       disabled={!rejectState.enabled}
                       className="w-full flex flex-col items-center justify-center p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                       title={rejectState.reason}
                     >
                        <ThumbsDown size={16} className="mb-1" />
                        <span className="text-xs font-bold">REJECT</span>
                     </button>
                  </div>
                  <div className="flex flex-col">
                     <button 
                       onClick={handleRelease}
                       disabled={!releaseState.enabled}
                       className="w-full flex flex-col items-center justify-center p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                       title={releaseState.reason}
                     >
                        <LogOut size={16} className="mb-1" />
                        <span className="text-xs font-bold">RELEASE</span>
                     </button>
                  </div>
               </div>
            </section>

            {/* --- SECTION: ASSET TRACKING --- */}
            <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Battery size={16} className="text-blue-500" />
                    Asset Tracking Scope (Current State)
                </h3>
                <p className="text-xs text-slate-400 mb-4 italic">Current State Snapshot (Track reference only)</p>

                {/* Custodian of Record Panel */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <UserCheck size={14} /> Custodian of Record
                        </span>
                        <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">System-of-Record View (Demo)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Current Custodian</div>
                            <div className="font-bold text-slate-800">{selectedPack.custodian.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{selectedPack.custodian.type}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">Custody Since</div>
                            <div className="font-mono text-slate-800">{selectedPack.custodian.since}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Basis: {selectedPack.custodian.basis}</div>
                        </div>
                        <div className="col-span-2 mt-2">
                            <div className="text-xs text-slate-400 mb-1">Regulatory Responsibility</div>
                            <div className="flex gap-2">
                                {selectedPack.custodian.responsibilities.map((resp, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold uppercase border border-blue-200">
                                        {resp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custody Transition Timeline */}
                <div className="mb-6">
                    <div className="text-xs font-bold text-slate-400 mb-2">CUSTODY TRACKING TIMELINE</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 relative">
                        {/* Track Line */}
                        <div className="absolute top-1.5 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
                        
                        <div className="flex flex-col items-center gap-1 bg-white px-1 z-10">
                            <div className={`w-3 h-3 rounded-full border-2 ${selectedPack.status !== 'Hold' ? 'bg-brand-500 border-brand-500' : 'bg-slate-300 border-slate-300'}`}></div>
                            <span className="font-medium text-brand-700">Mfg Complete</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-white px-1 z-10">
                            <div className={`w-3 h-3 rounded-full border-2 ${selectedPack.custodian.type === 'Manufacturer' || selectedPack.status === 'Dispatched' ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}`}></div>
                            <span>Warehouse</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-white px-1 z-10">
                            <div className={`w-3 h-3 rounded-full border-2 ${selectedPack.status === 'Dispatched' ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'}`}></div>
                            <span>In Transit</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-white px-1 z-10">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></div>
                            <span>Customer</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-white px-1 z-10">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></div>
                            <span>Recycling</span>
                        </div>
                    </div>
                </div>

                {/* Component Traceability (Integrated) */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white rounded border border-slate-200">
                        <div className="text-xs text-slate-400 mb-1">BMS Serial Number (Identity)</div>
                        <div className="font-mono font-medium text-slate-800">{selectedPack.details.bmsSerial}</div>
                    </div>
                    <div className="p-3 bg-white rounded border border-slate-200">
                        <div className="text-xs text-slate-400 mb-1">Modules Installed</div>
                        <div className="font-mono font-medium text-slate-800">4x LFP-48V (Ref: M-042..M-046)</div>
                    </div>
                </div>
            </div>

            {/* --- SECTION: MATERIAL TRACKING --- */}
            <div className="border-l-4 border-green-500 pl-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Recycle size={16} className="text-green-500" />
                    Material Attributes (Regulatory Traceability)
                </h3>
                <p className="text-xs text-slate-400 mb-4 italic">Immutable material provenance and mass accounting.</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                       <div className="text-xs text-slate-400 mb-1">Chemistry Category</div>
                       <div className="font-medium text-slate-800">{selectedPack.material.chemistry}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                       <div className="text-xs text-slate-400 mb-1">Net Mass</div>
                       <div className="font-mono font-medium text-slate-800">{selectedPack.material.mass}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                       <div className="text-xs text-slate-400 mb-1">EPR Relevance</div>
                       <div className={`font-bold ${selectedPack.material.eprEligible ? 'text-green-600' : 'text-slate-600'}`}>
                           {selectedPack.material.eprEligible ? 'YES - Reportable' : 'NO'}
                       </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                       <div className="text-xs text-slate-400 mb-1">Recycling Status</div>
                       <div className="font-medium text-slate-800">{selectedPack.material.recyclingStatus}</div>
                    </div>
                </div>
            </div>

             {/* Compliance Readiness (Shared) */}
            <section className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileBadge size={16} className="text-brand-500" />
                Compliance & Digital Passport
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-4 rounded border flex items-center gap-3 ${selectedPack.compliance.batteryAadhaar ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <FileText size={24} className={selectedPack.compliance.batteryAadhaar ? 'text-purple-600' : 'text-slate-400'} />
                    <div>
                        <div className={`font-bold text-sm ${selectedPack.compliance.batteryAadhaar ? 'text-purple-900' : 'text-slate-600'}`}>Battery Aadhaar</div>
                        <div className="text-xs text-slate-500">{selectedPack.compliance.batteryAadhaar ? 'ID Assigned' : 'Not Applicable'}</div>
                    </div>
                 </div>

                 <div className={`p-4 rounded border flex items-center gap-3 ${selectedPack.compliance.euPassport ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                    <Globe size={24} className={selectedPack.compliance.euPassport ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                        <div className={`font-bold text-sm ${selectedPack.compliance.euPassport ? 'text-blue-900' : 'text-slate-600'}`}>EU Passport</div>
                        <div className="text-xs text-slate-500">{selectedPack.compliance.euPassport ? 'Ready for Export' : 'Not Required'}</div>
                    </div>
                 </div>
              </div>
            </section>

          </div>
          
           {/* Footer Info */}
           <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-400">
               <Calendar size={12} className="inline mr-1" />
               Manufactured Date: {selectedPack.mfgDate} • Batch: {selectedPack.batchId}
           </div>
        </div>

      </div>
    </div>
  );
};
