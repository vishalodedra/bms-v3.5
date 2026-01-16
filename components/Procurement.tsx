import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  ShoppingCart, 
  PackageCheck, 
  Truck, 
  FileText, 
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Database,
  Send,
  ThumbsUp,
  Archive,
  Plus,
  History,
  RotateCcw,
  ArrowRight,
  Radar
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS2Context, S2Context } from '../stages/s2/s2Contract';
import { getS2ActionState, S2ActionId } from '../stages/s2/s2Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface ApprovedSKU {
  id: string;
  code: string;
  chemistry: string;
  preferredSupplier: string;
}

interface Supplier {
  id: string;
  name: string;
  type: 'Cells' | 'BMS' | 'Mechanical' | 'Thermal';
  status: 'Approved' | 'Conditional' | 'Pending';
  region: string;
  rating: string;
}

interface CommercialTerm {
  id: string;
  skuRef: string;
  moq: string;
  leadTime: string;
  priceBand: string;
  contractStatus: 'Active' | 'Draft' | 'Expired';
}

// Mock Data
const APPROVED_SKUS: ApprovedSKU[] = [
  { id: 'sku-001', code: 'BP-LFP-48V-2.5K', chemistry: 'LFP', preferredSupplier: 'CellGlobal Dynamics' },
  { id: 'sku-003', code: 'BP-LTO-24V-1K', chemistry: 'LTO', preferredSupplier: 'NanoTech Energy' },
];

const SUPPLIERS: Supplier[] = [
  { id: 'sup-001', name: 'CellGlobal Dynamics', type: 'Cells', status: 'Approved', region: 'APAC', rating: 'A+' },
  { id: 'sup-002', name: 'Orion BMS Systems', type: 'BMS', status: 'Approved', region: 'NA', rating: 'A' },
  { id: 'sup-003', name: 'ThermalWrap Inc', type: 'Thermal', status: 'Conditional', region: 'EU', rating: 'B' },
  { id: 'sup-004', name: 'Precision Casings', type: 'Mechanical', status: 'Pending', region: 'APAC', rating: '-' },
];

const TERMS: CommercialTerm[] = [
  { id: 'tm-001', skuRef: 'BP-LFP-48V-2.5K', moq: '5,000 Units', leadTime: '12 Weeks', priceBand: '$125 - $140 / kWh', contractStatus: 'Active' },
  { id: 'tm-002', skuRef: 'BP-LTO-24V-1K', moq: '1,000 Units', leadTime: '16 Weeks', priceBand: '$350 - $380 / kWh', contractStatus: 'Draft' },
];

interface ProcurementProps {
  onNavigate?: (view: NavView) => void;
}

