import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Recycle, 
  Search, 
  Battery, 
  RotateCcw, 
  Ban, 
  Factory, 
  Leaf, 
  Scale, 
  FileCheck, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  Wrench,
  Truck,
  CheckSquare,
  Archive,
  FilePlus,
  XCircle,
  History,
  CheckCircle2,
  RefreshCw,
  Radar
} from 'lucide-react';
import { getMockS13Context, S13Context } from '../stages/s13/s13Contract';
import { getS13ActionState, S13ActionId } from '../stages/s13/s13Guards';
import { DisabledHint } from './DisabledHint';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface EolUnit {
  id: string;
  packId: string;
  customer: string;
  reason: 'End of Life' | 'Damage' | 'Recall' | 'Warranty Return';
  status: 'Pending Intake' | 'Received' | 'Sorted' | 'Processed';
  weight: string;
  chemistry: string;
}

// Mock Data
const INTAKE_QUEUE: EolUnit[] = [
  {
    id: 'eol-001',
    packId: 'PCK-2022-098-001',
    customer: 'EcoRide Logistics',
    reason: 'End of Life',
    status: 'Pending Intake',
    weight: '18.2 kg',
    chemistry: 'LFP'
  },
  {
    id: 'eol-002',
    packId: 'PCK-2024-012-044',
    customer: 'CityBus Metro',
    reason: 'Damage',
    status: 'Received',
    weight: '420 kg',
    chemistry: 'NMC'
  },
  {
    id: 'eol-003',
    packId: 'PCK-2023-005-019',
    customer: 'Private Fleet B',
    reason: 'Recall',
    status: 'Sorted',
    weight: '18.5 kg',
    chemistry: 'LFP'
  }
];

interface RecyclingRecoveryProps {
  onNavigate?: (view: NavView) => void;
}

