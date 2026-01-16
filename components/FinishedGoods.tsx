import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  PackageCheck, 
  MapPin, 
  Search, 
  Filter, 
  Truck, 
  Bookmark, 
  Info,
  Battery,
  CheckCircle2,
  Globe,
  FileBadge,
  Archive,
  ClipboardList,
  Box,
  Stamp,
  UserCheck,
  History,
  Activity,
  ArrowRight,
  Radar,
  LifeBuoy
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { getMockS11Context, S11Context } from '../stages/s11/s11Contract';
import { getS11ActionState, S11ActionId } from '../stages/s11/s11Guards';
import { DisabledHint } from './DisabledHint';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface InventoryItem {
  id: string;
  packId: string;
  sku: string;
  batchId: string;
  location: string;
  status: 'Available' | 'Reserved' | 'Dispatched';
  entryDate: string;
  compliance: {
    aadhaar: boolean;
    passport: boolean;
  };
  bmsStatus: 'Provisioned' | 'Pending';
}

// Mock Data
const INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    packId: 'PCK-2026-001-005',
    sku: 'BP-LFP-48V-2.5K',
    batchId: 'P-2026-01-001',
    location: 'Zone A - Rack 04 - Shelf 2',
    status: 'Available',
    entryDate: '2026-01-11 10:00',
    compliance: { aadhaar: true, passport: false },
    bmsStatus: 'Provisioned'
  },
  {
    id: 'inv-002',
    packId: 'PCK-2026-001-008',
    sku: 'BP-LFP-48V-2.5K',
    batchId: 'P-2026-01-001',
    location: 'Zone A - Rack 04 - Shelf 3',
    status: 'Reserved',
    entryDate: '2026-01-11 10:45',
    compliance: { aadhaar: true, passport: false },
    bmsStatus: 'Provisioned'
  },
  {
    id: 'inv-003',
    packId: 'PCK-2026-002-001',
    sku: 'BP-NMC-800V-75K',
    batchId: 'P-2026-01-002',
    location: 'Zone B - High Voltage Cage',
    status: 'Available',
    entryDate: '2026-01-11 12:30',
    compliance: { aadhaar: true, passport: true },
    bmsStatus: 'Provisioned'
  },
  {
    id: 'inv-004',
    packId: 'PCK-2026-001-012',
    sku: 'BP-LFP-48V-2.5K',
    batchId: 'P-2026-01-001',
    location: 'Dispatch Bay 1',
    status: 'Dispatched',
    entryDate: '2026-01-11 09:00',
    compliance: { aadhaar: true, passport: false },
    bmsStatus: 'Provisioned'
  }
];

interface FinishedGoodsProps {
  onNavigate?: (view: NavView) => void;
}

