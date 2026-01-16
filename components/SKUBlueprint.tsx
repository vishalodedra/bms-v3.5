
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
  Save
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

// --- Domain Types ---
type BlueprintType = 'SKU' | 'CELL' | 'IOT';

interface Blueprint {
  id: string;
  code: string;
  name: string;
  type: BlueprintType;
  chemistry?: 'LFP' | 'NMC' | 'LTO';
  formFactor?: 'Prismatic' | 'Cylindrical 21700' | 'Pouch';
  voltage?: string;
  capacity?: string;
  status: 'Draft' | 'Approved' | 'Obsolete' | 'Review';
  lastUpdated: string;
  compliance: {
    batteryAadhaar: boolean;
    euPassport: boolean;
    bisCertified: boolean;
  };
}

// --- Mock Data ---
const MOCK_BLUEPRINTS: Blueprint[] = [
  {
    id: 'sku-001',
    code: 'BP-LFP-48V-2.5K',
    name: 'E-Scooter Standard Pack',
    type: 'SKU',
    chemistry: 'LFP',
    formFactor: 'Cylindrical 21700',
    voltage: '48V',
    capacity: '2.5 kWh',
    status: 'Approved',
    lastUpdated: '2026-01-10 14:00',
    compliance: { batteryAadhaar: true, euPassport: false, bisCertified: true }
  },
  {
    id: 'sku-002',
    code: 'BP-NMC-800V-75K',
    name: 'EV High Performance Pack',
    type: 'SKU',
    chemistry: 'NMC',
    formFactor: 'Prismatic',
    voltage: '800V',
    capacity: '75 kWh',
    status: 'Draft',
    lastUpdated: '2026-01-12 09:30',
    compliance: { batteryAadhaar: true, euPassport: true, bisCertified: false }
  },
  {
    id: 'cell-001',
    code: 'CELL-LFP-21700-A',
    name: 'Grade A LFP Cell',
    type: 'CELL',
    chemistry: 'LFP',
    formFactor: 'Cylindrical 21700',
    status: 'Approved',
    lastUpdated: '2025-12-15 11:20',
    compliance: { batteryAadhaar: false, euPassport: false, bisCertified: true }
  },
  {
    id: 'iot-001',
    code: 'IOT-BMS-GW-V2',
    name: 'BMS IoT Gateway Module',
    type: 'IOT',
    status: 'Review',
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
  const [s1Context, setS1Context] = useState<S1Context>(getMockS1Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Resume capability for SkuFlow
  const [resumeInstanceId, setResumeInstanceId] = useState<string | null>(null);

  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S1'));
  }, []);

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

  // --- Sub-Components ---

  // 1. Read-Only Detail View
  const BlueprintDetailView: React.FC<{ id: string }> = ({ id }) => {
    const bp = blueprints.find(b => b.id === id);
    if (!bp) return <div className="p-8 text-center text-slate-500">Blueprint not found.</div>;

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
                bp.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                bp.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
             }`}>
               {bp.status}
             </div>
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
        status: 'Draft',
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
        status: 'Draft',
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
            <div className="bg-white rounded-lg shadow-sm border border-industrial-border animate-in fade-in slide-in-from-bottom-2">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                     <Grid size={16} className="text-slate-400" />
                     <h3 className="font-bold text-slate-700 text-sm">Blueprint Registry</h3>
                     <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{blueprints.length}</span>
                  </div>
                  <div className="flex gap-2">
                     <div className="relative">
                        <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none w-48" />
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
                           <th className="px-6 py-3 uppercase tracking-wider">Last Updated</th>
                           <th className="px-6 py-3 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {blueprints.map(bp => (
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
                                    bp.status === 'Approved' ? 'text-green-600' : 
                                    bp.status === 'Draft' ? 'text-slate-500' :
                                    'text-amber-600'
                                 }`}>
                                    {bp.status === 'Approved' && <CheckCircle2 size={12} />}
                                    {bp.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs">{bp.lastUpdated}</td>
                              <td className="px-6 py-4 text-right">
                                 <button 
                                    onClick={() => goToDetail(bp.id)}
                                    className="text-brand-600 hover:text-brand-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-brand-50 transition-colors"
                                 >
                                    View
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
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