export const Procurement: React.FC<ProcurementProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>(SUPPLIERS[0]);

  // Local State for S2 Context Simulation
  const [s2Context, setS2Context] = useState<S2Context>(getMockS2Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S2'));
  }, []);

  // Guard Logic
  const getAction = (actionId: S2ActionId) => getS2ActionState(role, s2Context, actionId);

  // Action Handlers
  const handleCreatePo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS2Context(prev => ({ 
        ...prev, 
        activePoCount: prev.activePoCount + 1,
        procurementStatus: 'RAISING_PO',
        lastPoCreatedAt: now
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'CREATE_PO',
        actorRole: role,
        message: 'Created new Purchase Order draft (PO-2026-X)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleSubmitPo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS2Context(prev => ({ 
        ...prev, 
        procurementStatus: 'WAITING_APPROVAL',
        pendingApprovalsCount: prev.pendingApprovalsCount + 1 
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'SUBMIT_PO_FOR_APPROVAL',
        actorRole: role,
        message: 'Submitted PO for commercial approval'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleApprovePo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS2Context(prev => ({ 
        ...prev, 
        procurementStatus: 'APPROVED',
        pendingApprovalsCount: Math.max(0, prev.pendingApprovalsCount - 1)
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'APPROVE_PO',
        actorRole: role,
        message: 'PO formally approved and signed off'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleIssuePo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Status remains APPROVED or could transition to ISSUED if we had that state.
      // We will just emit the event to show progress.
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'ISSUE_PO_TO_VENDOR',
        actorRole: role,
        message: `PO issued to vendor ${selectedSupplier.name}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleCloseCycle = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS2Context(prev => ({ 
        ...prev, 
        procurementStatus: 'IDLE'
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'CLOSE_PROCUREMENT_CYCLE',
        actorRole: role,
        message: 'Procurement cycle closed. Ready for next order.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  // Navigation Handlers
  const handleNavToS3 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S2',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S3: Inbound Receipt from S2'
      });
      onNavigate('inbound_receipt');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // Pre-calculate action states
  const createPoState = getAction('CREATE_PO');
  const submitPoState = getAction('SUBMIT_PO_FOR_APPROVAL');
  const approvePoState = getAction('APPROVE_PO');
  const issuePoState = getAction('ISSUE_PO_TO_VENDOR');
  const closeCycleState = getAction('CLOSE_PROCUREMENT_CYCLE');

  // Logic for Next Step
  const isReadyForNext = s2Context.procurementStatus === 'APPROVED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.PROCUREMENT || 
    role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Commercial Procurement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 pb-12">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Procurement <span className="text-slate-300">/</span> Orders
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <ShoppingCart className="text-brand-600" size={24} />
             Commercial Procurement (S2)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Manage supplier qualifications, commercial terms, and procurement orders.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button 
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!createPoState.enabled || isSimulating}
              onClick={handleCreatePo}
              title={createPoState.reason}
            >
              <Plus size={16} />
              <span>Create PO</span>
            </button>
          </div>
          {!createPoState.enabled && (
             <DisabledHint reason={createPoState.reason || 'Blocked'} className="mt-1" />
          )}
          
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} /> 
            <span>Active POs: {s2Context.activePoCount}</span>
            <span className="text-slate-300">|</span>
            <span>Pending: {s2Context.pendingApprovalsCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s2Context.procurementStatus === 'APPROVED' ? 'text-green-600' : 'text-blue-600'}`}>
              {s2Context.procurementStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S2" />
      <PreconditionsPanel stageId="S2" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S2 Activity (Session)
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
                ? "Procurement cycle complete. Proceed to Inbound Receipt (S3) to process incoming materials." 
                : "Procurement active. Complete approval cycle to unlock Inbound Logistics."}
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
               onClick={handleNavToS3} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <Truck size={14} /> Go to S3: Inbound
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Wait for Approval</span>
             )}
           </div>
        </div>
      </div>

      {/* Procurement Lifecycle Toolbar */}
      <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col md:flex-row items-center gap-4 justify-between transition-opacity ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-100">
               <FileText size={20} />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-sm">Active Order Cycle</h3>
               <p className="text-xs text-slate-500">Status: <span className="font-bold">{s2Context.procurementStatus}</span></p>
            </div>
         </div>

         <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Submit */}
            <div className="flex flex-col items-center">
              <button 
                disabled={!submitPoState.enabled}
                onClick={handleSubmitPo}
                title={submitPoState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 text-xs font-bold transition-colors"
              >
                <Send size={14} /> Submit
              </button>
            </div>

            <div className="w-4 h-px bg-slate-300"></div>

            {/* Approve */}
            <div className="flex flex-col items-center">
              <button 
                disabled={!approvePoState.enabled}
                onClick={handleApprovePo}
                title={approvePoState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-100 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-xs font-bold transition-colors"
              >
                <ThumbsUp size={14} /> Approve
              </button>
            </div>

            <div className="w-4 h-px bg-slate-300"></div>

            {/* Issue */}
            <div className="flex flex-col items-center">
              <button 
                disabled={!issuePoState.enabled}
                onClick={handleIssuePo}
                title={issuePoState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-xs font-bold transition-colors"
              >
                <CreditCard size={14} /> Issue PO
              </button>
            </div>

            {/* Close Cycle (Conditionally visible when Approved) */}
            {closeCycleState.enabled && (
                <>
                    <div className="w-4 h-px bg-slate-300"></div>
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={handleCloseCycle}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 text-xs font-bold transition-colors"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </>
            )}
         </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Approved SKU Reference */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <PackageCheck size={16} />
               Approved SKUs
             </h3>
             <span className="text-xs text-slate-400">Sourced from S1 Blueprint</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {APPROVED_SKUS.map((sku) => (
              <div key={sku.id} className="p-3 bg-white border border-slate-100 rounded-md shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{sku.code}</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
                <div className="text-xs text-slate-500 mb-2">Chem: {sku.chemistry}</div>
                <div className="bg-slate-50 px-2 py-1 rounded text-[10px] text-slate-600 font-medium">
                  Pref: {sku.preferredSupplier}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Col: Supplier Master */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Truck size={16} />
               Supplier Master
             </h3>
             <span className="text-xs text-slate-400">Qualified Vendors ({s2Context.vendorCatalogCount})</span>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Supplier Name</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SUPPLIERS.map((sup) => (
                  <tr 
                    key={sup.id} 
                    onClick={() => setSelectedSupplier(sup)}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedSupplier.id === sup.id ? 'bg-brand-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{sup.name}</td>
                    <td className="px-4 py-3 text-slate-600">{sup.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sup.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        sup.status === 'Conditional' ? 'bg-amber-100 text-amber-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{sup.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Commercial Terms */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Building2 size={16} />
               Commercial Terms
             </h3>
             <span className="text-xs text-slate-400">Contract & Pricing Snapshots</span>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
             {TERMS.map((term) => (
               <div key={term.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                     <span className="text-xs font-mono font-bold text-slate-500">{term.skuRef}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                       term.contractStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                       term.contractStatus === 'Draft' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                       'bg-red-50 text-red-700 border-red-200'
                     }`}>
                       {term.contractStatus}
                     </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">MOQ</div>
                      <div className="font-medium text-slate-800">{term.moq}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Lead Time</div>
                      <div className="font-medium text-slate-800">{term.leadTime}</div>
                    </div>
                     <div className="col-span-2">
                      <div className="text-[10px] text-slate-400 uppercase">Indicative Price Band</div>
                      <div className="font-medium text-slate-800 bg-white border border-slate-200 p-2 rounded text-center">
                        {term.priceBand}
                      </div>
                    </div>
                  </div>
               </div>
             ))}
             
             <div className="p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 flex items-start gap-2">
               <AlertCircle size={14} className="mt-0.5 shrink-0" />
               <p>Commercial terms displayed are for demonstration purposes. Actual pricing is retrieved securely from the ERP backend (mocked).</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
