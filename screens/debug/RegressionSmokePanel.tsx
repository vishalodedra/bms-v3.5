import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ChevronRight, 
  Cpu, 
  Layers, 
  Truck, 
  Database, 
  PackageCheck,
  AlertCircle,
  FlaskConical
} from 'lucide-react';
import { apiFetch } from '../../services/apiHarness';
import { APP_VERSION, PATCH_ID, NavView } from '../../types';

interface FlowHealth {
  flowId: string;
  title: string;
  endpoint: string;
  status: 'PENDING' | 'WIRED' | 'ERROR';
  instances: number;
  error?: string;
  icon: React.ElementType;
  route: NavView;
}

const FLOWS: Omit<FlowHealth, 'status' | 'instances'>[] = [
  { 
    flowId: 'FLOW-001', 
    title: 'SKU & Blueprint', 
    endpoint: '/api/flows/sku/list', 
    icon: Cpu,
    route: 'sku_blueprint'
  },
  { 
    flowId: 'FLOW-002', 
    title: 'Batch Planning', 
    endpoint: '/api/flows/batch/list', 
    icon: Layers,
    route: 'batch_planning'
  },
  { 
    flowId: 'FLOW-003', 
    title: 'Inbound Receipt', 
    endpoint: '/api/flows/inbound/list', 
    icon: Truck,
    route: 'inbound_receipt'
  },
  { 
    flowId: 'FLOW-004', 
    title: 'Final Pack QA', 
    endpoint: '/api/flows/final-qa/list', 
    icon: Database,
    route: 'battery_registry'
  },
  { 
    flowId: 'FLOW-005', 
    title: 'Dispatch & Custody', 
    endpoint: '/api/flows/dispatch/list', 
    icon: PackageCheck,
    route: 'finished_goods'
  },
];

export const RegressionSmokePanel: React.FC<{ onNavigate: (view: NavView) => void }> = ({ onNavigate }) => {
  const [healthData, setHealthData] = useState<FlowHealth[]>(
    FLOWS.map(f => ({ ...f, status: 'PENDING', instances: 0 }))
  );
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = async () => {
    setIsChecking(true);
    const results: FlowHealth[] = [];

    for (const flow of FLOWS) {
      try {
        const res = await apiFetch(flow.endpoint);
        const json = await res.json();
        
        if (json.ok) {
          results.push({
            ...flow,
            status: 'WIRED',
            instances: Array.isArray(json.data) ? json.data.length : 0
          });
        } else {
          results.push({
            ...flow,
            status: 'ERROR',
            instances: 0,
            error: json.error?.message || 'API responded with error'
          });
        }
      } catch (err) {
        results.push({
          ...flow,
          status: 'ERROR',
          instances: 0,
          error: err instanceof Error ? err.message : 'Network / Router failure'
        });
      }
    }

    setHealthData(results);
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
            Diagnostics <span className="text-slate-300">/</span> Smoke Test
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="text-brand-600" size={24} />
            Regression Smoke Panel
          </h1>
          <p className="text-slate-500 text-sm mt-1">Verification of API wiring and store integrity across all Pilot flows.</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="bg-slate-900 text-slate-300 px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-2 border border-slate-700 shadow-sm">
            <FlaskConical size={14} className="text-brand-400" />
            BUILD: {PATCH_ID}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            App Version: {APP_VERSION}
          </div>
        </div>
      </div>

      {/* Summary Area */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${isChecking ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
            <RefreshCw size={24} className={isChecking ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Connection Scan</h3>
            <p className="text-xs text-slate-500">Executing GET requests to flow collection endpoints.</p>
          </div>
        </div>
        <button 
          onClick={checkConnectivity}
          disabled={isChecking}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          {isChecking ? 'Scanning...' : 'Rerun Smoke Test'}
        </button>
      </div>

      {/* Flow Health Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Flow Module</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">In-Memory Count</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Diagnostic Log</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Direct Nav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {healthData.map((flow) => {
              const Icon = flow.icon;
              return (
                <tr key={flow.flowId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded text-slate-500">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{flow.flowId}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{flow.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border uppercase ${
                      flow.status === 'WIRED' ? 'bg-green-50 text-green-700 border-green-200' :
                      flow.status === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {flow.status === 'WIRED' ? <CheckCircle2 size={12} /> : 
                       flow.status === 'ERROR' ? <XCircle size={12} /> : 
                       <RefreshCw size={12} className="animate-spin" />}
                      {flow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">
                    {flow.status === 'PENDING' ? '--' : flow.instances}
                  </td>
                  <td className="px-6 py-4">
                    {flow.error ? (
                      <div className="text-red-500 text-[10px] leading-tight bg-red-50 p-2 rounded border border-red-100 max-w-xs break-words">
                        {flow.error}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[10px] italic">
                        GET {flow.endpoint} ... {flow.status === 'WIRED' ? 'OK' : '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onNavigate(flow.route)}
                      className="text-brand-600 hover:text-brand-800 font-bold text-[10px] uppercase flex items-center gap-1 ml-auto transition-colors"
                    >
                      Jump to Screen <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Safety & Constraint Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 uppercase">Diagnostic Integrity Guard</h4>
          <p className="text-[10px] text-amber-800 mt-1 leading-relaxed">
            This panel operates in <strong>Read-Only Mode</strong> using the <code>apiFetch</code> harness. It validates the simulated API registry and in-memory store. 
            Any "ERROR" status indicates a failure in the internal router matching logic or handler registration in <code>apiRoutes.ts</code>.
            This view is hidden from production end-users.
          </p>
        </div>
      </div>
    </div>
  );
};