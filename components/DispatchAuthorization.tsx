import React, { useContext, useState } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  ShieldAlert, 
  Truck, 
  Container, 
  MapPin, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ClipboardList, 
  Stamp, 
  FileText, 
  Search, 
  Scale 
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';

// Mock Data Types
interface DispatchUnit {
  id: string;
  unitId: string;
  type: 'Pallet' | 'Crate' | 'Box';
  packCount: number;
  destination: string;
  status: 'Pending' | 'Authorized' | 'On Hold';
  weight: string;
  manifestId: string;
}

// Mock Data
const PENDING_DISPATCH: DispatchUnit[] = [
  {
    id: 'dsp-001',
    unitId: 'PLT-2026-0042',
    type: 'Pallet',
    packCount: 4,
    destination: 'Mumbai Distribution Hub (MDH-01)',
    status: 'Pending',
    weight: '185 kg',
    manifestId: 'MAN-26-00892'
  },
  {
    id: 'dsp-002',
    unitId: 'CRT-2026-0115',
    type: 'Crate',
    packCount: 1,
    destination: 'Delhi Service Center (DSC-04)',
    status: 'On Hold',
    weight: '48 kg',
    manifestId: 'MAN-26-00895'
  },
  {
    id: 'dsp-003',
    unitId: 'PLT-2026-0045',
    type: 'Pallet',
    packCount: 4,
    destination: 'Export Dock - Chennai Port',
    status: 'Pending',
    weight: '182 kg',
    manifestId: 'MAN-26-00901'
  }
];

export const DispatchAuthorization: React.FC = () => {
  const { role } = useContext(UserContext);
  const [selectedUnit, setSelectedUnit] = useState<DispatchUnit>(PENDING_DISPATCH[0]);
  const [notes, setNotes] = useState('');

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.LOGISTICS || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Dispatch Authorization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Logistics <span className="text-slate-300">/</span> Authorization
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Truck className="text-brand-600" size={24} />
             Dispatch Authorization (S13)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Authorize final custody transfer and release shipments.</p>
        </div>
        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded border border-slate-200 text-xs font-mono flex items-center gap-2">
             <MapPin size={14} />
             <span>GATE PASS: ACTIVE</span>
        </div>
      </div>

      <StageStateBanner stageId="S13" />
      <PreconditionsPanel stageId="S13" />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Pending Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Container size={16} />
               Pending Dispatch
             </h3>
             <span className="text-xs text-slate-400">Awaiting Gate Pass Authorization</span>
          </div>
          <div className="p-3 border-b border-slate-100">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan Unit or Manifest ID..." 
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                  disabled={isReadOnly}
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
             </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {PENDING_DISPATCH.map((unit) => (
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
                    unit.status === 'Authorized' ? 'bg-green-100 text-green-700' :
                    unit.status === 'On Hold' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {unit.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2 truncate">{unit.destination}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                   <span className="bg-slate-100 px-1 rounded">{unit.type}</span>
                   <span>{unit.packCount} Packs</span>
                   <span>{unit.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Authorization Workstation */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <Container size={24} className="text-slate-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedUnit.unitId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Manifest: {selectedUnit.manifestId}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Logistics State</div>
                <div className={`text-lg font-bold ${
                    selectedUnit.status === 'Authorized' ? 'text-green-600' :
                    selectedUnit.status === 'On Hold' ? 'text-red-600' : 'text-amber-600'
                }`}>
                    {selectedUnit.status.toUpperCase()}
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Shipment Summary */}
            <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ClipboardList size={16} className="text-brand-500" />
                    Shipment Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex justify-between p-2 bg-white border border-slate-100 rounded">
                      <span className="text-slate-500">Destination</span>
                      <span className="font-medium text-slate-800 text-right w-1/2">{selectedUnit.destination}</span>
                   </div>
                   <div className="flex justify-between p-2 bg-white border border-slate-100 rounded">
                      <span className="text-slate-500">Package Type</span>
                      <span className="font-medium text-slate-800">{selectedUnit.type}</span>
                   </div>
                   <div className="flex justify-between p-2 bg-white border border-slate-100 rounded">
                      <span className="text-slate-500">Content Count</span>
                      <span className="font-medium text-slate-800">{selectedUnit.packCount} Packs</span>
                   </div>
                   <div className="flex justify-between p-2 bg-white border border-slate-100 rounded">
                      <span className="text-slate-500">Gross Weight</span>
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                         <Scale size={14} className="text-slate-400" />
                         {selectedUnit.weight}
                      </div>
                   </div>
                </div>
            </section>

            {/* 2. Compliance Readiness */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileCheck size={16} className="text-brand-500" />
                Compliance & Documents
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                    <CheckCircle2 size={16} />
                    <span>Battery Aadhaar Linked</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold">
                    <CheckCircle2 size={16} />
                    <span>Invoice Generated</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold">
                    <AlertTriangle size={16} />
                    <span>E-Way Bill Drafted</span>
                 </div>
              </div>
            </section>

             {/* 3. Custody Handover Checklist */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-500" />
                Custody Handover Checklist
              </h3>
              <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded hover:bg-slate-50">
                      <div className="h-5 w-5 rounded border-2 border-slate-300 flex items-center justify-center text-white bg-green-500 border-green-500">
                          <CheckCircle2 size={14} />
                      </div>
                      <span className="text-sm text-slate-700">Packaging Integrity Verified (No visible damage)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded hover:bg-slate-50">
                      <div className="h-5 w-5 rounded border-2 border-slate-300 flex items-center justify-center text-white bg-green-500 border-green-500">
                          <CheckCircle2 size={14} />
                      </div>
                      <span className="text-sm text-slate-700">Shipping Labels & Barcodes Readable</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-slate-100 rounded hover:bg-slate-50">
                      <div className="h-5 w-5 rounded border-2 border-slate-300"></div>
                      <span className="text-sm text-slate-500">Gross Weight Matches Manifest (+/- 0.5kg)</span>
                  </div>
              </div>
            </section>

            {/* 4. Authorizer Notes */}
            <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Authorizer Notes (Demo / Temporary)
                </h3>
                <textarea 
                    className="w-full text-sm p-3 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/50 bg-white text-slate-700"
                    rows={2}
                    placeholder="Enter remarks for hold or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isReadOnly}
                />
            </section>

             {/* 5. Actions */}
            <section className="pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-base flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed shadow-sm hover:bg-green-700"
                        title="Demo Mode: Backend locked"
                    >
                        <div className="flex items-center gap-2">
                            <Stamp size={20} />
                            <span>AUTHORIZE DISPATCH</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Generate Gate Pass & Release Custody</span>
                    </button>
                    
                    <button 
                        disabled={isReadOnly || true} 
                        className="flex-1 bg-amber-500 text-white py-4 rounded-lg font-bold text-base flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed shadow-sm hover:bg-amber-600"
                        title="Demo Mode: Backend locked"
                    >
                        <div className="flex items-center gap-2">
                            <XCircle size={20} />
                            <span>PUT ON HOLD</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-80">Flag for Logistics Review</span>
                    </button>
                </div>
                 <p className="text-center text-xs text-slate-400 mt-3">
                    Authorization actions are disabled in Frontend-Only Demo Mode.
                </p>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
