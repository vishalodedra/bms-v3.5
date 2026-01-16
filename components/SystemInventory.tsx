import React, { useState, useContext, useMemo } from 'react';
import { UserContext, UserRole } from '../types';
import { 
  Box, 
  Layers, 
  Battery, 
  Database, 
  PackageCheck, 
  Truck, 
  Search, 
  Filter, 
  ArrowLeft, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Eye, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

// --- MOCK DATA STRUCTURES ---

interface InventoryCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  count: number;
  statusMix: {
    good: number;
    hold: number;
    blocked: number;
  };
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  location: string;
  status: 'Good' | 'Hold' | 'Blocked';
  age: string;
  batchRef: string;
  exceptionRef?: string;
}

// --- MOCK DATA ---

const CATEGORIES: InventoryCategory[] = [
  {
    id: 'cells',
    label: 'Cells & Raw Material',
    description: 'Inbound raw cells, thermal pads, and electronics.',
    icon: Database,
    count: 15420,
    statusMix: { good: 14200, hold: 1100, blocked: 120 },
    trend: 'up',
    color: 'text-blue-600'
  },
  {
    id: 'modules',
    label: 'WIP Modules',
    description: 'Assembled modules pending QA or Pack Integration.',
    icon: Layers,
    count: 350,
    statusMix: { good: 300, hold: 10, blocked: 40 },
    trend: 'stable',
    color: 'text-purple-600'
  },
  {
    id: 'packs',
    label: 'WIP Packs',
    description: 'Packs in assembly or final review.',
    icon: Battery,
    count: 85,
    statusMix: { good: 80, hold: 5, blocked: 0 },
    trend: 'down',
    color: 'text-brand-600'
  },
  {
    id: 'finished',
    label: 'Finished Goods',
    description: 'Finalized units ready for dispatch.',
    icon: PackageCheck,
    count: 450,
    statusMix: { good: 450, hold: 0, blocked: 0 },
    trend: 'up',
    color: 'text-green-600'
  },
  {
    id: 'deployed',
    label: 'Deployed Fleet',
    description: 'Reference only - assets in field custody.',
    icon: Truck,
    count: 850,
    statusMix: { good: 820, hold: 0, blocked: 30 }, // Blocked here means service alert
    trend: 'up',
    color: 'text-slate-500'
  }
];

const MOCK_ITEMS: Record<string, InventoryItem[]> = {
  'cells': Array.from({ length: 15 }).map((_, i) => ({
    id: `CELL-2026-${1000 + i}`,
    sku: i % 3 === 0 ? 'CELL-LFP-21700' : 'CELL-NMC-PRIS',
    location: `Zone A - Rack ${Math.floor(i / 5) + 1}`,
    status: i === 0 ? 'Blocked' : i === 1 ? 'Hold' : 'Good',
    age: `${i + 1} days`,
    batchRef: `BATCH-INB-${100 + i}`,
    exceptionRef: i === 0 ? 'EX-QC-FAIL' : undefined
  })),
  'modules': Array.from({ length: 10 }).map((_, i) => ({
    id: `MOD-2026-A-${500 + i}`,
    sku: 'MOD-LFP-16S',
    location: 'Line A - Buffer',
    status: i === 2 ? 'Blocked' : 'Good',
    age: `${i * 4} hours`,
    batchRef: `BATCH-MFG-${200 + i}`,
    exceptionRef: i === 2 ? 'EX-SEAL-FAIL' : undefined
  })),
  'packs': Array.from({ length: 8 }).map((_, i) => ({
    id: `PCK-2026-B-${800 + i}`,
    sku: 'BP-LFP-48V-2.5K',
    location: 'Line B - EOL',
    status: i === 4 ? 'Hold' : 'Good',
    age: `${i * 2} hours`,
    batchRef: `BATCH-PCK-${300 + i}`
  })),
  'finished': Array.from({ length: 12 }).map((_, i) => ({
    id: `FG-2026-${9000 + i}`,
    sku: 'BP-LFP-48V-2.5K',
    location: 'Warehouse - Zone C',
    status: 'Good',
    age: `${i + 2} days`,
    batchRef: `BATCH-PCK-${300 + i}`
  })),
  'deployed': Array.from({ length: 5 }).map((_, i) => ({
    id: `ASSET-${7000 + i}`,
    sku: 'BP-NMC-800V-75K',
    location: 'Customer: EcoRide',
    status: i === 0 ? 'Blocked' : 'Good',
    age: `${30 + i} days`,
    batchRef: `BATCH-PCK-${100 + i}`,
    exceptionRef: i === 0 ? 'SVC-ALERT-01' : undefined
  }))
};

