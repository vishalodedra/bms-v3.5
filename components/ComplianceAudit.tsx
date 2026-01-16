import React, { useContext, useState, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ShieldAlert, 
  FileCheck, 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  History, 
  Download, 
  BarChart4,
  CheckCircle2,
  XCircle,
  Flag,
  Battery,
  Recycle,
  Scale,
  RefreshCcw,
  Search,
  Wrench,
  Archive,
  Play,
  ArrowRight,
  Radar,
  Gavel,
  ClipboardList,
  CheckSquare,
  Lock
} from 'lucide-react';
import { getMockS14Context, S14Context } from '../stages/s14/s14Contract';
import { getS14ActionState, S14ActionId } from '../stages/s14/s14Guards';
import { getMockS16Context, S16Context } from '../stages/s16/s16Contract';
import { getS16ActionState, S16ActionId } from '../stages/s16/s16Guards';
import { DisabledHint } from './DisabledHint';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

// Mock Data for Dashboard
const KPI_DATA = {
  totalManufactured: 1240,
  aadhaarReady: 98,
  euPassportReady: 45,
  eprEligible: 1240,
  riskCount: 12
};

const RISK_LIST = [
  { id: 'risk-01', packId: 'PCK-2026-001-013', issue: 'QA Hold - Electrical', severity: 'High' },
  { id: 'risk-02', packId: 'PCK-2025-010-092', issue: 'Service - Over Temp', severity: 'Medium' },
  { id: 'risk-03', packId: 'PCK-2026-002-005', issue: 'BMS Firmware Mismatch', severity: 'Low' }
];

const AUDIT_TRAIL = [
  { stage: 'S14: Dispatch', event: 'Custody Handover', timestamp: '2026-01-11 14:00', actor: 'Logistics Mgr', status: 'Verified' },
  { stage: 'S8: QA Review', event: 'Final Release', timestamp: '2026-01-11 10:30', actor: 'Quality Lead', status: 'Approved' },
  { stage: 'S7: Assembly', event: 'Enclosure Seal', timestamp: '2026-01-11 09:15', actor: 'Operator A', status: 'Logged' },
  { stage: 'S5: Module', event: 'Cell Scan', timestamp: '2026-01-10 16:20', actor: 'Operator B', status: 'Logged' }
];

interface ComplianceAuditProps {
  onNavigate?: (view: NavView) => void;
}

