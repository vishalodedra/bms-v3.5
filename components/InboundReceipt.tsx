import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Truck, 
  Package, 
  Barcode, 
  ClipboardCheck, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  List,
  Database,
  History,
  Play,
  Save,
  Search,
  Radar,
  CalendarClock
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS3Context, S3Context } from '../stages/s3/s3Contract';
import { getS3ActionState, S3ActionId } from '../stages/s3/s3Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data Types
interface Shipment {
  id: string;
  shipmentId: string;
  supplier: string;
  materialType: 'Cells' | 'BMS' | 'Mechanical' | 'Thermal';
  expectedQty: number;
  receivedQty: number;
  status: 'Pending' | 'Receiving' | 'Received' | 'QC Hold';
  poRef: string;
  arrivalDate: string;
}

interface MockSerial {
  sn: string;
  batch: string;
}

// Mock Data
const SHIPMENTS: Shipment[] = [
  { 
    id: 'shp-001', 
    shipmentId: 'INB-2026-0042', 
    supplier: 'CellGlobal Dynamics', 
    materialType: 'Cells', 
    expectedQty: 5000, 
    receivedQty: 0,
    status: 'Pending',
    poRef: 'PO-9921',
    arrivalDate: '2026-01-11 08:30'
  },
  { 
    id: 'shp-002', 
    shipmentId: 'INB-2026-0043', 
    supplier: 'Orion BMS Systems', 
    materialType: 'BMS', 
    expectedQty: 200, 
    receivedQty: 200,
    status: 'Received', // Ready for QC
    poRef: 'PO-9925',
    arrivalDate: '2026-01-10 14:15'
  },
  { 
    id: 'shp-003', 
    shipmentId: 'INB-2026-0038', 
    supplier: 'ThermalWrap Inc', 
    materialType: 'Thermal', 
    expectedQty: 1000, 
    receivedQty: 950,
    status: 'QC Hold',
    poRef: 'PO-9918',
    arrivalDate: '2026-01-09 09:00'
  }
];

const MOCK_SERIALS: MockSerial[] = Array.from({ length: 15 }).map((_, i) => ({
  sn: `CELL-2026-${String(8842 + i).padStart(4, '0')}`,
  batch: 'BAT-001-A'
}));

interface InboundReceiptProps {
  onNavigate?: (view: NavView) => void;
}

