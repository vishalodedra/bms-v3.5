
import React, { useContext, useState, useEffect, useMemo } from 'react';
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
  Radar,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Eye,
  Briefcase,
  Calendar,
  DollarSign,
  Ban,
  Edit
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS2Context, S2Context } from '../stages/s2/s2Contract';
import { getS2ActionState, validatePoItemAction, S2ActionId } from '../stages/s2/s2Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';
import { Modal } from './Modal';

// --- Types ---

type POStatus = 'Draft' | 'Submitted' | 'Approved' | 'Closed' | 'Rejected';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  materialType: 'Cells' | 'BMS' | 'IoT' | 'Thermal';
  skuCode: string; // Ref to S1
  quantity: number;
  unitPrice: number;
  currency: string;
  totalValue: number;
  deliveryDate: string;
  status: POStatus;
  createdAt: string;
  history: {
    action: string;
    actor: string;
    timestamp: string;
  }[];
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  rating: string;
}

// --- Mock Data ---

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup-001', name: 'CellGlobal Dynamics', type: 'Cells', rating: 'A+' },
  { id: 'sup-002', name: 'Orion BMS Systems', type: 'BMS', rating: 'A' },
  { id: 'sup-003', name: 'ThermalWrap Inc', type: 'Thermal', rating: 'B' },
  { id: 'sup-004', name: 'Precision Casings', type: 'Mechanical', rating: '-' },
];

const MOCK_ACTIVE_SKUS = [
  'BP-LFP-48V-2.5K',
  'BP-NMC-800V-75K',
  'CELL-LFP-21700'
];

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2026-001',
    supplierId: 'sup-001',
    supplierName: 'CellGlobal Dynamics',
    materialType: 'Cells',
    skuCode: 'CELL-LFP-21700',
    quantity: 5000,
    unitPrice: 3.50,
    currency: 'INR',
    totalValue: 17500,
    deliveryDate: '2026-02-15',
    status: 'Approved',
    createdAt: '2026-01-10 09:00',
    history: []
  },
  {
    id: 'po-002',
    poNumber: 'PO-2026-002',
    supplierId: 'sup-002',
    supplierName: 'Orion BMS Systems',
    materialType: 'BMS',
    skuCode: 'BMS-LV-MASTER',
    quantity: 200,
    unitPrice: 45.00,
    currency: 'INR',
    totalValue: 9000,
    deliveryDate: '2026-02-20',
    status: 'Draft',
    createdAt: '2026-01-12 14:00',
    history: []
  }
];

// --- Internal Routing ---
type InternalRoute = 
  | { view: 'LIST' }
  | { view: 'CREATE' }
  | { view: 'DETAIL', id: string };

interface ProcurementProps {
  onNavigate?: (view: NavView) => void;
}

