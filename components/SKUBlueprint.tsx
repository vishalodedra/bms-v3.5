
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  Cpu, 
  Battery, 
  Zap, 
  Scale, 
  CheckCircle, 
  AlertCircle,
  FileBadge,
  Globe,
  Settings,
  Box,
  Layers,
  Database,
  GitCommit,
  Edit2,
  Plus,
  History,
  CheckCircle2,
  ArrowRight,
  Radar,
  ShoppingCart,
  Wand2,
  X,
  Search,
  Filter,
  ArrowLeft,
  Grid,
  Wifi,
  MoreVertical,
  Eye,
  FileText,
  ShieldCheck,
  Save,
  Power,
  RotateCcw,
  Ban,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS1Context, S1Context } from '../stages/s1/s1Contract';
import { getS1ActionState, S1ActionId } from '../stages/s1/s1Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';
import { SkuFlowWizard } from '../flows/sku/ui/SkuFlowWizard';
import { apiFetch } from '../services/apiHarness';
import { SKU_FLOW_ENDPOINTS, type SkuFlowInstance } from '../flows/sku';
import { Modal } from './Modal';

// --- Domain Types ---
type BlueprintType = 'SKU' | 'CELL' | 'IOT';
type BlueprintStatus = 'DRAFT' | 'ACTIVE' | 'DEACTIVE';

interface Blueprint {
  id: string;
  code: string;
  name: string;
  type: BlueprintType;
  chemistry?: 'LFP' | 'NMC' | 'LTO';
  formFactor?: 'Prismatic' | 'Cylindrical 21700' | 'Pouch';
  voltage?: string;
  capacity?: string;
  cellsPerModule?: number; // V34-S1-SKU-DEF-41
  status: BlueprintStatus;
  lastUpdated: string;
  compliance: {
    batteryAadhaar: boolean;
    euPassport: boolean;
    bisCertified: boolean;
  };
}

// --- Mock Data (V34-DATA-PRE-MOCK-40) ---
const MOCK_BLUEPRINTS: Blueprint[] = [
  {
    id: 'sku-001',
    code: 'BP-LFP-48V-2.5K',
    name: 'E-Scooter Standard Pack (LFP)',
    type: 'SKU',
    chemistry: 'LFP',
    formFactor: 'Cylindrical 21700',
    voltage: '48V',
    capacity: '2.5 kWh',
    cellsPerModule: 12,
    status: 'ACTIVE',
    lastUpdated: '2026-01-20 09:00',
    compliance: { batteryAadhaar: true, euPassport: false, bisCertified: true }
  },
  {
    id: 'sku-002',
    code: 'BP-LFP-48V-5K',
    name: 'E-Auto Extended Pack (LFP)',
    type: 'SKU',
    chemistry: 'LFP',
    formFactor: 'Cylindrical 21700',
    voltage: '48V',
    capacity: '5.0 kWh',
    cellsPerModule: 24,
    status: 'ACTIVE',
    lastUpdated: '2026-01-20 09:30',
    compliance: { batteryAadhaar: true, euPassport: true, bisCertified: true }
  },
  {
    id: 'cell-001',
    code: 'CELL-LFP-21700-A',
    name: 'Grade A LFP Cell',
    type: 'CELL',
    chemistry: 'LFP',
    formFactor: 'Cylindrical 21700',
    status: 'ACTIVE',
    lastUpdated: '2025-12-15 11:20',
    compliance: { batteryAadhaar: false, euPassport: false, bisCertified: true }
  },
  {
    id: 'iot-001',
    code: 'IOT-BMS-GW-V2',
    name: 'BMS IoT Gateway Module',
    type: 'IOT',
    status: 'ACTIVE',
    lastUpdated: '2026-01-14 16:45',
    compliance: { batteryAadhaar: false, euPassport: false, bisCertified: true }
  }
];

// --- Internal Routing State ---
type InternalRoute = 
  | { view: 'LIST' }
  | { view: 'TYPE_SELECT' }
  | { view: 'CREATE_FORM', type: BlueprintType }
  | { view: 'DETAIL', id: string };

