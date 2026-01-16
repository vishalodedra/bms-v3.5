import React, { useState, useContext, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  BarChart2, 
  FileText, 
  Download, 
  ShieldCheck, 
  Battery, 
  Database, 
  X,
  PieChart,
  TrendingUp,
  Layers,
  Leaf,
  RefreshCw,
  Search,
  CheckSquare,
  Send,
  Lock,
  History,
  CheckCircle2,
  ArrowRight,
  Radar
} from 'lucide-react';
import { getMockS15Context, S15Context } from '../stages/s15/s15Contract';
import { getS15ActionState, S15ActionId } from '../stages/s15/s15Guards';
import { DisabledHint } from './DisabledHint';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

interface ReportTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  owner: string;
  previewData?: React.ReactNode;
}

const REPORTS: ReportTile[] = [
  { 
    id: 'rpt-mfg',
    title: 'Production Summary', 
    description: 'Yield rates, cycle times, and defect pareto analysis for current shift.',
    icon: BarChart2,
    owner: 'MES Backend',
    previewData: (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase">Yield</div>
                    <div className="text-xl font-bold text-green-600">95.4%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase">Cycle Time</div>
                    <div className="text-xl font-bold text-blue-600">14m</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="text-xs text-slate-500 uppercase">Throughput</div>
                    <div className="text-xl font-bold text-slate-700">124 Units</div>
                </div>
            </div>
            <div className="h-32 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300">
                [ Chart Placeholder: Production Output Trend ]
            </div>
        </div>
    )
  },
  { 
    id: 'rpt-comp',
    title: 'Compliance & Traceability', 
    description: 'Regulatory adherence report (AIS-156, Battery Passport readiness).',
    icon: ShieldCheck,
    owner: 'Governance Module',
    previewData: (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <span className="text-sm font-bold text-green-800">AIS-156 Compliance</span>
                <span className="text-sm font-mono font-bold text-green-700">100%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                <span className="text-sm font-bold text-blue-800">Passport Generation</span>
                <span className="text-sm font-mono font-bold text-blue-700">98.2%</span>
            </div>
            <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600">
                    <tr><th className="p-2">Metric</th><th className="p-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    <tr><td className="p-2">Data Integrity</td><td className="p-2 text-green-600 font-bold">Verified</td></tr>
                    <tr><td className="p-2">Custodian Chain</td><td className="p-2 text-green-600 font-bold">Complete</td></tr>
                </tbody>
            </table>
        </div>
    )
  },
  { 
    id: 'rpt-inv',
    title: 'Inventory & WIP Summary', 
    description: 'Current stock levels across warehouses and production lines.',
    icon: Layers,
    owner: 'WMS Service',
    previewData: (
        <div className="space-y-3">
             <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">Raw Cells</span>
                <span className="font-mono font-bold">15,420</span>
             </div>
             <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">WIP Modules</span>
                <span className="font-mono font-bold">350</span>
             </div>
             <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">Finished Packs</span>
                <span className="font-mono font-bold">450</span>
             </div>
             <div className="p-2 bg-amber-50 text-amber-800 text-xs rounded mt-2">
                Alert: Low stock on Thermal Pads (Type B)
             </div>
        </div>
    )
  },
  { 
    id: 'rpt-wty',
    title: 'Warranty & Returns', 
    description: 'Active claims, fleet health distribution, and risk exposure.',
    icon: Battery,
    owner: 'Service Backend',
    previewData: (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
                    <div className="text-xs text-red-600 uppercase font-bold">Active Claims</div>
                    <div className="text-xl font-bold text-red-800">3</div>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
                    <div className="text-xs text-green-600 uppercase font-bold">Fleet Health</div>
                    <div className="text-xl font-bold text-green-800">98%</div>
                </div>
            </div>
            <div className="text-xs text-slate-500">
                Top Risk: <span className="font-bold text-slate-700">Over-Temperature (Region A)</span>
            </div>
        </div>
    )
  },
];

interface SystemReportsProps {
  onNavigate?: (view: NavView) => void;
}