export const FinishedGoods: React.FC<FinishedGoodsProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedItem, setSelectedItem] = useState<InventoryItem>(INVENTORY[0]);

  // S11 Context & Event State
  const [s11Context, setS11Context] = useState<S11Context>(getMockS11Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S11'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S11ActionId) => getS11ActionState(role, s11Context, actionId);

  // Action Handlers
  const handlePrepareDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS11Context(prev => ({
        ...prev,
        dispatchStatus: 'READY',
        stockReadyCount: Math.max(0, prev.stockReadyCount - 5),
        stockReservedCount: prev.stockReservedCount + 5
      }));
      const evt = emitAuditEvent({
        stageId: 'S11',
        actionId: 'PREPARE_DISPATCH',
        actorRole: role,
        message: 'Dispatch lot prepared; 5 units allocated and reserved'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleHandover = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS11Context(prev => ({
        ...prev,
        dispatchStatus: 'DISPATCHED',
        stockReservedCount: Math.max(0, prev.stockReservedCount - 5),
        custodyHandoverPendingCount: prev.custodyHandoverPendingCount + 1, // Represents 1 lot/shipment
        lastMovementAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S11',
        actionId: 'HANDOVER_TO_LOGISTICS',
        actorRole: role,
        message: 'Physical handover to Logistics provider complete'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleConfirmTransit = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS11Context(prev => ({
        ...prev,
        dispatchStatus: 'IN_TRANSIT',
        custodyHandoverPendingCount: Math.max(0, prev.custodyHandoverPendingCount - 1),
        consignmentsInTransitCount: prev.consignmentsInTransitCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S11',
        actionId: 'CONFIRM_IN_TRANSIT',
        actorRole: role,
        message: 'Consignment marked as In-Transit (Custody Transferred)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleConfirmDelivery = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS11Context(prev => ({
        ...prev,
        dispatchStatus: 'DELIVERED',
        consignmentsInTransitCount: Math.max(0, prev.consignmentsInTransitCount - 1),
        totalDispatchedCount: prev.totalDispatchedCount + 5
      }));
      const evt = emitAuditEvent({
        stageId: 'S11',
        actionId: 'CONFIRM_DELIVERY',
        actorRole: role,
        message: 'Delivery confirmed at destination'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleCloseCustody = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Reset logic for demo purposes to allow starting over, 
      // but formally this closes the loop.
      setS11Context(prev => ({
        ...prev,
        dispatchStatus: 'IDLE' 
      }));
      const evt = emitAuditEvent({
        stageId: 'S11',
        actionId: 'CLOSE_CUSTODY',
        actorRole: role,
        message: 'Custody chain closed successfully. Cycle reset.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const handleNavToS12 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S11',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to Warranty & Lifecycle (S15) from S11 Next Step panel'
      });
      // Mapped to Service & Warranty (S15) as "Warranty & Lifecycle" per prompt intent
      onNavigate('service_warranty');
    }
  };

  // Guard States
  const prepareDispatchState = getAction('PREPARE_DISPATCH');
  const handoverState = getAction('HANDOVER_TO_LOGISTICS');
  const confirmTransitState = getAction('CONFIRM_IN_TRANSIT');
  const confirmDeliveryState = getAction('CONFIRM_DELIVERY');
  const closeCustodyState = getAction('CLOSE_CUSTODY');

  // Next Step Readiness
  const isReadyForNext = s11Context.dispatchStatus === 'DELIVERED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.STORES || 
    role === UserRole.LOGISTICS || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Finished Goods Inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Logistics <span className="text-slate-300">/</span> Inventory
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <PackageCheck className="text-brand-600" size={24} />
             Finished Goods Inventory (S11)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Manage warehouse stock, storage locations, and dispatch readiness.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono border ${s11Context.warehouseStatus === 'OPERATIONAL' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
               <Archive size={14} />
               <span>WH: {s11Context.warehouseStatus}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <ClipboardList size={10} />
            <span>Ready: {s11Context.stockReadyCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s11Context.dispatchStatus !== 'IDLE' ? 'text-blue-600' : 'text-slate-600'}`}>
                Status: {s11Context.dispatchStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S11" />
      <PreconditionsPanel stageId="S11" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S11 Activity (Session)
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
                ? "Delivery confirmed. Proceed to Warranty & Lifecycle (S12) to manage field service." 
                : "Dispatch cycle in progress. Confirm final delivery to unlock Warranty context."}
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
               onClick={handleNavToS12} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <LifeBuoy size={14} /> Go to Warranty & Lifecycle
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Not Delivered</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Inventory List */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Archive size={16} />
                  Stock on Hand
                </h3>
                <button className="text-slate-400 hover:text-slate-600"><Filter size={16} /></button>
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan Pack ID or Location..." 
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                  disabled={isReadOnly}
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
             </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-0">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                 <tr>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Pack ID / SKU</th>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Location</th>
                   <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {INVENTORY.map((item) => (
                   <tr 
                     key={item.id}
                     onClick={() => setSelectedItem(item)}
                     className={`cursor-pointer transition-colors ${
                       selectedItem.id === item.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                     }`}
                   >
                     <td className="px-4 py-3 align-top">
                       <div className="font-bold text-slate-800">{item.packId}</div>
                       <div className="text-[10px] text-slate-400 truncate w-32 mt-0.5">{item.sku}</div>
                     </td>
                     <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1 text-slate-600">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate w-24 text-xs" title={item.location}>{item.location}</span>
                        </div>
                     </td>
                     <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'Available' ? 'bg-green-100 text-green-700' :
                          item.status === 'Reserved' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {item.status}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Right Col: Stock Detail */}
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <PackageCheck size={24} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedItem.packId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Batch: {selectedItem.batchId}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Custody State</div>
                <div className={`text-lg font-bold ${
                    selectedItem.status === 'Available' ? 'text-green-600' :
                    selectedItem.status === 'Reserved' ? 'text-amber-600' : 'text-slate-600'
                }`}>
                    {selectedItem.status.toUpperCase()}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Location & Storage */}
            <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" />
                    Storage Location
                </h3>
                <div className="flex items-center justify-between">
                    <div className="text-lg font-mono font-medium text-slate-700">{selectedItem.location}</div>
                    <div className="text-xs text-slate-500">Entry: {selectedItem.entryDate}</div>
                </div>
            </section>

            {/* 2. Product Provenance */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info size={16} className="text-brand-500" />
                Product Provenance
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="flex items-center gap-3 p-3 border border-slate-100 rounded">
                    <Battery size={20} className="text-green-600" />
                    <div>
                        <div className="font-semibold text-slate-700">Manufacturing</div>
                        <div className="text-xs text-slate-500">S3-S8 Completed</div>
                    </div>
                    <CheckCircle2 size={16} className="ml-auto text-green-500" />
                 </div>
                 <div className="flex items-center gap-3 p-3 border border-slate-100 rounded">
                    <Globe size={20} className={selectedItem.bmsStatus === 'Provisioned' ? 'text-green-600' : 'text-amber-500'} />
                    <div>
                        <div className="font-semibold text-slate-700">BMS Provisioning</div>
                        <div className="text-xs text-slate-500">{selectedItem.bmsStatus}</div>
                    </div>
                     <CheckCircle2 size={16} className={`ml-auto ${selectedItem.bmsStatus === 'Provisioned' ? 'text-green-500' : 'text-slate-300'}`} />
                 </div>
              </div>
            </section>

             {/* 3. Compliance Tags */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileBadge size={16} className="text-brand-500" />
                Compliance Readiness
              </h3>
              <div className="flex gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${selectedItem.compliance.aadhaar ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    Battery Aadhaar {selectedItem.compliance.aadhaar && <CheckCircle2 size={12} />}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${selectedItem.compliance.passport ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    EU Passport {selectedItem.compliance.passport && <CheckCircle2 size={12} />}
                 </span>
              </div>
            </section>

            {/* 4. Actions (Updated with S11 Guards) */}
            <section className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Truck size={16} className="text-brand-500" />
                        Dispatch Lifecycle Operations
                    </h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                       ACTIVE: {s11Context.dispatchStatus}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Prepare Dispatch */}
                    <div className="flex flex-col">
                        <button 
                            disabled={!prepareDispatchState.enabled}
                            onClick={handlePrepareDispatch}
                            className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                            title={prepareDispatchState.reason}
                        >
                            <Bookmark size={16} />
                            Prepare Dispatch
                        </button>
                        {!prepareDispatchState.enabled && <DisabledHint reason={prepareDispatchState.reason || 'Blocked'} className="mx-auto" />}
                    </div>

                    {/* Handover to Logistics */}
                    <div className="flex flex-col">
                        <button 
                            disabled={!handoverState.enabled}
                            onClick={handleHandover}
                            className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                            title={handoverState.reason}
                        >
                            <Box size={16} />
                            Handover to Logistics
                        </button>
                        {!handoverState.enabled && <DisabledHint reason={handoverState.reason || 'Blocked'} className="mx-auto" />}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {/* Confirm Transit */}
                    <div className="flex flex-col">
                        <button 
                            disabled={!confirmTransitState.enabled} 
                            onClick={handleConfirmTransit}
                            className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-md font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 transition-colors"
                            title={confirmTransitState.reason}
                        >
                            <Truck size={14} />
                            <span>Confirm Transit</span>
                        </button>
                        {!confirmTransitState.enabled && <DisabledHint reason={confirmTransitState.reason || 'Blocked'} className="mx-auto" />}
                    </div>

                    {/* Confirm Delivery */}
                    <div className="flex flex-col">
                        <button 
                            disabled={!confirmDeliveryState.enabled} 
                            onClick={handleConfirmDelivery}
                            className="w-full bg-green-50 text-green-700 border border-green-200 py-2 rounded-md font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 transition-colors"
                            title={confirmDeliveryState.reason}
                        >
                            <UserCheck size={14} />
                            <span>Confirm Delivery</span>
                        </button>
                        {!confirmDeliveryState.enabled && <DisabledHint reason={confirmDeliveryState.reason || 'Blocked'} className="mx-auto" />}
                    </div>

                    {/* Close Custody */}
                    <div className="flex flex-col">
                        <button 
                            disabled={!closeCustodyState.enabled}
                            onClick={handleCloseCustody} 
                            className="w-full bg-slate-100 text-slate-700 border border-slate-200 py-2 rounded-md font-bold text-xs flex flex-col items-center justify-center gap-1 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                            title={closeCustodyState.reason}
                        >
                            <Stamp size={14} />
                            <span>Close Custody</span>
                        </button>
                        {!closeCustodyState.enabled && <DisabledHint reason={closeCustodyState.reason || 'Blocked'} className="mx-auto" />}
                    </div>
                </div>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