export const RecyclingRecovery: React.FC<RecyclingRecoveryProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedUnit, setSelectedUnit] = useState<EolUnit>(INTAKE_QUEUE[0]);

  // S13 Context State
  const [s13Context, setS13Context] = useState<S13Context>(getMockS13Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S13'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S13ActionId) => getS13ActionState(role, s13Context, actionId);

  // Action Handlers
  const handleOpenRequest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS13Context(prev => ({
        ...prev,
        serviceStatus: 'SERVICE_OPEN',
        serviceRequestsOpenCount: prev.serviceRequestsOpenCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S13',
        actionId: 'OPEN_SERVICE_REQUEST',
        actorRole: role,
        message: 'Service request opened. Status: SERVICE_OPEN.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleInitiateReturn = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS13Context(prev => ({
        ...prev,
        serviceStatus: 'RETURN_IN_PROGRESS',
        returnsInitiatedCount: prev.returnsInitiatedCount + 1,
        returnsInTransitCount: prev.returnsInTransitCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S13',
        actionId: 'INITIATE_RETURN',
        actorRole: role,
        message: 'Return initiated. Status: RETURN_IN_PROGRESS.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleConfirmReturn = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS13Context(prev => ({
        ...prev,
        // Transition to CLOSED to allow archiving
        serviceStatus: 'CLOSED',
        returnsInTransitCount: Math.max(0, prev.returnsInTransitCount - 1)
      }));
      const evt = emitAuditEvent({
        stageId: 'S13',
        actionId: 'CONFIRM_RETURN_RECEIPT',
        actorRole: role,
        message: 'Returned pack received. Status: CLOSED.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleCloseRequest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS13Context(prev => ({
        ...prev,
        serviceStatus: 'CLOSED',
        serviceRequestsClosedCount: prev.serviceRequestsClosedCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S13',
        actionId: 'CLOSE_SERVICE_REQUEST',
        actorRole: role,
        message: 'Service request closed without return. Status: CLOSED.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCloseCase = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS13Context(prev => ({
        ...prev,
        serviceStatus: 'CLOSED',
        lastServiceEventAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S13',
        actionId: 'CLOSE_SERVICE_CASE',
        actorRole: role,
        message: 'Service & return case formally archived.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleResetDemo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS13Context(prev => ({
        ...prev,
        serviceStatus: 'IDLE'
      }));
      setIsSimulating(false);
    }, 400);
  };

  // Nav Handlers
  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const handleNavToS14 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S13',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S14 (Compliance/Refurbish) from S13 Next Step panel'
      });
      // Guiding to Compliance & Audit (S17 in code, S14 in greenfield flow)
      onNavigate('compliance_audit');
    }
  };

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.SUSTAINABILITY || 
    role === UserRole.SERVICE || 
    role === UserRole.MANAGEMENT;

  const isAuditor = role === UserRole.MANAGEMENT;
  
  // Guard States
  const openReqState = getAction('OPEN_SERVICE_REQUEST');
  const closeReqState = getAction('CLOSE_SERVICE_REQUEST');
  const initReturnState = getAction('INITIATE_RETURN');
  const confirmReturnState = getAction('CONFIRM_RETURN_RECEIPT');
  const closeCaseState = getAction('CLOSE_SERVICE_CASE');

  const isReadyForNext = s13Context.serviceStatus === 'CLOSED';

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Recycling & Recovery.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 pb-12">
      
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
              Track & Lifecycle <span className="text-slate-300">/</span> Recovery
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Recycle className="text-brand-600" size={24} />
             Service & Returns (S13)
           </h1>
           <p className="text-slate-500 text-sm mt-1">End-of-Life (EOL) management, returns intake, and material recovery.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded border border-green-200 text-xs font-bold">
             <Leaf size={14} />
             <span>SUSTAINABILITY TRACKING</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <ClipboardList size={10} />
            <span>Requests: {s13Context.serviceRequestsOpenCount}</span>
            <span className="text-slate-300">|</span>
            <span>Returns: {s13Context.returnsInitiatedCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s13Context.serviceStatus === 'SERVICE_OPEN' ? 'text-blue-600' : 'text-slate-600'}`}>
              Status: {s13Context.serviceStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S13" />
      <PreconditionsPanel stageId="S13" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S13 Activity (Session)
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
                ? "Service case closed. Proceed to Compliance & Audit (S14) for final lifecycle verification." 
                : "Service action in progress. Close the case to enable downstream audit and disposal."}
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
               onClick={handleNavToS14} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <ShieldCheck size={14} /> Go to S14: Compliance & Audit
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Case Not Closed</span>
             )}
           </div>
        </div>
      </div>

      {/* Service & Returns Operations Toolbar */}
      <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col md:flex-row items-center gap-4 justify-between transition-opacity ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-100">
               <RotateCcw size={20} />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-sm">Service Operations</h3>
               <p className="text-xs text-slate-500">Lifecycle State Control</p>
            </div>
         </div>

         <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Open Request */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleOpenRequest}
                disabled={!openReqState.enabled}
                title={openReqState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white border border-blue-700 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-xs font-bold transition-colors shadow-sm"
              >
                <FilePlus size={14} /> Open Request
              </button>
            </div>

            {/* Initiate Return */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleInitiateReturn}
                disabled={!initReturnState.enabled}
                title={initReturnState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-400 text-xs font-bold transition-colors"
              >
                <Truck size={14} /> RMA Init
              </button>
            </div>

            {/* Confirm Receipt */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleConfirmReturn}
                disabled={!confirmReturnState.enabled}
                title={confirmReturnState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-xs font-bold transition-colors"
              >
                <CheckSquare size={14} /> Confirm Receipt
              </button>
            </div>

            <div className="w-px h-6 bg-slate-300 mx-2"></div>

            {/* Close Request */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleCloseRequest}
                disabled={!closeReqState.enabled}
                title={closeReqState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-400 text-xs font-bold transition-colors"
              >
                <XCircle size={14} /> Close Req
              </button>
            </div>

            {/* Archive Case */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleCloseCase}
                disabled={!closeCaseState.enabled}
                title={closeCaseState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white border border-slate-900 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 text-xs font-bold transition-colors shadow-sm"
              >
                <Archive size={14} /> Archive
              </button>
            </div>

            {/* Demo Reset */}
            {s13Context.serviceStatus === 'CLOSED' && (
               <div className="flex flex-col items-center ml-2 border-l border-slate-200 pl-2">
                  <button 
                    onClick={handleResetDemo}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded hover:bg-slate-200 text-xs font-bold transition-colors"
                    title="Reset for Demo"
                  >
                    <RefreshCw size={14} />
                  </button>
               </div>
            )}
         </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Intake Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <RotateCcw size={16} />
               Returns Intake (Current State)
             </h3>
             <span className="text-xs text-slate-400">Pending Disposition</span>
          </div>
          <div className="p-3 border-b border-slate-100">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan Return ID..." 
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                  disabled={isAuditor}
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
             </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {INTAKE_QUEUE.map((unit) => (
              <div 
                key={unit.id} 
                onClick={() => setSelectedUnit(unit)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedUnit.id === unit.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{unit.packId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    unit.status === 'Sorted' ? 'bg-green-100 text-green-700' :
                    unit.status === 'Received' ? 'bg-amber-100 text-amber-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {unit.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-1">{unit.customer}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                   <span className={`px-1 rounded border ${
                       unit.reason === 'Damage' ? 'bg-red-50 text-red-600 border-red-100' : 
                       'bg-slate-50 text-slate-500 border-slate-100'
                   }`}>{unit.reason}</span>
                   <span>{unit.chemistry}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Inspection & Sorting */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <Battery size={24} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedUnit.packId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Weight: {selectedUnit.weight}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Disposition</div>
                <div className={`text-lg font-bold ${
                    selectedUnit.status === 'Sorted' ? 'text-green-600' : 'text-slate-600'
                }`}>
                    {selectedUnit.status.toUpperCase()}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Sorting Actions - Hidden for Auditor */}
            {!isAuditor && (
              <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Factory size={16} className="text-brand-500" />
                      Inspection & Sorting (Track -> Trace)
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                          disabled={true} 
                          className="p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors flex flex-col items-center text-center gap-2 opacity-80 cursor-not-allowed"
                      >
                          <RotateCcw size={24} className="text-green-600" />
                          <span className="text-sm font-bold text-green-900">Reuse</span>
                          <span className="text-[10px] text-green-700">2nd Life Application</span>
                      </button>

                      <button 
                          disabled={true} 
                          className="p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center text-center gap-2 opacity-80 cursor-not-allowed"
                      >
                          <Battery size={24} className="text-blue-600" />
                          <span className="text-sm font-bold text-blue-900">Refurbish</span>
                          <span className="text-[10px] text-blue-700">Module Replacement</span>
                      </button>

                      <button 
                          disabled={true} 
                          className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center text-center gap-2 opacity-80 cursor-not-allowed"
                      >
                          <Recycle size={24} className="text-slate-600" />
                          <span className="text-sm font-bold text-slate-900">Recycle</span>
                          <span className="text-xs text-slate-500">Material Recovery</span>
                      </button>

                      <button 
                          disabled={true} 
                          className="p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex flex-col items-center text-center gap-2 opacity-80 cursor-not-allowed"
                      >
                          <Ban size={24} className="text-red-600" />
                          <span className="text-sm font-bold text-red-900">Quarantine</span>
                          <span className="text-xs text-red-700">Hazardous / Damaged</span>
                      </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-3">
                      Disposition actions are disabled in Frontend-Only Demo Mode.
                  </p>
              </section>
            )}

            {/* 2. Material Recovery Snapshot */}
            <section className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Scale size={16} className="text-brand-500" />
                    Material Recovery Estimate (Trace Origin Reference)
                </h3>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Process Route</div>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                            {selectedUnit.chemistry === 'LFP' ? 'Hydrometallurgy' : 'Pyrometallurgy'}
                            <ArrowRight size={12} className="text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1">Est. Recoverable Mass</div>
                        <div className="font-bold text-slate-800">
                             ~{(parseFloat(selectedUnit.weight) * 0.65).toFixed(1)} kg <span className="text-xs font-normal text-slate-500">(65%)</span>
                        </div>
                    </div>
                     <div>
                        <div className="text-xs text-slate-500 mb-1">Primary Outputs</div>
                        <div className="flex gap-1">
                             <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded">Black Mass</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded">Al</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded">Cu</span>
                        </div>
                    </div>
                </div>
            </section>

             {/* 3. Compliance / EPR Panel */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileCheck size={16} className="text-brand-500" />
                Compliance & EPR
              </h3>
              <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded">
                      <span className="text-sm text-slate-700">Extended Producer Responsibility (EPR) Eligible</span>
                      <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">YES</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded">
                      <span className="text-sm text-slate-700">Chain of Custody Complete</span>
                      <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">YES</span>
                  </div>
                   <div className="flex items-center justify-between p-3 border border-slate-100 rounded bg-amber-50">
                      <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="text-sm text-slate-700">Recycling Certificate</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">PENDING PROCESS</span>
                  </div>
              </div>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