export const Procurement: React.FC<ProcurementProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // State
  const [route, setRoute] = useState<InternalRoute>({ view: 'LIST' });
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [s2Context, setS2Context] = useState<S2Context>(getMockS2Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Listing State
  const [statusFilter, setStatusFilter] = useState<POStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Create Form State
  const [createForm, setCreateForm] = useState({
    supplierId: '',
    skuCode: '',
    quantity: 0,
    unitPrice: 0,
    deliveryDate: ''
  });

  // Load events
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S2'));
  }, []);

  // Update Context Metrics derived from PO list
  useEffect(() => {
    const active = pos.filter(p => p.status === 'Approved').length;
    const pending = pos.filter(p => p.status === 'Submitted').length;
    
    setS2Context(prev => ({
      ...prev,
      activePoCount: active,
      pendingApprovalsCount: pending,
      // Aggregated status just for the banner/header
      procurementStatus: pending > 0 ? 'WAITING_APPROVAL' : active > 0 ? 'APPROVED' : 'IDLE'
    }));
  }, [pos]);

  // Filter Logic
  const filteredPos = useMemo(() => {
    if (statusFilter === 'ALL') return pos;
    return pos.filter(p => p.status === statusFilter);
  }, [pos, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPos.length / itemsPerPage);
  const paginatedPos = filteredPos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Guards
  // Global Create Guard
  const createPoState = getS2ActionState(role, s2Context, 'CREATE_PO');
  
  // Navigation Handlers
  const goToList = () => setRoute({ view: 'LIST' });
  const goToDetail = (id: string) => setRoute({ view: 'DETAIL', id });
  const goToCreate = () => {
    setCreateForm({ supplierId: '', skuCode: '', quantity: 0, unitPrice: 0, deliveryDate: '' });
    setRoute({ view: 'CREATE' });
  };

  // --- Handlers ---

  const handleCreateSubmit = () => {
    if (!createForm.supplierId || !createForm.skuCode || createForm.quantity <= 0) return;

    setIsSimulating(true);
    setTimeout(() => {
      const supplier = MOCK_SUPPLIERS.find(s => s.id === createForm.supplierId);
      const newPo: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${String(pos.length + 1).padStart(3, '0')}`,
        supplierId: createForm.supplierId,
        supplierName: supplier?.name || 'Unknown',
        materialType: supplier?.type as any || 'Other',
        skuCode: createForm.skuCode,
        quantity: createForm.quantity,
        unitPrice: createForm.unitPrice,
        currency: 'INR',
        totalValue: createForm.quantity * createForm.unitPrice,
        deliveryDate: createForm.deliveryDate,
        status: 'Draft',
        createdAt: new Date().toLocaleString(),
        history: [{ action: 'Created', actor: role, timestamp: new Date().toLocaleString() }]
      };

      setPos(prev => [newPo, ...prev]);
      
      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: 'CREATE_PO',
        actorRole: role,
        message: `Drafted PO ${newPo.poNumber} for ${newPo.supplierName}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
      goToList();
    }, 800);
  };

  const handleStatusChange = (poId: string, newStatus: POStatus, actionId: S2ActionId) => {
    setIsSimulating(true);
    setTimeout(() => {
      setPos(prev => prev.map(po => {
        if (po.id === poId) {
          return {
            ...po,
            status: newStatus,
            history: [...po.history, { action: newStatus, actor: role, timestamp: new Date().toLocaleString() }]
          };
        }
        return po;
      }));

      const evt = emitAuditEvent({
        stageId: 'S2',
        actionId: actionId,
        actorRole: role,
        message: `PO ${poId} transitioned to ${newStatus}`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleAmend = (poId: string) => {
    // Logic: Revert to Draft for editing
    handleStatusChange(poId, 'Draft', 'AMEND_PO'); 
  };

  // --- Render Helpers ---

  const renderStatusBadge = (status: POStatus) => {
    const styles = {
      'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
      'Submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'Approved': 'bg-green-100 text-green-700 border-green-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
      'Closed': 'bg-gray-800 text-white border-gray-900',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Access Check
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

  // --- Views ---

  // 1. CREATE VIEW
  if (route.view === 'CREATE') {
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
        <div className="mb-4">
           <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
              <ArrowLeft size={12} /> Cancel & Return to List
           </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-industrial-border p-6 max-w-2xl mx-auto w-full flex-1 overflow-y-auto">
           <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingCart size={20} className="text-brand-600" />
              Create Purchase Order
           </h2>
           
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supplier</label>
                    <select 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                      value={createForm.supplierId}
                      onChange={e => setCreateForm({...createForm, supplierId: e.target.value})}
                    >
                       <option value="">Select Supplier...</option>
                       {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target SKU</label>
                    <select 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white font-mono"
                      value={createForm.skuCode}
                      onChange={e => setCreateForm({...createForm, skuCode: e.target.value})}
                    >
                       <option value="">Select SKU...</option>
                       {MOCK_ACTIVE_SKUS.map(sku => <option key={sku} value={sku}>{sku}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={createForm.quantity}
                      onChange={e => setCreateForm({...createForm, quantity: parseInt(e.target.value) || 0})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Price (INR)</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={createForm.unitPrice}
                      onChange={e => setCreateForm({...createForm, unitPrice: parseFloat(e.target.value) || 0})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Date</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={createForm.deliveryDate}
                      onChange={e => setCreateForm({...createForm, deliveryDate: e.target.value})}
                    />
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded border border-slate-200 flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-600">Total Value Estimate</span>
                 <span className="text-xl font-mono font-bold text-slate-800">
                    {(createForm.quantity * createForm.unitPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                 </span>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button 
                   onClick={handleCreateSubmit}
                   disabled={isSimulating || !createForm.supplierId || !createForm.skuCode || createForm.quantity <= 0}
                   className="bg-brand-600 text-white px-6 py-2 rounded-md font-bold text-sm shadow-sm hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                 >
                    {isSimulating ? <RotateCcw className="animate-spin" size={16} /> : <Send size={16} />}
                    Draft PO
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // 2. DETAIL VIEW
  if (route.view === 'DETAIL') {
    const po = pos.find(p => p.id === route.id);
    if (!po) return <div>PO Not Found</div>;

    const submitState = validatePoItemAction(role, po.status, 'SUBMIT_PO_FOR_APPROVAL');
    const approveState = validatePoItemAction(role, po.status, 'APPROVE_PO');
    const amendState = validatePoItemAction(role, po.status, 'AMEND_PO');
    const closeState = validatePoItemAction(role, po.status, 'CLOSE_PROCUREMENT_CYCLE');

    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
         <div className="mb-4 flex justify-between items-center">
           <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
              <ArrowLeft size={12} /> Back to List
           </button>
           <div className="flex gap-2">
              {/* Draft -> Submitted */}
              {submitState.enabled && (
                 <button 
                   onClick={() => handleStatusChange(po.id, 'Submitted', 'SUBMIT_PO_FOR_APPROVAL')}
                   disabled={isSimulating}
                   className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                 >
                    <Send size={14} /> Submit for Approval
                 </button>
              )}
              
              {/* Submitted -> Approved/Rejected */}
              {approveState.enabled && (
                 <>
                   <button 
                     onClick={() => handleStatusChange(po.id, 'Rejected', 'APPROVE_PO')}
                     disabled={isSimulating}
                     className="bg-white border border-red-200 text-red-700 px-4 py-2 rounded-md font-bold text-xs hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2"
                   >
                      <Ban size={14} /> Reject
                   </button>
                   <button 
                     onClick={() => handleStatusChange(po.id, 'Approved', 'APPROVE_PO')}
                     disabled={isSimulating}
                     className="bg-green-600 text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                   >
                      <ThumbsUp size={14} /> Approve
                   </button>
                 </>
              )}

              {/* Approved -> Amend */}
              {amendState.enabled && (
                 <button 
                   onClick={() => handleAmend(po.id)}
                   disabled={isSimulating}
                   className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-md font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                 >
                    <Edit size={14} /> Amend (Revert to Draft)
                 </button>
              )}

              {/* Approved -> Close */}
              {closeState.enabled && (
                 <button 
                   onClick={() => handleStatusChange(po.id, 'Closed', 'CLOSE_PROCUREMENT_CYCLE')}
                   disabled={isSimulating}
                   className="bg-slate-800 text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-slate-900 transition-colors shadow-sm"
                 >
                    Close
                 </button>
              )}
           </div>
         </div>

         <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                     <FileText className="text-brand-600" />
                     {po.poNumber}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">{po.supplierName}</p>
               </div>
               <div className="text-right">
                  {renderStatusBadge(po.status)}
                  <div className="text-xs text-slate-400 mt-2 font-mono">{po.createdAt}</div>
               </div>
            </div>

            <div className="p-8 grid grid-cols-3 gap-8">
               <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Item</h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                     <div className="text-sm font-bold text-slate-700 mb-1">{po.skuCode}</div>
                     <div className="text-xs text-slate-500 mb-2">{po.materialType}</div>
                     <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-2">
                        <span className="text-xs font-mono text-slate-500">Qty</span>
                        <span className="text-lg font-bold text-slate-800">{po.quantity.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commercials</h3>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500">Unit Price</span>
                        <span className="font-mono font-medium">{po.unitPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">Currency</span>
                        <span className="font-mono font-medium">{po.currency}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-slate-100">
                        <span className="text-slate-700 font-bold">Total Value</span>
                        <span className="font-mono font-bold text-lg text-brand-600">{po.totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistics</h3>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500">Delivery Date</span>
                        <span className="font-medium text-slate-700">{po.deliveryDate}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">Destination</span>
                        <span className="font-medium text-slate-700">Inbound Dock (S3)</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-slate-50 border-t border-slate-200 p-6 overflow-y-auto">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Audit Trail</h3>
               <div className="space-y-3">
                  {po.history.map((evt, idx) => (
                     <div key={idx} className="flex gap-3 text-sm">
                        <div className="min-w-[140px] text-xs font-mono text-slate-400">{evt.timestamp}</div>
                        <div className="font-bold text-slate-700 w-24">{evt.action}</div>
                        <div className="text-slate-500 flex-1">by {evt.actor}</div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    );
  }

  // 3. MAIN LISTING
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 h-full flex flex-col">
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
           <p className="text-slate-500 text-sm mt-1">Manage purchase orders, supplier agreements, and procurement lifecycle.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
             <button 
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 transition-colors shadow-sm"
              disabled={!createPoState.enabled}
              onClick={goToCreate}
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

      <div className="shrink-0">
          <StageStateBanner stageId="S2" />
          <PreconditionsPanel stageId="S2" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-slate-700" />
                  <h3 className="font-semibold text-slate-700">Purchase Order Registry</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{filteredPos.length}</span>
              </div>
              {/* Filter Control */}
              <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              >
                  <option value="ALL">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Closed">Closed</option>
              </select>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Qty</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Value</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {paginatedPos.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 font-mono font-bold text-slate-700">{po.poNumber}</td>
                          <td className="px-6 py-3 font-medium text-slate-800">{po.supplierName}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{po.skuCode}</td>
                          <td className="px-6 py-3 text-right font-mono">{po.quantity.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{po.totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="px-6 py-3 text-center">
                              {renderStatusBadge(po.status)}
                          </td>
                          <td className="px-6 py-3 text-right">
                              <button 
                                  onClick={() => goToDetail(po.id)}
                                  className="text-brand-600 hover:text-brand-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-brand-50 transition-colors flex items-center gap-1 ml-auto"
                              >
                                  <Eye size={14} /> View
                              </button>
                          </td>
                      </tr>
                  ))}
                  </tbody>
              </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="p-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-slate-50 shrink-0">
              <span>Page {currentPage} of {Math.max(1, totalPages)}</span>
              <div className="flex gap-1">
                  <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                      <ChevronLeft size={14} />
                  </button>
                  <button 
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                      <ChevronRight size={14} />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
