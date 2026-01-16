import React, { useContext, useState } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  ShieldAlert, 
  Package, 
  Box, 
  Layers, 
  ArrowRight, 
  Plus, 
  Lock, 
  Printer, 
  Search, 
  Scale, 
  Barcode,
  Container,
  Archive,
  CheckSquare
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';

// Mock Data Types
interface UnpackedItem {
  id: string;
  packId: string;
  sku: string;
  location: string;
  status: 'Unpacked';
}

interface PackagingUnit {
  id: string;
  unitId: string;
  type: 'Box' | 'Crate' | 'Pallet';
  maxCapacity: number;
  currentItems: UnpackedItem[];
  status: 'Open' | 'Sealed' | 'Labeled';
  weight: string;
}

// Mock Data
const UNPACKED_QUEUE: UnpackedItem[] = [
  { id: 'p-001', packId: 'PCK-2026-001-005', sku: 'BP-LFP-48V-2.5K', location: 'Zone A - Rack 04', status: 'Unpacked' },
  { id: 'p-002', packId: 'PCK-2026-001-008', sku: 'BP-LFP-48V-2.5K', location: 'Zone A - Rack 04', status: 'Unpacked' },
  { id: 'p-003', packId: 'PCK-2026-002-001', sku: 'BP-NMC-800V-75K', location: 'Zone B - Cage', status: 'Unpacked' },
];

const ACTIVE_UNIT: PackagingUnit = {
  id: 'unit-001',
  unitId: 'PLT-2026-0042',
  type: 'Pallet',
  maxCapacity: 4,
  currentItems: [
    { id: 'p-004', packId: 'PCK-2026-001-012', sku: 'BP-LFP-48V-2.5K', location: 'Staged', status: 'Unpacked' }
  ],
  status: 'Open',
  weight: '45.2 kg'
};

export const PackagingAggregation: React.FC = () => {
  const { role } = useContext(UserContext);
  const [selectedPack, setSelectedPack] = useState<UnpackedItem | null>(null);

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.STORES || 
    role === UserRole.LOGISTICS || 
    role === UserRole.SUPERVISOR || 
    role === UserRole.MANAGEMENT;

  const isReadOnly = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Packaging & Aggregation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Logistics <span className="text-slate-300">/</span> Packaging
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Package className="text-brand-600" size={24} />
             Packaging & Aggregation (S12)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Aggregate packs into shipping units, generate manifests, and seal containers.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">
             <Scale size={14} className="text-slate-500" />
             <span>SCALE: 0.00 kg</span>
        </div>
      </div>

      <StageStateBanner stageId="S12" />
      <PreconditionsPanel stageId="S12" />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Queue */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <Archive size={16} />
               Unpacked Inventory
             </h3>
             <span className="text-xs text-slate-400">Available for Aggregation</span>
          </div>
          <div className="p-3 border-b border-slate-100">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan Pack ID..." 
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                  disabled={isReadOnly}
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
             </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {UNPACKED_QUEUE.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedPack(item)}
                className={`p-3 rounded-md cursor-pointer border transition-all ${
                  selectedPack?.id === item.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-sm">{item.packId}</span>
                  <Box size={14} className="text-slate-400" />
                </div>
                <div className="text-xs text-slate-500 mb-1">{item.sku}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ArrowRight size={10} />
                  {item.location}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Packaging Workstation */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-50 rounded border border-blue-100">
                    <Container size={24} className="text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{ACTIVE_UNIT.unitId}</h2>
                    <p className="text-xs text-slate-500 font-mono">Type: {ACTIVE_UNIT.type}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Capacity</div>
                <div className="text-lg font-bold text-slate-700">
                    {ACTIVE_UNIT.currentItems.length} <span className="text-sm text-slate-400 font-normal">/ {ACTIVE_UNIT.maxCapacity} Slots</span>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Visualizer */}
            <section className="bg-slate-50 rounded-lg p-6 border border-slate-200 flex flex-col items-center justify-center min-h-[200px]">
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                     {/* Render filled slots */}
                     {ACTIVE_UNIT.currentItems.map(item => (
                         <div key={item.id} className="bg-white border-2 border-green-500 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                            <Box size={32} className="text-green-600 mb-2" />
                            <span className="text-xs font-bold text-slate-700">{item.packId}</span>
                            <span className="text-[10px] text-slate-400">Slotted</span>
                         </div>
                     ))}
                     
                     {/* Render empty slots */}
                     {Array.from({ length: ACTIVE_UNIT.maxCapacity - ACTIVE_UNIT.currentItems.length }).map((_, i) => (
                         <div key={i} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center">
                            <Plus size={32} className="text-slate-300 mb-2" />
                            <span className="text-xs font-bold text-slate-400">Empty Slot</span>
                            <span className="text-[10px] text-slate-400">Ready</span>
                         </div>
                     ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                   <Scale size={14} />
                   Current Gross Weight: <span className="font-mono font-bold text-slate-700">{ACTIVE_UNIT.weight}</span>
                </div>
            </section>

            {/* 2. Manifest */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={16} className="text-brand-500" />
                Package Manifest
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Item ID</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">SKU</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {ACTIVE_UNIT.currentItems.map(item => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 font-mono text-slate-800">{item.packId}</td>
                                <td className="px-4 py-3 text-slate-500">{item.sku}</td>
                                <td className="px-4 py-3 text-green-600 flex items-center gap-1">
                                    <CheckSquare size={14} />
                                    <span className="text-xs font-bold">Verified</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </section>

            {/* 3. Actions */}
            <section className="pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                    <button 
                        disabled 
                        className="flex-1 bg-brand-600 text-white py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed shadow-sm"
                        title="Demo Mode: Backend locked"
                    >
                        <Plus size={16} />
                        Add Selected Pack
                    </button>
                    <button 
                        disabled 
                        className="flex-1 bg-white border border-slate-300 text-slate-500 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                        title="Demo Mode: Backend locked"
                    >
                        <Lock size={16} />
                        Seal & Finalize
                    </button>
                    <button 
                        disabled 
                        className="flex-1 bg-white border border-slate-300 text-slate-500 py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                        title="Demo Mode: Backend locked"
                    >
                        <Printer size={16} />
                        Print Label
                    </button>
                </div>
                 <p className="text-center text-xs text-slate-400 mt-3">
                    Inventory aggregation is disabled in Frontend-Only Demo Mode.
                </p>
            </section>
            
          </div>
        </div>

      </div>
    </div>
  );
};