export const SystemReports: React.FC<SystemReportsProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [selectedReport, setSelectedReport] = useState<ReportTile | null>(null);
  
  // S15 Context State
  const [s15Context, setS15Context] = useState<S15Context>(getMockS15Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S15'));
  }, []);

  // Action Helper
  const getAction = (actionId: S15ActionId) => getS15ActionState(role, s15Context, actionId);

  // --- Handlers for Simulated Actions ---

  const handleGenerateSnapshot = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS15Context(prev => {
        // Randomly adjust ESG metrics slightly for liveliness
        const newScore = Math.min(100, Math.max(0, prev.esgScorePreview + (Math.random() > 0.5 ? 1 : -1)));
        const newCarbon = Math.max(0, prev.carbonFootprintKgCo2e + (Math.random() > 0.5 ? 5 : -5));
        
        return {
          ...prev,
          complianceSnapshotCount: prev.complianceSnapshotCount + 1,
          lastComplianceRunAt: now,
          esgScorePreview: newScore,
          carbonFootprintKgCo2e: newCarbon,
          // If we have missing evidence, we need it. Otherwise we are ready.
          complianceStatus: prev.missingEvidenceCount > 0 ? 'NEEDS_EVIDENCE' : 'READY'
        };
      });

      const evt = emitAuditEvent({
        stageId: 'S15',
        actionId: 'GENERATE_SNAPSHOT',
        actorRole: role,
        message: 'Generated new Compliance & ESG Snapshot'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleRequestEvidence = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Idempotent state change, mostly for audit log
      setS15Context(prev => ({
        ...prev,
        complianceStatus: 'NEEDS_EVIDENCE'
      }));

      const evt = emitAuditEvent({
        stageId: 'S15',
        actionId: 'REQUEST_MISSING_EVIDENCE',
        actorRole: role,
        message: `Requested ${s15Context.missingEvidenceCount} pending evidence items`
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleMarkCollected = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS15Context(prev => {
        const nextMissing = Math.max(0, prev.missingEvidenceCount - 1);
        return {
          ...prev,
          missingEvidenceCount: nextMissing,
          complianceStatus: nextMissing === 0 ? 'READY' : 'NEEDS_EVIDENCE'
        };
      });

      const evt = emitAuditEvent({
        stageId: 'S15',
        actionId: 'MARK_EVIDENCE_COLLECTED',
        actorRole: role,
        message: 'Evidence item collected and verified'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleSubmitReport = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS15Context(prev => ({
        ...prev,
        complianceStatus: 'SUBMITTED'
      }));

      const evt = emitAuditEvent({
        stageId: 'S15',
        actionId: 'SUBMIT_COMPLIANCE_REPORT',
        actorRole: role,
        message: 'Compliance report submitted to registry'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  // Nav Handlers
  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  const handleNavToS16 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S15',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S16 (Audit / Governance) from S15 Next Step panel'
      });
      onNavigate('compliance_audit');
    }
  };

  // --- End Handlers ---

  const generateState = getAction('GENERATE_SNAPSHOT');
  const requestEvidenceState = getAction('REQUEST_MISSING_EVIDENCE');
  const markCollectedState = getAction('MARK_EVIDENCE_COLLECTED');
  const submitReportState = getAction('SUBMIT_COMPLIANCE_REPORT');

  const isReadyForNext = s15Context.complianceStatus === 'SUBMITTED';

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Intelligence
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <FileText className="text-brand-600" size={24} />
             System Reports & Compliance (S15)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Generated analytics, compliance reporting, and ESG metrics.</p>
        </div>

        {/* S15 Context Read-Only Display */}
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border uppercase ${
             s15Context.complianceStatus === 'READY' || s15Context.complianceStatus === 'SUBMITTED' ? 'bg-green-50 text-green-700 border-green-200' :
             s15Context.complianceStatus === 'NEEDS_EVIDENCE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
             'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
             <ShieldCheck size={14} />
             <span>STATUS: {s15Context.complianceStatus.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
             <span className="flex items-center gap-1" title="Missing Evidence">
                <Database size={10} /> Pending: {s15Context.missingEvidenceCount}
             </span>
             <span className="text-slate-300">|</span>
             <span className="flex items-center gap-1 text-green-600 font-bold" title="ESG Score">
                <Leaf size={10} /> ESG: {s15Context.esgScorePreview}
             </span>
             <span className="text-slate-300">|</span>
             <span className="font-bold text-slate-600">{s15Context.carbonFootprintKgCo2e} kg CO2e</span>
          </div>
        </div>
      </div>

      {/* Compliance Operations Toolbar */}
      <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-wrap items-center gap-4 transition-opacity ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
         <div className="flex items-center gap-3 mr-auto">
            <div className="p-2 bg-slate-100 text-slate-600 rounded border border-slate-200">
               <ShieldCheck size={20} />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-sm">Compliance Operations</h3>
               <p className="text-xs text-slate-500">ESG & Regulatory Workflow</p>
            </div>
         </div>

         {/* Generate Snapshot */}
         <div className="flex flex-col items-center">
            <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                disabled={!generateState.enabled}
                title={generateState.reason}
                onClick={handleGenerateSnapshot}
            >
                <RefreshCw size={14} /> Generate Snapshot
            </button>
         </div>

         {/* Request Evidence */}
         <div className="flex flex-col items-center">
            <button 
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors"
                disabled={!requestEvidenceState.enabled}
                title={requestEvidenceState.reason}
                onClick={handleRequestEvidence}
            >
                <Search size={14} /> Request Evidence
            </button>
         </div>

         {/* Mark Collected */}
         <div className="flex flex-col items-center">
            <button 
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-300 disabled:text-slate-400 text-xs font-bold transition-colors"
                disabled={!markCollectedState.enabled}
                title={markCollectedState.reason}
                onClick={handleMarkCollected}
            >
                <CheckSquare size={14} /> Mark Collected
            </button>
         </div>

         <div className="w-px h-8 bg-slate-200 mx-2"></div>

         {/* Submit Report */}
         <div className="flex flex-col items-center">
            <button 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 border border-green-700 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-400 text-xs font-bold transition-colors shadow-sm"
                disabled={!submitReportState.enabled}
                title={submitReportState.reason}
                onClick={handleSubmitReport}
            >
                <Send size={14} /> Submit Report
            </button>
         </div>
      </div>
      
      {/* Show Hints Row if any action blocked */}
      <div className="flex gap-6 justify-end px-2">
         {!generateState.enabled && generateState.reason && <DisabledHint reason={generateState.reason} />}
         {!submitReportState.enabled && submitReportState.reason && <DisabledHint reason={submitReportState.reason} />}
      </div>

      {/* Recent Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S15 Compliance Activity (Session)
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {localEvents.slice(0, 5).map(evt => (
                 <div key={evt.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{evt.timestamp.split(' ')[0]}</span>
                    <span className="font-bold text-slate-700 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 shrink-0">{evt.actorRole}</span>
                    <span className="text-slate-600 flex-1 truncate text-xs" title={evt.message}>{evt.message}</span>
                    <CheckCircle2 size={12} className="text-green-500 shrink-0" />
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
                ? "Compliance package filed. Proceed to Audit / Governance (S16) for final oversight." 
                : "Compliance report pending. Complete generation, evidence collection, and submission to proceed."}
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
               onClick={handleNavToS16} 
               disabled={!isReadyForNext}
               className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
             >
               <ShieldCheck size={14} /> Go to S16: Audit / Governance
             </button>
             {!isReadyForNext && (
                <span className="text-[9px] text-red-500 mt-1 font-medium">Report Not Submitted</span>
             )}
           </div>
        </div>
      </div>

      {/* Report Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-y-auto">
         {REPORTS.map((report) => (
            <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-white p-6 rounded-lg shadow-sm border border-industrial-border flex flex-col cursor-pointer hover:shadow-md hover:border-brand-300 transition-all group"
            >
               <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg text-brand-600 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                     <report.icon size={24} />
                  </div>
                  <div className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-mono rounded uppercase">
                     Owner: {report.owner}
                  </div>
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">{report.title}</h3>
               <p className="text-sm text-slate-500 flex-1">{report.description}</p>
               <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Click to Preview</span>
                  <PieChart size={16} className="text-slate-300 group-hover:text-brand-500" />
               </div>
            </div>
         ))}
      </div>

      {/* Preview Panel Overlay */}
      {selectedReport && (
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-8 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full border border-slate-200">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-50 rounded text-brand-600">
                              <selectedReport.icon size={20} />
                          </div>
                          <div>
                              <h2 className="text-lg font-bold text-slate-800">{selectedReport.title}</h2>
                              <div className="text-xs text-slate-500">Preview Mode • Data is Simulated</div>
                          </div>
                      </div>
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto">
                      {selectedReport.previewData}
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                      >
                          Close
                      </button>
                      <button 
                        disabled
                        className="px-4 py-2 bg-brand-600 text-white rounded text-sm font-medium opacity-50 cursor-not-allowed flex items-center gap-2"
                      >
                          <Download size={16} />
                          Download PDF
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