export const InboundReceipt: React.FC<InboundReceiptProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedShipment, setSelectedShipment] = useState<Shipment>(SHIPMENTS[0]);
  
  // Local State for S3 Context Simulation
  const [s3Context, setS3Context] = useState<S3Context>(getMockS3Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S3'));
  }, []);

  // Helper to resolve action state
  const getAction = (actionId: S3ActionId) => getS3ActionState(role, s3Context, actionId);

  // Action Handlers
  const handleRecordReceipt = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS3Context(prev => ({ 
        ...prev, 
        inboundStatus: 'INSPECTION',
        lastReceiptAt: now,
        lotsAwaitingInspectionCount: prev.lotsAwaitingInspectionCount + 1
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S3',
        actionId: 'RECORD_RECEIPT',
        actorRole: role,
        message: `Registered arrival for ${selectedShipment.shipmentId} (Gate Entry)`
      });
      setLocalEvents(prev => [evt, ...prev]);
      
      // Update local shipment state for UI feedback
      setSelectedShipment(prev => ({ ...prev, status: 'Received', receivedQty: prev.expectedQty }));
      setIsSimulating(false);
    }, 800);
  };

  const handleStartInspection = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Transition from Inspection to Serialization
      setS3Context(prev => ({ 
        ...prev, 
        inboundStatus: 'SERIALIZATION',
        lotsAwaitingInspectionCount: Math.max(0, prev.lotsAwaitingInspectionCount - 1),
        itemsAwaitingSerializationCount: prev.itemsAwaitingSerializationCount + 5000
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S3',
        actionId: 'COMPLETE_INSPECTION',
        actorRole: role,
        message: 'Inbound QC completed. Lot released for serialization.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleSerialization = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS3Context(prev => ({ 
        ...prev, 
        inboundStatus: 'STORED',
        itemsAwaitingSerializationCount: 0,
        serializedItemsCount: prev.serializedItemsCount + 5000
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S3',
        actionId: 'START_SERIALIZATION',
        actorRole: role,
        message: 'Generated 5000 Unique Cell IDs. Inventory updated.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1200);
  };

  const handleMoveToStorage = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS3Context(prev => ({ 
        ...prev, 
        inboundStatus: 'AWAITING_RECEIPT', // Cycle resets for next shipment
        inboundShipmentCount: Math.max(0, prev.inboundShipmentCount - 1)
      }));
      
      const evt = emitAuditEvent({
        stageId: 'S3',
        actionId: 'MOVE_TO_STORAGE',
        actorRole: role,
        message: 'Pallets moved to Zone A (Rack 4). GRN Closed.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  // Navigation Handlers
  const handleNavToS4 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S3',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S4: Batch Planning from S3 Next Step panel'
      });
      onNavigate('batch_planning');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // Pre-calculate action states
  const recordReceiptState = getAction('RECORD_RECEIPT');
  const startInspectionState = getAction('START_INSPECTION');
  const startSerializationState = getAction('START_SERIALIZATION');
  const moveToStorageState = getAction('MOVE_TO_STORAGE');

  // Next Step Readiness
  const isReadyForNext = s3Context.inboundStatus === 'STORED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.STORES || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.QA_ENGINEER ||
    role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Inbound Receipts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Procurement <span className="text-slate-300">/</span> Inbound Logistics
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Truck className="text-brand-600" size={24} />
             Inbound Receipt & Serialization (S3)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Verify shipments, generate serials, and tag materials for QC.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3">
             <button 
              onClick={handleRecordReceipt}
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 transition-colors"
              disabled={!recordReceiptState.enabled || isSimulating}
              title={recordReceiptState.reason}
            >
              <Package size={16} />
              <span>Register New Arrival</span>
            </button>
          </div>
          {!recordReceiptState.enabled && (
             <DisabledHint reason={recordReceiptState.reason || 'Blocked'} className="mt-1" />
          )}
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} /> 
            <span>Pending: {s3Context.inboundShipmentCount}</span>
            <span className="text-slate-300">|</span>
            <span className={`font-bold ${s3Context.inboundStatus === 'AWAITING_RECEIPT' ? 'text-blue-600' : 
              s3Context.inboundStatus === 'STORED' ? 'text-green-600' : 'text-amber-600'}`}>
              {s3Context.inboundStatus}
            </span>
          </div>
        </div>
      </div>

      <StageStateBanner stageId="S3" />
      <PreconditionsPanel stageId="S3" />

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-6 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S3 Activity (Session)
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
                ? "Inbound processing complete. Materials are stored and available for production planning (S4)." 
                : "Pending completion. Finish inspection and serialization to release inventory for planning."}
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
               onClick={handleNavToS4} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <CalendarClock size={14} /> Go to S4: Batch Planning
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Inbound Not Stored</span>
             )}
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`flex-1 grid grid-cols-12 gap-6 min-h-0 ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
        
        {/* Left Col: Shipment List */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <List size={16} />
               Inbound Manifest
             </h3>
             <span className="text-xs text-slate-400">Today's Arrivals</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {SHIPMENTS.map((shipment) => (
              <div 
                key={shipment.id} 
                onClick={() => setSelectedShipment(shipment)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedShipment.id === shipment.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{shipment.shipmentId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    shipment.status === 'Received' ? 'bg-green-100 text-green-700' :
                    shipment.status === 'QC Hold' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{shipment.supplier}</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="bg-slate-100 px-1 rounded text-slate-600 font-mono">{shipment.materialType}</span>
                  <span className="text-slate-400">PO: {shipment.poRef}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Processing Detail */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-900">{selectedShipment.shipmentId}</h2>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={12} />
                  <span>Arrived: {selectedShipment.arrivalDate}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500">Supplier: <span className="font-medium text-slate-700">{selectedShipment.supplier}</span></p>
            </div>
            
             {/* QC Status Indicator */}
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-right">
                   <div className="text-[10px] text-slate-400 uppercase font-bold">Process State</div>
                   <div className="text-xs font-bold text-slate-700">
                     {s3Context.inboundStatus}
                   </div>
                </div>
                {s3Context.inboundStatus === 'STORED' ? <CheckCircle2 className="text-green-500" size={24} /> :
                 s3Context.inboundStatus === 'SERIALIZATION' ? <Barcode className="text-brand-500" size={24} /> :
                 s3Context.inboundStatus === 'INSPECTION' ? <ClipboardCheck className="text-amber-500" size={24} /> :
                 <Truck className="text-slate-400" size={24} />}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Verification Section */}
            <section className={`bg-slate-50 rounded-lg border border-slate-200 p-4 transition-opacity ${recordReceiptState.enabled ? 'opacity-100' : 'opacity-60'}`}>
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <ClipboardCheck size={16} className="text-brand-500" />
                 Quantity Verification & QC
               </h3>
               <div className="grid grid-cols-3 gap-6">
                 <div>
                    <div className="text-xs text-slate-500 mb-1">Expected Qty</div>
                    <div className="text-lg font-bold text-slate-900">{selectedShipment.expectedQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span></div>
                 </div>
                 <div>
                    <div className="text-xs text-slate-500 mb-1">Received Qty</div>
                    <div className={`text-lg font-bold ${selectedShipment.receivedQty < selectedShipment.expectedQty ? 'text-amber-600' : 'text-green-600'}`}>
                      {selectedShipment.receivedQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end justify-end">
                    <button 
                      onClick={handleStartInspection}
                      disabled={!startInspectionState.enabled}
                      className="w-full bg-white border border-slate-300 text-slate-700 text-sm font-medium py-2 rounded shadow-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      title={startInspectionState.reason}
                    >
                      <CheckCircle2 size={14} />
                      Verify & Release
                    </button>
                    {!startInspectionState.enabled && <DisabledHint reason={startInspectionState.reason || 'Blocked'} className="mt-1" />}
                 </div>
               </div>
            </section>

            {/* 2. Serialization Panel */}
            <section className={`border border-industrial-border rounded-lg overflow-hidden transition-opacity ${startSerializationState.enabled ? 'opacity-100' : 'opacity-60'}`}>
               <div className="bg-slate-50 p-3 border-b border-industrial-border flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Barcode size={16} className="text-brand-500" />
                    Serialization (Trace Handoff)
                  </h3>
                  <div className="flex flex-col items-end">
                    <button 
                      onClick={handleSerialization}
                      disabled={!startSerializationState.enabled}
                      className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded hover:bg-brand-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      title={startSerializationState.reason}
                    >
                      <span>Generate Serials</span>
                      <ArrowRight size={12} />
                    </button>
                    {!startSerializationState.enabled && <DisabledHint reason={startSerializationState.reason || 'Blocked'} nextActionHint="Check QC" />}
                  </div>
               </div>
               
               {/* Serial List Visualization */}
               <div className="max-h-64 overflow-y-auto bg-slate-100 p-4">
                  {s3Context.inboundStatus === 'AWAITING_RECEIPT' || s3Context.inboundStatus === 'INSPECTION' ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="bg-white p-3 rounded-full mb-3 shadow-sm border border-slate-200">
                        <Barcode className="text-slate-300" size={24} />
                      </div>
                      <h3 className="text-slate-700 font-medium text-sm mb-1">Awaiting Serialization</h3>
                      <p className="text-slate-500 text-xs mb-3 max-w-xs">
                        Serials will be generated after QC verification is complete.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {MOCK_SERIALS.map((s, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded p-2 flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                          <Barcode size={14} className="text-slate-300" />
                          <div>
                            <div className="font-mono text-xs font-bold text-slate-700">{s.sn}</div>
                            <div className="text-[10px] text-slate-400">{s.batch}</div>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-3 text-center text-xs text-slate-400 mt-2">
                        ... {selectedShipment.expectedQty - 15} more serials generated ...
                      </div>
                    </div>
                  )}
               </div>
            </section>

            {/* 3. Storage Action (Final Step) */}
            <section className={`border-t border-slate-100 pt-4 flex justify-end transition-opacity ${moveToStorageState.enabled ? 'opacity-100' : 'opacity-40'}`}>
                <button 
                  onClick={handleMoveToStorage}
                  disabled={!moveToStorageState.enabled}
                  className="bg-green-600 text-white px-6 py-2 rounded-md font-bold text-sm shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={moveToStorageState.reason}
                >
                  <Save size={16} />
                  Close GRN & Move to Storage
                </button>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