export const ComplianceAudit: React.FC<ComplianceAuditProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  
  // S14 Context State
  const [s14Context, setS14Context] = useState<S14Context>(getMockS14Context());
  
  // S16 Context State
  const [s16Context, setS16Context] = useState<S16Context>(getMockS16Context());

  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load events on mount (Filtered for S14 & S16)
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S14' || e.stageId === 'S16'));
  }, []);

  // Helper for Guards
  const getS14Action = (actionId: S14ActionId) => getS14ActionState(role, s14Context, actionId);
  const getS16Action = (actionId: S16ActionId) => getS16ActionState(role, s16Context, actionId);

  // S14 Action Handlers
  const handleStartInspection = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS14Context(prev => ({
        ...prev,
        circularStatus: 'INSPECTION'
      }));
      const evt = emitAuditEvent({
        stageId: 'S14',
        actionId: 'START_INSPECTION',
        actorRole: role,
        message: 'Circular inspection started for returned unit'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleRefurbish = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS14Context(prev => ({
        ...prev,
        circularStatus: 'REFURBISH',
        packsSentForRefurbishCount: prev.packsSentForRefurbishCount + 1,
        refurbishInProgressCount: prev.refurbishInProgressCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S14',
        actionId: 'MARK_FOR_REFURBISH',
        actorRole: role,
        message: 'Unit marked for Refurbishment (Module Replacement)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleRecycle = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS14Context(prev => ({
        ...prev,
        circularStatus: 'RECYCLE',
        packsSentForRecycleCount: prev.packsSentForRecycleCount + 1,
        refurbishInProgressCount: prev.refurbishInProgressCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S14',
        actionId: 'MARK_FOR_RECYCLE',
        actorRole: role,
        message: 'Unit marked for Recycling (Material Recovery)'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteRefurbish = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS14Context(prev => ({
        ...prev,
        circularStatus: 'COMPLETED',
        refurbishInProgressCount: Math.max(0, prev.refurbishInProgressCount - 1),
        lastCircularActionAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S14',
        actionId: 'COMPLETE_REFURBISH',
        actorRole: role,
        message: 'Refurbishment completed. Unit re-certified.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleCloseCase = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS14Context(prev => ({
        ...prev,
        circularStatus: 'COMPLETED',
        lastCircularActionAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S14',
        actionId: 'CLOSE_CIRCULAR_CASE',
        actorRole: role,
        message: 'Circular lifecycle case closed and archived.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  // S16 Action Handlers
  const handleStartAudit = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS16Context(prev => ({
        ...prev,
        auditStatus: 'REVIEWING',
        lastAuditReviewedAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S16',
        actionId: 'START_AUDIT_REVIEW',
        actorRole: role,
        message: 'Audit review session started'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleRaiseFinding = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS16Context(prev => ({
        ...prev,
        auditStatus: 'FINDINGS',
        findingsOpenCount: prev.findingsOpenCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S16',
        actionId: 'RAISE_FINDING',
        actorRole: role,
        message: 'New audit finding raised. Remediation required.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleResolveFinding = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS16Context(prev => {
        const nextOpen = Math.max(0, prev.findingsOpenCount - 1);
        return {
          ...prev,
          findingsOpenCount: nextOpen,
          findingsResolvedCount: prev.findingsResolvedCount + 1,
          auditStatus: nextOpen === 0 ? 'RESOLVED' : 'FINDINGS'
        };
      });
      const evt = emitAuditEvent({
        stageId: 'S16',
        actionId: 'MARK_FINDING_RESOLVED',
        actorRole: role,
        message: 'Finding marked as resolved. Evidence attached.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCloseAudit = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS16Context(prev => ({
        ...prev,
        auditStatus: 'CLOSED',
        auditsOpenCount: Math.max(0, prev.auditsOpenCount - 1),
        auditsClosedCount: prev.auditsClosedCount + 1,
        lastAuditReviewedAt: now
      }));
      const evt = emitAuditEvent({
        stageId: 'S16',
        actionId: 'CLOSE_AUDIT',
        actorRole: role,
        message: 'Audit formally closed and signed off.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 800);
  };

  const handleExportAudit = () => {
    const exportData = {
        generatedAt: new Date().toISOString(),
        stage: "S16: Audit & Governance",
        auditStatus: s16Context.auditStatus,
        metrics: {
            auditsOpen: s16Context.auditsOpenCount,
            auditsClosed: s16Context.auditsClosedCount,
            findingsOpen: s16Context.findingsOpenCount,
            findingsResolved: s16Context.findingsResolvedCount
        },
        notes: "Frontend Demo Export - Mock Data"
    };
    
    // Create and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AUDIT_PACK_S16_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const evt = emitAuditEvent({
        stageId: 'S16',
        actionId: 'EXPORT_AUDIT_PACK',
        actorRole: role,
        message: 'Audit pack (JSON) exported to local device'
    });
    setLocalEvents(prev => [evt, ...prev]);
  };

  // Nav Handlers
  const handleNavToS15 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S14',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S15 (Compliance / ESG) from S14 Next Step panel'
      });
      onNavigate('system_reports'); // Maps to S15 Compliance / ESG reports
    }
  };

  const handleNavToS17 = () => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S16',
        actionId: 'NAV_NEXT_STAGE',
        actorRole: role,
        message: 'Navigated to S17 (Closure / Archive) from S16 Next Step panel'
      });
      // S17 maps to System Logs / Documentation Archive
      onNavigate('system_logs');
    }
  };

  const handleNavToControlTower = () => {
    if (onNavigate) {
      onNavigate('control_tower');
    }
  };

  // Guard States S14
  const startInspState = getS14Action('START_INSPECTION');
  const refurbishState = getS14Action('MARK_FOR_REFURBISH');
  const recycleState = getS14Action('MARK_FOR_RECYCLE');
  const completeRefurbState = getS14Action('COMPLETE_REFURBISH');
  const closeCaseState = getS14Action('CLOSE_CIRCULAR_CASE');

  // Guard States S16
  const startAuditState = getS16Action('START_AUDIT_REVIEW');
  const raiseFindingState = getS16Action('RAISE_FINDING');
  const resolveFindingState = getS16Action('MARK_FINDING_RESOLVED');
  const closeAuditState = getS16Action('CLOSE_AUDIT');
  const exportAuditState = getS16Action('EXPORT_AUDIT_PACK');

  // Next Step Readiness
  const isS14Ready = s14Context.circularStatus === 'COMPLETED';
  const isS16Ready = s16Context.auditStatus === 'CLOSED';

  // RBAC Access Check
  const hasAccess = 
    role === UserRole.SYSTEM_ADMIN || 
    role === UserRole.COMPLIANCE || 
    role === UserRole.SUSTAINABILITY || 
    role === UserRole.MANAGEMENT ||
    role === UserRole.ENGINEERING;

  const isAuditor = role === UserRole.MANAGEMENT;

  if (!hasAccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
        <p>Your role ({role}) does not have permission to view Compliance & Audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Auditor Banner */}
      {isAuditor && (
        <div className="bg-slate-100 border-l-4 border-slate-500 text-slate-700 p-3 text-sm font-bold flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>AUDITOR / REGULATOR – READ-ONLY VIEW</span>
        </div>
      )}

      {/* Standard Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Governance <span className="text-slate-300">/</span> Audit
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <ShieldCheck className="text-brand-600" size={24} />
             Compliance & Audit Dashboard (S17)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Regulatory oversight, digital passport status, and risk registry.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          
          <div className="flex gap-2">
            {/* S14 Context Read-Only Display */}
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Circular Status (S14)</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                     <RefreshCcw size={12} className="text-brand-600" />
                     {s14Context.circularStatus}
                  </div>
               </div>
               <div className="w-px h-6 bg-slate-200"></div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refurbish Eligible</span>
                  <span className="text-xs font-mono font-bold text-green-600">{s14Context.packsEligibleForRefurbishCount} Units</span>
               </div>
            </div>

            {/* S16 Context Read-Only Display (New) */}
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Audit Status (S16)</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                     <Gavel size={12} className="text-blue-600" />
                     {s16Context.auditStatus}
                  </div>
               </div>
               <div className="w-px h-6 bg-slate-200"></div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Open Findings</span>
                  <span className="text-xs font-mono font-bold text-amber-600">{s16Context.findingsOpenCount} Issues</span>
               </div>
            </div>
          </div>

          <button 
            className="bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!exportAuditState.enabled}
            onClick={handleExportAudit}
            title={exportAuditState.reason}
          >
            <Download size={16} />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-y-auto">
        
        {/* Top: KPI Cards */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <BarChart4 size={20} />
                 </div>
                 <span className="text-sm font-bold text-slate-600">Manufactured</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{KPI_DATA.totalManufactured}</div>
              <div className="text-xs text-slate-400 mt-1">Total Units YTD</div>
           </div>
           
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded">
                    <FileText size={20} />
                 </div>
                 <span className="text-sm font-bold text-slate-600">Aadhaar Ready</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{KPI_DATA.aadhaarReady}%</div>
              <div className="text-xs text-slate-400 mt-1">Digital Identity Compliance</div>
           </div>

           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-green-50 text-green-600 rounded">
                    <Globe size={20} />
                 </div>
                 <span className="text-sm font-bold text-slate-600">EU Passport</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{KPI_DATA.euPassportReady}%</div>
              <div className="text-xs text-slate-400 mt-1">Export Compliant</div>
           </div>

           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-amber-50 text-amber-600 rounded">
                    <Flag size={20} />
                 </div>
                 <span className="text-sm font-bold text-slate-600">Active Risks</span>
              </div>
              <div className="text-2xl font-bold text-slate-800">{KPI_DATA.riskCount}</div>
              <div className="text-xs text-slate-400 mt-1">Flagged for Review</div>
           </div>
        </div>

        {/* Recent Activity Panel */}
        {localEvents.length > 0 && (
          <div className="col-span-12 bg-slate-50 border border-slate-200 rounded-md p-3 animate-in slide-in-from-top-2">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                <History size={14} /> Recent Governance Activity (Session)
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

        {/* Next Step S14 Panel */}
        <div className={`col-span-12 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-3 ${!onNavigate ? 'hidden' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <RefreshCcw size={20} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">Next Step: Circular Lifecycle (S14)</h3>
              <p className="text-xs text-blue-700 mt-1 max-w-lg">
                {isS14Ready 
                  ? "Circular lifecycle case finalized. Proceed to Compliance / ESG (S15) for reporting." 
                  : "Circular processing active. Complete inspection, refurbish/recycle, and close case to proceed."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <div className="flex-1 sm:flex-none flex flex-col items-center">
               <button 
                 onClick={handleNavToS15} 
                 disabled={!isS14Ready}
                 className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
               >
                 <FileText size={14} /> Go to S15: Compliance / ESG
               </button>
               {!isS14Ready && (
                  <span className="text-[9px] text-red-500 mt-1 font-medium">Case Not Closed</span>
               )}
             </div>
          </div>
        </div>

        {/* Next Step S16 Panel */}
        <div className={`col-span-12 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-3 ${!onNavigate ? 'hidden' : ''}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <Gavel size={20} />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 text-sm">Next Step: Audit & Closure (S16)</h3>
              <p className="text-xs text-indigo-700 mt-1 max-w-lg">
                {isS16Ready 
                  ? "Audit process closed. Proceed to System Archive (S17) for final closure." 
                  : "Audit active. Resolve findings and close the audit to enable archival."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button 
               onClick={handleNavToControlTower} 
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors"
             >
               <Radar size={14} /> Control Tower
             </button>
             <div className="flex-1 sm:flex-none flex flex-col items-center">
               <button 
                 onClick={handleNavToS17} 
                 disabled={!isS16Ready}
                 className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
               >
                 <Archive size={14} /> Go to S17: Closure / Archive
               </button>
               {!isS16Ready && (
                  <span className="text-[9px] text-red-500 mt-1 font-medium">Audit Not Closed</span>
               )}
             </div>
          </div>
        </div>

        {/* Audit & Governance Operations (S16) */}
        <div className={`col-span-12 bg-white rounded-lg shadow-sm border border-industrial-border p-4 transition-opacity ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
                <Gavel size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-700">Audit & Governance Operations (S16)</h3>
                <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">
                    Internal & External Audit Workflow
                </span>
            </div>
            
            <div className="flex flex-wrap gap-4">
                {/* Start Audit */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleStartAudit}
                        disabled={!startAuditState.enabled}
                        title={startAuditState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-bold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
                    >
                        <Play size={16} /> Start Review
                    </button>
                    {!startAuditState.enabled && <DisabledHint reason={startAuditState.reason || 'Blocked'} className="mt-1" />}
                </div>

                <div className="w-px bg-slate-200 h-10"></div>

                {/* Raise Finding */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleRaiseFinding}
                        disabled={!raiseFindingState.enabled}
                        title={raiseFindingState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-sm font-bold hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
                    >
                        <Flag size={16} /> Raise Finding
                    </button>
                    {!raiseFindingState.enabled && <DisabledHint reason={raiseFindingState.reason || 'Blocked'} className="mt-1" />}
                </div>

                {/* Resolve Finding */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleResolveFinding}
                        disabled={!resolveFindingState.enabled}
                        title={resolveFindingState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-bold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
                    >
                        <CheckSquare size={16} /> Resolve Finding
                    </button>
                    {!resolveFindingState.enabled && <DisabledHint reason={resolveFindingState.reason || 'Blocked'} className="mt-1" />}
                </div>

                <div className="w-px bg-slate-200 h-10"></div>

                {/* Close Audit */}
                <div className="flex flex-col items-center ml-auto">
                    <button 
                        onClick={handleCloseAudit}
                        disabled={!closeAuditState.enabled}
                        title={closeAuditState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-900 rounded-md text-sm font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300"
                    >
                        <Lock size={16} /> Close Audit
                    </button>
                    {!closeAuditState.enabled && <DisabledHint reason={closeAuditState.reason || 'Blocked'} className="mt-1" />}
                </div>
            </div>
        </div>

        {/* Circular Processing Operations (S14 Actions) */}
        <div className={`col-span-12 bg-white rounded-lg shadow-sm border border-industrial-border p-4 transition-opacity ${isSimulating ? 'opacity-70 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
                <RefreshCcw size={18} className="text-brand-600" />
                <h3 className="font-bold text-slate-700">Circular Processing Operations (S14)</h3>
                <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">
                    Role-Gated • Context-Aware
                </span>
            </div>
            
            <div className="flex flex-wrap gap-4">
                {/* Inspect */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleStartInspection}
                        disabled={!startInspState.enabled}
                        title={startInspState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <Search size={16} /> Inspect
                    </button>
                    {!startInspState.enabled && <DisabledHint reason={startInspState.reason || 'Blocked'} className="mt-1" />}
                </div>

                <div className="w-px bg-slate-200 h-10"></div>

                {/* Disposition */}
                <div className="flex flex-col items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={handleRefurbish}
                            disabled={!refurbishState.enabled}
                            title={refurbishState.reason}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm font-bold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
                        >
                            <Wrench size={16} /> Refurbish
                        </button>
                        <button 
                            onClick={handleRecycle}
                            disabled={!recycleState.enabled}
                            title={recycleState.reason}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-bold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
                        >
                            <Recycle size={16} /> Recycle
                        </button>
                    </div>
                    {(!refurbishState.enabled || !recycleState.enabled) && (
                        <DisabledHint reason={refurbishState.reason || recycleState.reason || 'Blocked'} className="mt-1" />
                    )}
                </div>

                <div className="w-px bg-slate-200 h-10"></div>

                {/* Execution */}
                <div className="flex flex-col items-center">
                    <button 
                        onClick={handleCompleteRefurbish}
                        disabled={!completeRefurbState.enabled}
                        title={completeRefurbState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-sm font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <Play size={16} /> Complete Job
                    </button>
                    {!completeRefurbState.enabled && <DisabledHint reason={completeRefurbState.reason || 'Blocked'} className="mt-1" />}
                </div>

                {/* Close */}
                <div className="flex flex-col items-center ml-auto">
                    <button 
                        onClick={handleCloseCase}
                        disabled={!closeCaseState.enabled}
                        title={closeCaseState.reason}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-900 rounded-md text-sm font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300"
                    >
                        <Archive size={16} /> Close Case
                    </button>
                    {!closeCaseState.enabled && <DisabledHint reason={closeCaseState.reason || 'Blocked'} className="mt-1" />}
                </div>
            </div>
        </div>

        {/* Regulatory Tracking Scope Panel */}
        <div className="col-span-12 bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                 <ShieldCheck size={16} />
                 Regulatory Tracking Scope
               </h3>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
                {/* Asset Tracking Summary */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-700">
                        <Battery size={20} />
                        <h4 className="font-bold text-sm uppercase tracking-wider">Asset-Level Compliance (Track-Based, Custodian-Driven)</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Traceability Basis</span>
                            <span className="font-medium text-slate-800">Unique Digital ID (UID)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Ownership Model</span>
                            <span className="font-medium text-slate-800">Custodian-Based</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Warranty Liability</span>
                            <span className="font-medium text-slate-800">Per-Unit Tracking</span>
                        </div>
                    </div>
                </div>

                {/* Material Tracking Summary */}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 text-green-700">
                        <Recycle size={20} />
                        <h4 className="font-bold text-sm uppercase tracking-wider">Material-Level Compliance (Trace-Based, Aggregated)</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Accounting Basis</span>
                            <span className="font-medium text-slate-800">Aggregated Mass (kg)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">EPR Obligation</span>
                            <span className="font-medium text-slate-800">Producer Responsibility</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Recycling Target</span>
                            <span className="font-medium text-slate-800">Material Recovery Rate %</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Left: Risk Registry */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col">
          <div className="p-4 border-b border-slate-100">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <AlertTriangle size={16} className="text-amber-500" />
               Risk Registry
             </h3>
          </div>
          <div className="p-0">
             {RISK_LIST.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                 <div className="bg-slate-50 p-3 rounded-full mb-3">
                   <ShieldCheck className="text-slate-300" size={24} />
                 </div>
                 <h3 className="text-slate-700 font-medium text-sm mb-1">No records available</h3>
                 <p className="text-slate-500 text-xs max-w-xs">Audit and compliance data will populate as lifecycle events are recorded.</p>
               </div>
             ) : (
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                   <tr>
                     <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">ID</th>
                     <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Issue</th>
                     <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Severity</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {RISK_LIST.map((risk) => (
                     <tr key={risk.id} className="hover:bg-slate-50">
                       <td className="px-4 py-3 font-mono text-xs text-slate-600">{risk.packId}</td>
                       <td className="px-4 py-3 text-slate-800">{risk.issue}</td>
                       <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            risk.severity === 'High' ? 'bg-red-100 text-red-700' :
                            risk.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {risk.severity}
                          </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>

        {/* Bottom Right: Audit Trail */}
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-industrial-border flex flex-col">
          <div className="p-4 border-b border-slate-100">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
               <History size={16} className="text-brand-500" />
               Recent System Audit Trail
             </h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-64">
             {AUDIT_TRAIL.map((audit, idx) => (
               <div key={idx} className="flex gap-4 items-start relative">
                  <div className="flex flex-col items-center">
                     <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5"></div>
                     {idx !== AUDIT_TRAIL.length - 1 && <div className="w-px h-full bg-slate-200 my-1"></div>}
                  </div>
                  <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-100">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 text-sm">{audit.stage}</span>
                        <span className="text-xs text-slate-400 font-mono">{audit.timestamp}</span>
                     </div>
                     <div className="text-sm text-slate-600 flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-green-500" />
                        {audit.event}
                     </div>
                     <div className="mt-1 text-xs text-slate-400">
                        Actor: {audit.actor} • Status: {audit.status}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};