interface SKUBlueprintProps {
  onNavigate?: (view: NavView) => void;
}

export const SKUBlueprint: React.FC<SKUBlueprintProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // Routing State
  const [route, setRoute] = useState<InternalRoute>({ view: 'LIST' });
  
  // Data State
  const [blueprints, setBlueprints] = useState<Blueprint[]>(MOCK_BLUEPRINTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlueprintStatus | 'ALL'>('ALL'); // New Filter State
  const [s1Context, setS1Context] = useState<S1Context>(getMockS1Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    bpId: string | null;
    bpCode: string;
    newStatus: BlueprintStatus | null;
    currentStatus: BlueprintStatus | null;
  }>({
    isOpen: false,
    bpId: null,
    bpCode: '',
    newStatus: null,
    currentStatus: null
  });

  // Resume capability for SkuFlow
  const [resumeInstanceId, setResumeInstanceId] = useState<string | null>(null);

  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S1'));
  }, []);

  // Filtered List Logic
  const filteredBlueprints = useMemo(() => {
    let filtered = blueprints;

    // 1. Status Filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(bp => bp.status === statusFilter);
    }

    // 2. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(bp => 
        bp.name.toLowerCase().includes(lowerQuery) || 
        bp.code.toLowerCase().includes(lowerQuery) ||
        bp.type.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  }, [blueprints, searchQuery, statusFilter]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search or filter change
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredBlueprints.length / itemsPerPage);
  const paginatedBlueprints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBlueprints.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBlueprints, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Helper to resolve action state
  const getAction = (actionId: S1ActionId) => getS1ActionState(role, s1Context, actionId);
  const createSkuState = getAction('CREATE_SKU');

  // Navigation Helpers
  const goToList = () => setRoute({ view: 'LIST' });
  const goToTypeSelect = () => setRoute({ view: 'TYPE_SELECT' });
  const goToCreate = (type: BlueprintType) => setRoute({ view: 'CREATE_FORM', type });
  const goToDetail = (id: string) => {
    emitAuditEvent({
        stageId: 'S1',
        actionId: 'VIEW_BLUEPRINT', // Mapped to VIEW policy
        actorRole: role,
        message: `Viewed blueprint detail for ${id}`
    });
    setRoute({ view: 'DETAIL', id });
  };

  const handleAddNewBlueprint = (bp: Blueprint) => {
    setBlueprints(prev => [bp, ...prev]);
    setCurrentPage(1); // Ensure visibility
    // Emit event
    const evt = emitAuditEvent({
      stageId: 'S1',
      actionId: 'CREATE_SKU', // Reuse action ID for simplicity
      actorRole: role,
      message: `Created new ${bp.type} Blueprint: ${bp.code}`
    });
    setLocalEvents(prev => [evt, ...prev]);
    goToList();
  };

  // 1. Request Change (Opens Modal)
  const handleStatusChangeRequest = (id: string, code: string, currentStatus: BlueprintStatus, newStatus: BlueprintStatus) => {
    setConfirmState({
      isOpen: true,
      bpId: id,
      bpCode: code,
      currentStatus,
      newStatus
    });
  };

  // 2. Execute Change (Confirmed)
  const confirmStatusChange = () => {
    if (!confirmState.bpId || !confirmState.newStatus) return;

    const { bpId, newStatus, currentStatus, bpCode } = confirmState;

    setBlueprints(prev => prev.map(bp => {
        if (bp.id === bpId) {
            // Audit Event (Emitted only on confirmation)
            const evt = emitAuditEvent({
                stageId: 'S1',
                actionId: 'EDIT_BLUEPRINT',
                actorRole: role,
                message: `Status changed for ${bp.code}: ${currentStatus} -> ${newStatus}`
            });
            setLocalEvents(prevEvents => [evt, ...prevEvents]);
            return { ...bp, status: newStatus, lastUpdated: new Date().toLocaleString() };
        }
        return bp;
    }));

    // Close Modal
    setConfirmState({ ...confirmState, isOpen: false });
  };

  // Sequential Code Generation Logic
  const generateNextCode = (baseCode: string, allCodes: string[]): string => {
    let nextCode = '';
    
    // Check if code ends with numbers
    const match = baseCode.match(/(.*?)(\d+)$/);
    
    if (match) {
      // Has numeric suffix: Increment it
      const prefix = match[1];
      const numberPart = match[2];
      const nextNum = parseInt(numberPart, 10) + 1;
      nextCode = `${prefix}${nextNum.toString().padStart(numberPart.length, '0')}`;
    } else {
      // No numeric suffix: Append -001
      nextCode = `${baseCode}-001`;
    }

    // Recursively handle collisions (in case the incremented one also exists)
    while (allCodes.includes(nextCode)) {
      const subMatch = nextCode.match(/(.*?)(\d+)$/);
      if (subMatch) {
        const p = subMatch[1];
        const n = subMatch[2];
        const nextN = parseInt(n, 10) + 1;
        nextCode = `${p}${nextN.toString().padStart(n.length, '0')}`;
      } else {
        // Fallback safety (should rarely reach here if logic holds)
        nextCode = `${nextCode}-001`;
      }
    }

    return nextCode;
  };

  const handleClone = (id: string) => {
    const sourceBp = blueprints.find(bp => bp.id === id);
    if (!sourceBp) return;

    // Get all existing codes to ensure uniqueness
    const allCodes = blueprints.map(b => b.code);
    
    // Generate new code sequentially
    const newCode = generateNextCode(sourceBp.code, allCodes);

    const newBp: Blueprint = {
      ...sourceBp,
      id: `${sourceBp.type.toLowerCase()}-${Date.now()}`,
      code: newCode,
      name: sourceBp.name, // Keep exact name per requirements
      status: 'DRAFT', // Force DRAFT status
      lastUpdated: new Date().toLocaleString(),
      // Keep compliance flags
    };

    setBlueprints(prev => [newBp, ...prev]);
    setCurrentPage(1); // Jump to first page to see the new clone

    // Emit audit event
    const evt = emitAuditEvent({
      stageId: 'S1',
      actionId: 'CREATE_SKU', // Reusing create permission logic
      actorRole: role,
      message: `Cloned blueprint ${sourceBp.code} to ${newBp.code}`
    });
    setLocalEvents(prev => [evt, ...prev]);
  };

  // --- Sub-Components ---

  // 1. Read-Only Detail View
  const BlueprintDetailView: React.FC<{ id: string }> = ({ id }) => {
    const bp = blueprints.find(b => b.id === id);
    if (!bp) return <div className="p-8 text-center text-slate-500">Blueprint not found.</div>;

    const canModifyStatus = (role === UserRole.SYSTEM_ADMIN || role === UserRole.MANAGEMENT || role === UserRole.ENGINEERING);
    const isDraft = bp.status === 'DRAFT';
    const isActive = bp.status === 'ACTIVE';
    const isDeactive = bp.status === 'DEACTIVE';

    return (
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{bp.name}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                bp.type === 'SKU' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                bp.type === 'CELL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{bp.type}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{bp.code}</span>
              <span>Updated: {bp.lastUpdated}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                isActive ? 'bg-green-100 text-green-700 border-green-200' :
                isDraft ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-red-50 text-red-700 border-red-200'
             }`}>
               {bp.status}
             </div>
             
             {/* Status Actions with Confirmation */}
             {canModifyStatus && (
               <div className="flex items-center gap-2">
                 {isDraft && (
                    <button
                        onClick={() => handleStatusChangeRequest(bp.id, bp.code, bp.status, 'ACTIVE')}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors font-bold flex items-center gap-1 shadow-sm"
                    >
                        <Power size={12} /> Activate
                    </button>
                 )}
                 {isActive && (
                    <button
                        onClick={() => handleStatusChangeRequest(bp.id, bp.code, bp.status, 'DEACTIVE')}
                        className="text-xs bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-bold flex items-center gap-1 shadow-sm"
                    >
                        <Ban size={12} /> Deactivate
                    </button>
                 )}
                 {isDeactive && (
                    <span className="text-[10px] text-slate-400 italic">Archived Record</span>
                 )}
               </div>
             )}
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
           {/* Technical Specs */}
           <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Technical Specifications</h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                       <label className="text-[10px] uppercase font-bold text-slate-400">Chemistry</label>
                       <div className="font-medium text-slate-800">{bp.chemistry || 'N/A'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                       <label className="text-[10px] uppercase font-bold text-slate-400">Form Factor</label>
                       <div className="font-medium text-slate-800">{bp.formFactor || 'N/A'}</div>
                    </div>
                    {bp.voltage && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-100">
                         <label className="text-[10px] uppercase font-bold text-slate-400">Nominal Voltage</label>
                         <div className="font-medium text-slate-800">{bp.voltage}</div>
                      </div>
                    )}
                    {bp.capacity && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-100">
                         <label className="text-[10px] uppercase font-bold text-slate-400">Capacity</label>
                         <div className="font-medium text-slate-800">{bp.capacity}</div>
                      </div>
                    )}
                 </div>
              </div>
           </section>
           
           {/* Manufacturing Definition */}
           {bp.type === 'SKU' && (
               <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Manufacturing Definition</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded border border-slate-100">
                           <label className="text-[10px] uppercase font-bold text-slate-400">Cells Per Module</label>
                           <div className="font-medium text-slate-800 font-mono">{bp.cellsPerModule || 'N/A'}</div>
                      </div>
                  </div>
               </section>
           )}

           {/* Regulatory Status */}
           <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Regulatory & Compliance</h3>
              <div className="flex flex-col gap-3">
                 <div className={`flex items-center justify-between p-3 rounded border ${bp.compliance.batteryAadhaar ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                       <FileBadge className={bp.compliance.batteryAadhaar ? 'text-purple-600' : 'text-slate-400'} size={20} />
                       <span className="text-sm font-medium text-slate-700">Battery Aadhaar</span>
                    </div>
                    {bp.compliance.batteryAadhaar ? <CheckCircle2 size={16} className="text-purple-600" /> : <span className="text-xs text-slate-400">N/A</span>}
                 </div>
                 <div className={`flex items-center justify-between p-3 rounded border ${bp.compliance.euPassport ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                       <Globe className={bp.compliance.euPassport ? 'text-blue-600' : 'text-slate-400'} size={20} />
                       <span className="text-sm font-medium text-slate-700">EU Passport</span>
                    </div>
                    {bp.compliance.euPassport ? <CheckCircle2 size={16} className="text-blue-600" /> : <span className="text-xs text-slate-400">N/A</span>}
                 </div>
                 <div className={`flex items-center justify-between p-3 rounded border ${bp.compliance.bisCertified ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                       <ShieldCheck className={bp.compliance.bisCertified ? 'text-green-600' : 'text-slate-400'} size={20} />
                       <span className="text-sm font-medium text-slate-700">BIS / AIS-156</span>
                    </div>
                    {bp.compliance.bisCertified ? <CheckCircle2 size={16} className="text-green-600" /> : <span className="text-xs text-slate-400">Pending</span>}
                 </div>
              </div>
           </section>
        </div>
      </div>
    );
  };

  // 2. Cell Create Form
  const CellBlueprintForm: React.FC<{ onCancel: () => void, onSave: (bp: Blueprint) => void }> = ({ onCancel, onSave }) => {
    const [form, setForm] = useState({
      name: '',
      code: '',
      chemistry: 'LFP',
      capacity: '',
      voltage: '',
      manufacturer: ''
    });

    const handleSave = () => {
      if (!form.name || !form.code || !form.capacity || !form.voltage) return;
      const newBp: Blueprint = {
        id: `cell-${Date.now()}`,
        code: form.code,
        name: form.name,
        type: 'CELL',
        chemistry: form.chemistry as any,
        capacity: form.capacity,
        voltage: form.voltage,
        status: 'DRAFT', // Explicitly DRAFT per requirements
        lastUpdated: new Date().toLocaleString(),
        compliance: { batteryAadhaar: false, euPassport: false, bisCertified: false }
      };
      onSave(newBp);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-6 max-w-2xl mx-auto mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Zap size={20} className="text-purple-600" />
          Create Cell Blueprint
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Cell Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Grade A LFP Cell" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Cell Code <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
              value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. CEL-LFP-21700" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Chemistry</label>
            <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              value={form.chemistry} onChange={e => setForm({...form, chemistry: e.target.value})}>
              <option value="LFP">LFP</option>
              <option value="NMC">NMC</option>
              <option value="LTO">LTO</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Manufacturer</label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
              value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} placeholder="e.g. CellGlobal" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Capacity (Ah) <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
              value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="e.g. 50Ah" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Nominal Voltage (V) <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
              value={form.voltage} onChange={e => setForm({...form, voltage: e.target.value})} placeholder="e.g. 3.2V" />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-purple-600 text-white rounded text-sm font-bold hover:bg-purple-700 shadow-sm flex items-center gap-2">
            <Save size={16} /> Save Blueprint
          </button>
        </div>
      </div>
    );
  };

  // 3. IOT Create Form
  const IotBlueprintForm: React.FC<{ onCancel: () => void, onSave: (bp: Blueprint) => void }> = ({ onCancel, onSave }) => {
    const [form, setForm] = useState({
      name: '',
      code: '',
      type: 'Gateway',
      firmware: '',
      protocol: 'CAN'
    });

    const handleSave = () => {
      if (!form.name || !form.code || !form.firmware) return;
      const newBp: Blueprint = {
        id: `iot-${Date.now()}`,
        code: form.code,
        name: form.name,
        type: 'IOT',
        status: 'DRAFT', // Explicitly DRAFT
        lastUpdated: new Date().toLocaleString(),
        compliance: { batteryAadhaar: false, euPassport: false, bisCertified: false }
      };
      onSave(newBp);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-6 max-w-2xl mx-auto mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Wifi size={20} className="text-amber-600" />
          Create IoT / BMS Blueprint
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Device Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. BMS Master V4" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Device Code <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
              value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. IOT-GW-001" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Device Type</label>
            <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="Gateway">IoT Gateway</option>
              <option value="BMS">BMS Master</option>
              <option value="Sensor">Sensor Node</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Communication</label>
            <select className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              value={form.protocol} onChange={e => setForm({...form, protocol: e.target.value})}>
              <option value="CAN">CAN Bus</option>
              <option value="UART">UART / RS485</option>
              <option value="BLE">Bluetooth LE</option>
              <option value="MQTT">MQTT / WiFi</option>
            </select>
          </div>
          <div className="space-y-2 col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">Firmware Version <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono" 
              value={form.firmware} onChange={e => setForm({...form, firmware: e.target.value})} placeholder="v1.0.0-beta" />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm font-medium">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-amber-600 text-white rounded text-sm font-bold hover:bg-amber-700 shadow-sm flex items-center gap-2">
            <Save size={16} /> Save Blueprint
          </button>
        </div>
      </div>
    );
  };

  // --- Main Render Switch ---

  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.ENGINEERING || 
    role === UserRole.MANAGEMENT ||
    role === UserRole.QA_ENGINEER;

  const isListView = route.view === 'LIST';

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view SKU Blueprints.</p>
      </div>
    );
  }

  // Handle Wizard Logic via Routing
  if (route.view === 'CREATE_FORM' && route.type === 'SKU') {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 shrink-0">
               <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                  <ArrowLeft size={12} /> Cancel & Return to List
               </button>
            </div>
            <div className="flex-1 min-h-0">
                <SkuFlowWizard 
                    instanceId={resumeInstanceId} 
                    onExit={() => {
                        setResumeInstanceId(null);
                        goToList();
                    }} 
                />
            </div>
        </div>
    );
  }

  // Handle simple forms
  if (route.view === 'CREATE_FORM' && route.type !== 'SKU') {
    return (
      <div className="h-full flex flex-col">
         <div className="mb-4 shrink-0">
            <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
               <ArrowLeft size={12} /> Cancel & Return to List
            </button>
         </div>
         <div className="flex-1 min-h-0 overflow-y-auto">
            {route.type === 'CELL' && <CellBlueprintForm onCancel={goToList} onSave={handleAddNewBlueprint} />}
            {route.type === 'IOT' && <IotBlueprintForm onCancel={goToList} onSave={handleAddNewBlueprint} />}
         </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isListView ? '' : 'h-full flex flex-col'} animate-in fade-in duration-300 pb-4`}>
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        title="Confirm Status Change"
        footer={
          <>
            <button 
              onClick={() => setConfirmState({ ...confirmState, isOpen: false })}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button 
              onClick={confirmStatusChange}
              className={`px-4 py-2 text-sm font-bold text-white rounded-md shadow-sm ${
                confirmState.newStatus === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' :
                'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirm {confirmState.newStatus === 'ACTIVE' ? 'Activation' : 'Deactivation'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className={`p-3 rounded-md border flex items-start gap-3 ${
             confirmState.newStatus === 'ACTIVE' ? 'bg-green-50 border-green-200 text-green-800' :
             'bg-red-50 border-red-200 text-red-800'
          }`}>
             {confirmState.newStatus === 'ACTIVE' ? <CheckCircle2 size={20} className="mt-0.5" /> : <Ban size={20} className="mt-0.5" />}
             <div>
               <h4 className="font-bold text-sm">Status Update Required</h4>
               <p className="text-xs mt-1">
                 You are about to change the status of blueprint <strong>{confirmState.bpCode}</strong> from <strong>{confirmState.currentStatus}</strong> to <strong>{confirmState.newStatus}</strong>.
               </p>
             </div>
          </div>
          <p className="text-sm text-slate-600">
            This action will be logged in the audit trail. Are you sure you want to proceed?
          </p>
        </div>
      </Modal>

      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System Setup <span className="text-slate-300">/</span> S1
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Cpu className="text-brand-600" size={24} />
             SKU & Regulatory Blueprint
           </h1>
           <p className="text-slate-500 text-sm mt-1">Define battery chemistry, electrical specs, and regulatory compliance.</p>
        </div>
        
        {/* Navigation Action Area */}
        <div className="flex items-center gap-4">
           {route.view !== 'LIST' && (
              <button 
                onClick={goToList}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                 <ArrowLeft size={14} /> Back to List
              </button>
           )}
           {route.view === 'LIST' && (
              <button 
                disabled={!createSkuState.enabled}
                onClick={goToTypeSelect}
                className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 transition-colors"
                title={createSkuState.reason}
              >
                 <Plus size={16} /> Create Blueprint
              </button>
           )}
        </div>
      </div>

      {/* Stage Context */}
      {route.view === 'LIST' && (
        <div className="shrink-0">
            <StageStateBanner stageId="S1" />
            <PreconditionsPanel stageId="S1" />
        </div>
      )}

      {/* Content Area */}
      <div className={`${isListView ? '' : 'flex-1 min-h-0'} relative`}>
         
         {/* VIEW: LIST */}
         {route.view === 'LIST' && (
            <div className="bg-white rounded-lg shadow-sm border border-industrial-border animate-in fade-in slide-in-from-bottom-2 flex flex-col">
               <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 shrink-0 gap-4">
                  <div className="flex items-center gap-3">
                     <Grid size={16} className="text-slate-400" />
                     <h3 className="font-bold text-slate-700 text-sm">Blueprint Registry</h3>
                     <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{filteredBlueprints.length}</span>
                  </div>
                  <div className="flex gap-2">
                     {/* Status Filter */}
                     <select 
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value as any)}
                       className="text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none bg-white font-medium text-slate-600"
                     >
                       <option value="ALL">All Status</option>
                       <option value="DRAFT">Draft</option>
                       <option value="ACTIVE">Active</option>
                       <option value="DEACTIVE">Deactive</option>
                     </select>

                     <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Search name, code, type..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none w-64" 
                        />
                        <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                     </div>
                     <button className="p-1.5 border border-slate-300 rounded-md text-slate-500 hover:bg-slate-100"><Filter size={14} /></button>
                  </div>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-bold text-xs sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-3 uppercase tracking-wider">ID / Code</th>
                           <th className="px-6 py-3 uppercase tracking-wider">Type</th>
                           <th className="px-6 py-3 uppercase tracking-wider">Name</th>
                           <th className="px-6 py-3 uppercase tracking-wider">Status</th>
                           {/* Removed Last Updated Column */}
                           <th className="px-6 py-3 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {paginatedBlueprints.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                                 No blueprints found matching your search.
                              </td>
                           </tr>
                        ) : (
                           paginatedBlueprints.map(bp => (
                              <tr key={bp.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{bp.code}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                       bp.type === 'SKU' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                       bp.type === 'CELL' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                       'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>{bp.type}</span>
                                 </td>
                                 <td className="px-6 py-4 font-medium text-slate-800">{bp.name}</td>
                                 <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                                       bp.status === 'ACTIVE' ? 'text-green-600' : 
                                       bp.status === 'DRAFT' ? 'text-slate-500' :
                                       'text-red-500'
                                    }`}>
                                       {bp.status === 'ACTIVE' && <CheckCircle2 size={12} />}
                                       {bp.status === 'DEACTIVE' && <Ban size={12} />}
                                       {bp.status}
                                    </span>
                                 </td>
                                 {/* Removed Last Updated Cell */}
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                       <button 
                                          onClick={() => handleClone(bp.id)}
                                          className="text-slate-500 hover:text-brand-600 text-xs font-bold px-2 py-1.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
                                          title="Clone Blueprint"
                                       >
                                          <Copy size={12} />
                                       </button>
                                       <button 
                                          onClick={() => goToDetail(bp.id)}
                                          className="text-brand-600 hover:text-brand-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-brand-50 transition-colors"
                                       >
                                          View
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               {/* Pagination Controls */}
               <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="text-xs text-slate-500">
                     Showing {Math.min(filteredBlueprints.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredBlueprints.length, currentPage * itemsPerPage)} of {filteredBlueprints.length} items
                  </div>
                  <div className="flex items-center gap-2">
                     <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                     >
                        <ChevronLeft size={16} className="text-slate-600" />
                     </button>
                     <span className="text-xs font-medium text-slate-700">
                        Page {currentPage} of {Math.max(1, totalPages)}
                     </span>
                     <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                     >
                        <ChevronRight size={16} className="text-slate-600" />
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* VIEW: COMPACT TYPE SELECTION */}
         {route.view === 'TYPE_SELECT' && (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-200">
               <div className="bg-white p-8 rounded-lg shadow-lg border border-industrial-border w-full max-w-md text-center">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Blueprint</h2>
                  <p className="text-sm text-slate-500 mb-6">Select the component class you wish to define.</p>
                  
                  <div className="grid grid-cols-3 gap-3 mb-8">
                     <button onClick={() => goToCreate('SKU')} className="p-4 rounded border border-slate-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition-all group flex flex-col items-center gap-2">
                        <Battery size={24} className="text-slate-400 group-hover:text-brand-600" />
                        <span className="text-xs font-bold">SKU Pack</span>
                     </button>
                     <button onClick={() => goToCreate('CELL')} className="p-4 rounded border border-slate-200 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all group flex flex-col items-center gap-2">
                        <Zap size={24} className="text-slate-400 group-hover:text-purple-600" />
                        <span className="text-xs font-bold">Cell Spec</span>
                     </button>
                     <button onClick={() => goToCreate('IOT')} className="p-4 rounded border border-slate-200 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-all group flex flex-col items-center gap-2">
                        <Wifi size={24} className="text-slate-400 group-hover:text-amber-600" />
                        <span className="text-xs font-bold">IoT / BMS</span>
                     </button>
                  </div>
                  
                  <button onClick={goToList} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
               </div>
            </div>
         )}

         {/* VIEW: DETAIL */}
         {route.view === 'DETAIL' && route.id && (
            <BlueprintDetailView id={route.id} />
         )}

      </div>
    </div>
  );
};
