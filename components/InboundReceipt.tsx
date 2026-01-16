
import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView, AnyFlowInstance } from '../types';
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
  CalendarClock,
  Ban,
  Trash2,
  FileText,
  Plus,
  RefreshCw,
  ArrowLeft,
  Eye,
  Wand2,
  Box
} from 'lucide-react';
import { StageStateBanner } from './StageStateBanner';
import { PreconditionsPanel } from './PreconditionsPanel';
import { DisabledHint } from './DisabledHint';
import { getMockS3Context, S3Context } from '../stages/s3/s3Contract';
import { getS3ActionState, S3ActionId } from '../stages/s3/s3Guards';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';
import { InboundFlowWizard } from '../flows/inbound/ui/InboundFlowWizard';
import { apiFetch } from '../services/apiHarness';
import { INBOUND_FLOW_ENDPOINTS } from '../flows/inbound';

// --- Types ---

type InboundRoute = 
  | { view: 'LIST' }
  | { view: 'WORK', instanceId?: string } // Create (no ID) or Process (with ID)
  | { view: 'DETAIL', id: string };

interface InboundReceiptProps {
  onNavigate?: (view: NavView) => void;
}

export const InboundReceipt: React.FC<InboundReceiptProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // Routing State
  const [route, setRoute] = useState<InboundRoute>({ view: 'LIST' });
  
  // Data State
  const [flows, setFlows] = useState<AnyFlowInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [s3Context, setS3Context] = useState<S3Context>(getMockS3Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);

  // Fetch Data
  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(INBOUND_FLOW_ENDPOINTS.list);
      const result = await res.json();
      if (result.ok) setFlows(result.data);
    } catch (e) {
      console.error("S3: Failed to fetch flows", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S3'));
  }, []);

  // Helpers
  const getAction = (actionId: S3ActionId) => getS3ActionState(role, s3Context, actionId);
  
  // Navigation Handlers
  const goToList = () => {
    setRoute({ view: 'LIST' });
    fetchFlows(); // Refresh on return
  };
  
  const goToDetail = (id: string) => {
    setRoute({ view: 'DETAIL', id });
  };

  const goToWork = (id?: string) => {
    setRoute({ view: 'WORK', instanceId: id });
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Received': 'bg-blue-100 text-blue-700 border-blue-200',
      'Serialized': 'bg-purple-100 text-purple-700 border-purple-200',
      'QCPending': 'bg-amber-100 text-amber-700 border-amber-200',
      'Disposition': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Released': 'bg-green-100 text-green-700 border-green-200',
      'Blocked': 'bg-red-100 text-red-700 border-red-200',
      'Scrapped': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  // Access Check
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

  // --- VIEWS ---

  // 1. WIZARD VIEW (CREATE / WORK)
  if (route.view === 'WORK') {
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
        <div className="mb-4">
           <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
              <ArrowLeft size={12} /> Cancel & Return to List
           </button>
        </div>
        <div className="flex-1 min-h-0">
           <InboundFlowWizard 
             instanceId={route.instanceId} 
             onExit={() => {
                // If we have an instance ID, go to detail, else go to list
                if (route.instanceId) goToDetail(route.instanceId);
                else goToList();
             }} 
           />
        </div>
      </div>
    );
  }

  // 2. DETAIL VIEW
  if (route.view === 'DETAIL') {
    const flow = flows.find(f => f.instanceId === route.id);
    if (!flow) return <div>Flow Not Found</div>;
    
    // Cast to specific type for property access
    const receipt = (flow as any).receipt || {};
    const serializedItems: any[] = (flow as any).serializedItems || [];
    
    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
         <div className="mb-4 flex justify-between items-center">
           <button onClick={goToList} className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 font-medium">
              <ArrowLeft size={12} /> Back to List
           </button>
           
           <div className="flex gap-2">
              {/* Process Button - Context Aware */}
              {['Received', 'Serialized', 'QCPending', 'Disposition'].includes(flow.state) && (
                 <button 
                   onClick={() => goToWork(flow.instanceId)}
                   className="bg-brand-600 text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
                 >
                    <Wand2 size={14} /> Continue Workflow
                 </button>
              )}
           </div>
         </div>

         <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col overflow-hidden mb-6 flex-1">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                     <FileText className="text-brand-600" />
                     {receipt.grnNumber || 'Unknown GRN'}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">{receipt.supplierName}</p>
               </div>
               <div className="text-right">
                  {renderStatusBadge(flow.state)}
                  <div className="text-xs text-slate-400 mt-2 font-mono">ID: {flow.instanceId}</div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Material Info</h3>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-slate-500">Material Code</span>
                          <span className="font-mono font-medium">{receipt.materialCode}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-500">Quantity</span>
                          <span className="font-mono font-medium">{receipt.quantityReceived} {receipt.uom}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-500">Received Date</span>
                          <span>{receipt.receivedDate}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Traceability Source</h3>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                          <span className="text-slate-500">Linked PO</span>
                          <span className="font-mono font-medium">{receipt.poNumber || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-500">Supplier Lot</span>
                          <span className="font-mono font-medium">{receipt.supplierLotNumber || 'N/A'}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Actions</h3>
                    {['Released', 'Blocked', 'Scrapped'].includes(flow.state) ? (
                       <div className="p-3 bg-slate-50 rounded text-xs text-slate-500 text-center">
                          Workflow Finalized. No further actions.
                       </div>
                    ) : (
                       <div className="p-3 bg-blue-50 text-blue-700 rounded text-xs text-center">
                          Use "Continue Workflow" to proceed to next step.
                       </div>
                    )}
                 </div>
              </div>

              {/* Serial List Section */}
              <div className="px-8 pb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Serialized Inventory ({serializedItems.length})</h3>
                  {serializedItems.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="max-h-60 overflow-y-auto bg-white p-0">
                          <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                  <tr>
                                      <th className="px-4 py-2 font-medium">Serial Number</th>
                                      <th className="px-4 py-2 font-medium text-right">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {serializedItems.map((item, idx) => (
                                      <tr key={idx}>
                                          <td className="px-4 py-2 font-mono text-slate-700">{item.serialNumber}</td>
                                          <td className="px-4 py-2 text-right">
                                              <span className={`font-bold ${
                                                item.status === 'PASSED' ? 'text-green-600' :
                                                (item.status === 'FAILED' || item.status === 'BLOCKED') ? 'text-red-600' :
                                                'text-amber-500'
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
                  ) : (
                    <div className="text-xs text-slate-400 italic">No serialized items recorded yet.</div>
                  )}
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
              Procurement <span className="text-slate-300">/</span> Inbound Console
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Truck className="text-brand-600" size={24} />
             Inbound & Serialization Console (S3)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Verify receipts, enforce serialization, and execute inbound QC.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <button 
            className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
            onClick={() => goToWork()}
          >
            <Plus size={16} />
            <span>Record Receipt</span>
          </button>
          
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} /> 
            <span>Active Receipts: {flows.length}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0">
          <StageStateBanner stageId="S3" />
          <PreconditionsPanel stageId="S3" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                  <List size={16} className="text-slate-700" />
                  <h3 className="font-semibold text-slate-700">Receipts Registry</h3>
                  <button 
                    onClick={fetchFlows} 
                    className={`ml-2 p-1 rounded hover:bg-slate-200 text-slate-400 transition-all ${isLoading ? 'animate-spin' : ''}`}
                  >
                    <RefreshCw size={12} />
                  </button>
              </div>
              <div className="relative">
                 <input type="text" placeholder="Search GRN..." className="text-xs border border-slate-300 rounded px-2 py-1 pl-7 bg-white focus:ring-2 focus:ring-brand-500 outline-none w-48" />
                 <Search size={12} className="absolute left-2 top-1.5 text-slate-400" />
              </div>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">GRN Number</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">PO Ref</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Material</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Qty</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {flows.length === 0 && !isLoading && (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">No inbound receipts found. Start a new receipt to begin.</td>
                     </tr>
                  )}
                  {flows.map((flow: any) => (
                      <tr key={flow.instanceId} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-3 font-mono font-bold text-slate-700">{flow.receipt?.grnNumber}</td>
                          <td className="px-6 py-3 font-medium text-slate-800">{flow.receipt?.supplierName}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs font-mono">{flow.receipt?.poNumber || '--'}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{flow.receipt?.materialCode}</td>
                          <td className="px-6 py-3 text-right font-mono">{flow.receipt?.quantityReceived}</td>
                          <td className="px-6 py-3 text-center">
                              {renderStatusBadge(flow.state)}
                          </td>
                          <td className="px-6 py-3 text-right">
                              <button 
                                  onClick={() => goToDetail(flow.instanceId)}
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
      </div>
    </div>
  );
};