// --- OPTIMIZED ROW COMPONENT ---
const InventoryRow = React.memo<{ item: InventoryItem }>(({ item }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-3 font-mono text-slate-700 font-medium">{item.id}</td>
    <td className="px-6 py-3 text-slate-600">{item.sku}</td>
    <td className="px-6 py-3 text-slate-500 flex items-center gap-1">
        <MapPin size={12} /> {item.location}
    </td>
    <td className="px-6 py-3 font-mono text-xs text-slate-500">{item.batchRef}</td>
    <td className="px-6 py-3 text-slate-500 flex items-center gap-1">
        <Clock size={12} /> {item.age}
    </td>
    <td className="px-6 py-3">
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border flex w-fit items-center gap-1 ${
            item.status === 'Good' ? 'bg-green-50 text-green-700 border-green-200' :
            item.status === 'Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-red-50 text-red-700 border-red-200'
        }`}>
            {item.status === 'Good' && <CheckCircle2 size={12} />}
            {item.status === 'Hold' && <AlertTriangle size={12} />}
            {item.status === 'Blocked' && <AlertOctagon size={12} />}
            {item.status}
        </span>
    </td>
    <td className="px-6 py-3">
        {item.status !== 'Good' && item.exceptionRef && (
            <button className="text-xs text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1">
                View Exception <ArrowRight size={10} />
            </button>
        )}
        {item.status === 'Good' && <span className="text-xs text-slate-300">--</span>}
    </td>
  </tr>
));

// --- COMPONENTS ---

export const SystemInventory: React.FC = () => {
  const { role } = useContext(UserContext);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isOperator = role === UserRole.OPERATOR;
  const isAuditor = role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE;
  const isSupervisor = role === UserRole.SUPERVISOR || role === UserRole.QA_ENGINEER;

  // Optimized Filter Logic using useMemo
  const activeItems = useMemo(() => {
    if (!selectedCategoryId) return [];
    const items = MOCK_ITEMS[selectedCategoryId] || [];
    if (!searchQuery) return items;
    return items.filter(item => 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchRef.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedCategoryId, searchQuery]);

  const selectedCategory = useMemo(() => 
    CATEGORIES.find(c => c.id === selectedCategoryId), 
  [selectedCategoryId]);

  const handleCardClick = (id: string) => {
    setSelectedCategoryId(id);
    setSearchQuery('');
  };

  const handleCloseDrill = () => {
    setSelectedCategoryId(null);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Stock
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Box className="text-brand-600" size={24} />
             System-Level Inventory
           </h1>
           <p className="text-slate-500 text-sm mt-1">Consolidated material resources across lifecycle stages.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Track vs Trace Helper */}
            <div className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded border border-slate-200 text-xs hidden sm:flex items-center gap-2">
                <Info size={14} className="text-blue-500" />
                <span>Inventory reflects <strong>Operational State (TRACK)</strong>. Trace registry remains authoritative for identity.</span>
            </div>

            {isAuditor && (
                <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded border border-slate-700 text-xs font-bold uppercase flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Read-Only Snapshot
                </div>
            )}
        </div>
      </div>

      {/* VIEW: DRILL DOWN (Detail) */}
      {selectedCategoryId && selectedCategory ? (
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden animate-in slide-in-from-right-4 duration-300">
            {/* Drill Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleCloseDrill}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <selectedCategory.icon className={selectedCategory.color} size={20} />
                            {selectedCategory.label}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span>Total: <span className="font-bold">{selectedCategory.count.toLocaleString()}</span></span>
                            <span className="w-px h-3 bg-slate-300"></span>
                            <span className="text-green-600 font-medium">Good: {selectedCategory.statusMix.good.toLocaleString()}</span>
                            <span className="w-px h-3 bg-slate-300"></span>
                            <span className="text-amber-600 font-medium">Hold: {selectedCategory.statusMix.hold.toLocaleString()}</span>
                            <span className="w-px h-3 bg-slate-300"></span>
                            <span className="text-red-600 font-medium">Blocked: {selectedCategory.statusMix.blocked.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* Search / Filter */}
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Filter by ID, SKU, Batch..." 
                        className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 pl-9 focus:outline-none focus:border-brand-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
            </div>

            {/* Drill Table */}
            <div className="flex-1 overflow-x-auto p-0">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Item ID</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">SKU / Type</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Batch Ref</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Age</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activeItems.length > 0 ? (
                            activeItems.map((item) => (
                                <InventoryRow key={item.id} item={item} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                                    No items found matching your filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        /* VIEW: SUMMARY GRID */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto min-h-0">
            {CATEGORIES.map((cat) => (
                <div 
                    key={cat.id}
                    onClick={() => handleCardClick(cat.id)}
                    /* Density Adjustment: p-6 -> p-5 */
                    className="bg-white rounded-lg shadow-sm border border-industrial-border p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group flex flex-col"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-lg bg-slate-50 ${cat.color} group-hover:bg-brand-50 transition-colors`}>
                            <cat.icon size={24} />
                        </div>
                        {(!isOperator) && (
                            <div className={`flex items-center gap-1 text-xs font-bold uppercase ${
                                cat.trend === 'up' ? 'text-green-600' : 
                                cat.trend === 'down' ? 'text-slate-400' : 'text-blue-500'
                            }`}>
                                <TrendingUp size={14} className={cat.trend === 'down' ? 'rotate-180' : ''} />
                                {cat.trend === 'stable' ? 'Stable' : 'Trend'}
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-brand-700 transition-colors">
                        {cat.label}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 h-8">{cat.description}</p>
                    
                    <div className="mt-auto">
                        <div className="text-3xl font-mono font-bold text-slate-900 mb-4">
                            {cat.count.toLocaleString()}
                        </div>
                        
                        {/* Status Mix Bar */}
                        <div className="flex h-2 rounded-full overflow-hidden mb-2 bg-slate-100">
                            <div 
                                className="bg-green-500" 
                                style={{ width: `${(cat.statusMix.good / cat.count) * 100}%` }} 
                                title={`Good: ${cat.statusMix.good}`}
                            />
                            <div 
                                className="bg-amber-400" 
                                style={{ width: `${(cat.statusMix.hold / cat.count) * 100}%` }} 
                                title={`Hold: ${cat.statusMix.hold}`}
                            />
                            <div 
                                className="bg-red-500" 
                                style={{ width: `${(cat.statusMix.blocked / cat.count) * 100}%` }} 
                                title={`Blocked: ${cat.statusMix.blocked}`}
                            />
                        </div>
                        
                        {(isSupervisor || isAuditor) && (
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span>{cat.statusMix.good.toLocaleString()} OK</span>
                                {(cat.statusMix.hold > 0 || cat.statusMix.blocked > 0) && (
                                    <span className="text-amber-600">
                                        {cat.statusMix.hold + cat.statusMix.blocked} Exceptions
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-3 shrink-0">
         <Database className="text-amber-600 mt-0.5" size={16} />
         <div>
            <h4 className="text-xs font-bold text-amber-800 uppercase">Backend Logic Responsibility</h4>
            <p className="text-xs text-amber-700 mt-0.5">
               Operational inventory logic (FIFO, reservation locking, batch allocation) is handled by the backend BPM engine.
               This view aggregates data from multiple microservices (WMS, MES, ERP).
            </p>
         </div>
      </div>

    </div>
  );
};