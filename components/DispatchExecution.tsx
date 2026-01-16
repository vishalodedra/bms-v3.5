import React, { useContext, useState } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  ShieldAlert, 
  Truck, 
  Container, 
  MapPin, 
  CheckCircle2, 
  UserSquare2, 
  Car, 
  PenTool, 
  ArrowRight,
  ClipboardList,
  Scale,
  LogOut
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';

// Mock Data Types
interface AuthorizedUnit {
  id: string;
  unitId: string;
  gatePassId: string;
  destination: string;
  authorizedBy: string;
  readiness: 'Ready to Load' | 'Loading' | 'Loaded';
  details: {
    packs: number;
    weight: string;
    type: string;
  };
}

// Mock Data
const AUTHORIZED_QUEUE: AuthorizedUnit[] = [
  {
    id: 'auth-001',
    unitId: 'PLT-2026-0042',
    gatePassId: 'GP-2026-8812',
    destination: 'Mumbai Distribution Hub (MDH-01)',
    authorizedBy: 'Logistics Mgr. (R. Singh)',
    readiness: 'Ready to Load',
    details: { packs: 4, weight: '185 kg', type: 'Pallet' }
  },
  {
    id: 'auth-002',
    unitId: 'PLT-2026-0045',
    gatePassId: 'GP-2026-8815',
    destination: 'Export Dock - Chennai Port',
    authorizedBy: 'Logistics Mgr. (R. Singh)',
    readiness: 'Loading',
    details: { packs: 4, weight: '182 kg', type: 'Pallet' }
  },
  {
    id: 'auth-003',
    unitId: 'CRT-2026-0118',
    gatePassId: 'GP-2026-8819',
    destination: 'Bangalore OEM Plant',
    authorizedBy: 'Supervisor (A. Kumar)',
    readiness: 'Ready to Load',
    details: { packs: 1, weight: '48 kg', type: 'Crate' }
  }
];

export const DispatchExecution: React.FC = () => {
  const { role } = useContext(UserContext);
  const [selectedUnit, setSelectedUnit] = useState<AuthorizedUnit>(AUTHORIZED_QUEUE[0]);
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.LOGISTICS || 
    role === UserRole.STORES ||
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Dispatch Execution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Logistics <span className="text-slate-300">/</span> Execution
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Truck className="text-brand-600" size={24} />
             Dispatch Execution (S14)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Execute custody handover, confirm loading, and release shipments.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded border border-green-200 text-xs font-bold flex items-center gap-2">
             <ArrowRight size={14} />
             <span>OUTBOUND DOCK ACTIVE</span>
        </div>
      </div>

      <StageStateBanner stageId="S14" />
      <PreconditionsPanel stageId="S14" />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Container size={16} />
               Authorized Queue
             </h3>
             <span className="text-xs text-slate-400">Gate Pass Issued</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {AUTHORIZED_QUEUE.map((unit) => (
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
                  <span className="font-bold text-slate-800 text-sm">{unit.unitId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    unit.readiness === 'Loading' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {unit.readiness}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-1 truncate">{unit.destination}</div>
                <div className="text-[10px] text-slate-400">
                   Auth By: {unit.authorizedBy}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Execution Workstation */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-green-50 rounded border border-green-100">
                    <LogOut size={24} className="text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedUnit.unitId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Gate Pass: {selectedUnit.gatePassId}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Execution Status</div>
                <div className="text-lg font-bold text-slate-700">
                    {selectedUnit.readiness.toUpperCase()}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Manifest Summary */}
            <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ClipboardList size={16} className="text-brand-500" />
                    Load Manifest
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                   <div className="p-3 bg-white border border-slate-100 rounded">
                      <div className="text-xs text-slate-500 mb-1">Destination</div>
                      <div className="font-medium text-slate-800">{selectedUnit.destination}</div>
                   </div>
                   <div className="p-3 bg-white border border-slate-100 rounded">
                      <div className="text-xs text-slate-500 mb-1">Package Type</div>
                      <div className="font-medium text-slate-800">{selectedUnit.details.type}</div>
                   </div>
                   <div className="p-3 bg-white border border-slate-100 rounded">
                      <div className="text-xs text-slate-500 mb-1">Total Weight</div>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Scale size={12} className="text-slate-400" />
                          {selectedUnit.details.weight}
                      </div>
                   </div>
                </div>
            </section>

            {/* 2. Handover Evidence Panel */}
            <section className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserSquare2 size={16} className="text-brand-500" />
                    Custody Handover Evidence
                  </h3>
              </div>
              <div className="p-4 space-y-4 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Driver Name / ID</label>
                          <div className="relative">
                              <input 
                                  type="text" 
                                  className="w-full text-sm p-2 pl-9 border border-slate-300 rounded focus:outline-none focus:border-brand-500"
                                  placeholder="Enter Driver Name..."
                                  value={driverName}
                                  onChange={(e) => setDriverName(e.target.value)}
                                  disabled={isReadOnly}
                              />
                              <UserSquare2 size={14} className="absolute left-3 top-3 text-slate-400" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Vehicle Registration No.</label>
                          <div className="relative">
                              <input 
                                  type="text" 
                                  className="w-full text-sm p-2 pl-9 border border-slate-300 rounded focus:outline-none focus:border-brand-500 uppercase"
                                  placeholder="XX-00-XX-0000"
                                  value={vehicleNo}
                                  onChange={(e) => setVehicleNo(e.target.value)}
                                  disabled={isReadOnly}
                              />
                              <Car size={14} className="absolute left-3 top-3 text-slate-400" />
                          </div>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Digital Signature (Proof of Handover)</label>
                      <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
                          <PenTool size={24} className="mb-2" />
                          <span className="text-xs">Click to Capture Signature</span>
                      </div>
                  </div>
              </div>
            </section>

             {/* 3. Execution Actions */}
            <section className="pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-white border border-slate-300 text-slate-500 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                        title="Demo Mode: Backend locked"
                    >
                        <Container size={16} />
                        Confirm Loading
                    </button>
                    
                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-brand-600 text-white py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed shadow-sm"
                        title="Demo Mode: Backend locked"
                    >
                        <LogOut size={16} />
                        Handover Custody & Dispatch
                    </button>
                </div>
                 <p className="text-center text-xs text-slate-400 mt-3">
                    Handover execution is disabled in Frontend-Only Demo Mode.
                </p>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
