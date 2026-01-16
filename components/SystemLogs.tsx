import React, { useState, useContext, useMemo, useEffect } from 'react';
import { UserContext, UserRole, NavView } from '../types';
import { 
  ClipboardList, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  ShieldAlert, 
  Filter, 
  Search, 
  Download,
  User,
  Box,
  Archive,
  Database,
  Briefcase,
  Play,
  Save,
  Lock,
  History,
  CheckCircle2,
  Radar,
  FileText,
  RefreshCw,
  Timer
} from 'lucide-react';
import { getMockS17Context, S17Context } from '../stages/s17/s17Contract';
import { getS17ActionState, S17ActionId } from '../stages/s17/s17Guards';
import { DisabledHint } from './DisabledHint';
import { emitAuditEvent, getAuditEvents, AuditEvent } from '../utils/auditEvents';

interface LogEntry {
  id: string;
  timestamp: string;
  category: 'Workflow' | 'System' | 'Compliance' | 'Security';
  severity: 'Info' | 'Success' | 'Warning' | 'Error';
  event: string;
  entity: string;
  actor: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'log-001', timestamp: '2026-01-13 13:58', category: 'System', severity: 'Info', event: 'Health Check', entity: 'Heartbeat Service', actor: 'System' },
  { id: 'log-002', timestamp: '2026-01-13 13:45', category: 'Workflow', severity: 'Success', event: 'Batch Released', entity: 'B-2026-01-001', actor: 'Supervisor (A. Kumar)' },
  { id: 'log-003', timestamp: '2026-01-13 13:30', category: 'Compliance', severity: 'Warning', event: 'Validation Warning', entity: 'PCK-009', actor: 'QA System' },
  { id: 'log-004', timestamp: '2026-01-13 13:15', category: 'Security', severity: 'Error', event: 'Unauthorized Access', entity: 'Gateway B', actor: 'Unknown IP' },
  { id: 'log-005', timestamp: '2026-01-13 12:55', category: 'Workflow', severity: 'Info', event: 'Shift Handover', entity: 'Line A', actor: 'System' },
  { id: 'log-006', timestamp: '2026-01-13 12:10', category: 'Compliance', severity: 'Success', event: 'Audit Log Archived', entity: 'Audit-Vault', actor: 'Auditor (J. Doe)' },
  { id: 'log-007', timestamp: '2026-01-13 11:45', category: 'Workflow', severity: 'Warning', event: 'Line Blocked', entity: 'Station 03', actor: 'Operator (R. Singh)' },
];

// Optimized Row Component
const LogRow = React.memo<{ log: LogEntry }>(({ log }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-3 font-mono text-slate-500 text-xs whitespace-nowrap">{log.timestamp}</td>
    <td className="px-6 py-3 font-medium text-slate-700">
      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
        {log.category}
      </span>
    </td>
    <td className="px-6 py-3">
      <div className="flex items-center gap-2">
        {log.severity === 'Info' && <Info size={16} className="text-blue-500" />}
        {log.severity === 'Success' && <CheckCircle size={16} className="text-green-500" />}
        {log.severity === 'Warning' && <AlertCircle size={16} className="text-amber-500" />}
        {log.severity === 'Error' && <ShieldAlert size={16} className="text-red-500" />}
        <span className={`text-xs font-bold ${
          log.severity === 'Info' ? 'text-blue-700' :
          log.severity === 'Success' ? 'text-green-700' :
          log.severity === 'Warning' ? 'text-amber-700' :
          'text-red-700'
        }`}>{log.severity}</span>
      </div>
    </td>
    <td className="px-6 py-3">
      <div className="font-bold text-slate-800">{log.event}</div>
      <div className="text-xs text-slate-500 mt-0.5">ID: {log.id}</div>
    </td>
    <td className="px-6 py-3">
      <div className="flex items-center gap-1 text-slate-600">
        <Box size={12} />
        <span className="font-mono text-xs">{log.entity}</span>
      </div>
    </td>
    <td className="px-6 py-3">
      <div className="flex items-center gap-1 text-slate-600">
        <User size={12} />
        <span className="text-xs">{log.actor}</span>
      </div>
    </td>
  </tr>
));

interface SystemLogsProps {
  onNavigate?: (view: NavView) => void;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ onNavigate }) => {
  const { role } = useContext(UserContext);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  
  // S17 Context
  const [s17Context, setS17Context] = useState<S17Context>(getMockS17Context());
  const [localEvents, setLocalEvents] = useState<AuditEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [programClosed, setProgramClosed] = useState(false);

  // Load events on mount
  useEffect(() => {
    setLocalEvents(getAuditEvents().filter(e => e.stageId === 'S17'));
  }, []);

  // Helper for Guards
  const getAction = (actionId: S17ActionId) => getS17ActionState(role, s17Context, actionId);

  // Action Handlers
  const handlePrepareArchive = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS17Context(prev => ({
        ...prev,
        closureStatus: 'READY'
      }));
      const evt = emitAuditEvent({
        stageId: 'S17',
        actionId: 'PREPARE_ARCHIVE',
        actorRole: role,
        message: 'Archive volume prepared. Ready for processing.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleStartArchive = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setS17Context(prev => ({
        ...prev,
        closureStatus: 'ARCHIVING',
        archiveBatchesCount: prev.archiveBatchesCount + 1
      }));
      const evt = emitAuditEvent({
        stageId: 'S17',
        actionId: 'START_ARCHIVE',
        actorRole: role,
        message: 'Archival batch process started.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 600);
  };

  const handleCompleteArchive = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
      setS17Context(prev => {
        const moved = Math.min(prev.recordsReadyToArchiveCount, 150); // Move simulated chunk
        return {
          ...prev,
          closureStatus: 'ARCHIVED',
          recordsReadyToArchiveCount: Math.max(0, prev.recordsReadyToArchiveCount - moved),
          recordsArchivedCount: prev.recordsArchivedCount + moved,
          lastArchiveAt: now
        };
      });
      const evt = emitAuditEvent({
        stageId: 'S17',
        actionId: 'COMPLETE_ARCHIVE',
        actorRole: role,
        message: 'Archive batch completed successfully. Volume moved to cold storage.'
      });
      setLocalEvents(prev => [evt, ...prev]);
      setIsSimulating(false);
    }, 1000);
  };

  const handleExportPackage = () => {
    const exportData = {
        generatedAt: new Date().toISOString(),
        stage: "S17: Closure & Archive",
        closureStatus: s17Context.closureStatus,
        metrics: {
            recordsReady: s17Context.recordsReadyToArchiveCount,
            recordsArchived: s17Context.recordsArchivedCount,
            batches: s17Context.archiveBatchesCount,
            lastArchiveAt: s17Context.lastArchiveAt
        },
        notes: "Frontend Demo Export - Mock Data"
    };
    
    // Create and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CLOSURE_PKG_S17_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const evt = emitAuditEvent({
        stageId: 'S17',
        actionId: 'EXPORT_CLOSURE_PACKAGE',
        actorRole: role,
        message: 'Closure package (JSON) exported to local device'
    });
    setLocalEvents(prev => [evt, ...prev]);
  };

  const handleCloseProgram = () => {
    setIsSimulating(true);
    setTimeout(() => {
        const evt = emitAuditEvent({
            stageId: 'S17',
            actionId: 'CLOSE_PROGRAM',
            actorRole: role,
            message: 'Program formally closed. System in read-only retention mode.'
        });
        setLocalEvents(prev => [evt, ...prev]);
        setProgramClosed(true);
        setIsSimulating(false);
    }, 800);
  };

  const handleNav = (target: NavView) => {
    if (onNavigate) {
      emitAuditEvent({
        stageId: 'S17',
        actionId: 'NAV_END_PANEL',
        actorRole: role,
        message: `Navigated to ${target} from End of Lifecycle panel.`
      });
      onNavigate(target);
    }
  };

  const isOperator = role === UserRole.OPERATOR;
  const isAuditor = role === UserRole.MANAGEMENT || role === UserRole.COMPLIANCE;
  const isArchived = s17Context.closureStatus === 'ARCHIVED';

  // Memoized Filter Logic (Optimized for large lists)
  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter(log => {
      // Role-based visibility constraints
      if (isOperator && (log.category === 'Security' || log.category === 'Compliance')) return false;
      
      // UI Filters
      if (filterCategory !== 'All' && log.category !== filterCategory) return false;
      if (filterSeverity !== 'All' && log.severity !== filterSeverity) return false;
      
      return true;
    });
  }, [filterCategory, filterSeverity, isOperator]);

  // Pre-calculate action states
  const prepareState = getAction('PREPARE_ARCHIVE');
  const startState = getAction('START_ARCHIVE');
  const completeState = getAction('COMPLETE_ARCHIVE');
  const exportState = getAction('EXPORT_CLOSURE_PACKAGE');
  const closeState = getAction('CLOSE_PROGRAM');

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Audit & Archive
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <ClipboardList className="text-brand-600" size={24} />
             System Logs & Closure (S17)
           </h1>
           <p className="text-slate-500 text-sm mt-1">Unified immutable log stream and system closure archiving.</p>
        </div>
        
        {/* S17 Context Read-Only Display */}
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border uppercase ${
             s17Context.closureStatus === 'ARCHIVED' ? 'bg-green-50 text-green-700 border-green-200' :
             s17Context.closureStatus === 'READY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
             s17Context.closureStatus === 'ARCHIVING' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' :
             'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
             <Archive size={14} />
             <span>ARCHIVE: {s17Context.closureStatus}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
            <Database size={10} />
            <span>Ready: {s17Context.recordsReadyToArchiveCount}</span>
            <span className="text-slate-300">|</span>
            <span>Batches: {s17Context.archiveBatchesCount}</span>
          </div>
        </div>
      </div>

      {programClosed && (
        <div className="bg-slate-800 text-white p-3 rounded-md flex items-center gap-3 animate-in slide-in-from-top-2">
            <Lock size={18} className="text-red-400" />
            <div>
                <div className="text-sm font-bold">PROGRAM CLOSED (DEMO)</div>
                <div className="text-xs text-slate-400">System is now in read-only retention state. No further mutations allowed in this simulation.</div>
            </div>
        </div>
      )}

      {/* Archive Operations Toolbar */}
      <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-wrap items-center gap-4 transition-opacity ${isSimulating || programClosed ? 'opacity-70 pointer-events-none' : ''}`}>
         <div className="flex items-center gap-3 mr-auto">
            <div className="p-2 bg-slate-100 text-slate-600 rounded border border-slate-200">
               <Briefcase size={20} />
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-sm">Closure Operations</h3>
               <p className="text-xs text-slate-500">System Archival & Program End</p>
            </div>
         </div>

         {/* Prepare */}
         <div className="flex flex-col items-center">
            <button 
                onClick={handlePrepareArchive}
                disabled={!prepareState.enabled}
                title={prepareState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors"
            >
                <Database size={14} /> Prepare Data
            </button>
         </div>

         {/* Start */}
         <div className="flex flex-col items-center">
            <button 
                onClick={handleStartArchive}
                disabled={!startState.enabled}
                title={startState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 text-xs font-bold transition-colors"
            >
                <Play size={14} /> Start Archive
            </button>
         </div>

         {/* Complete */}
         <div className="flex flex-col items-center">
            <button 
                onClick={handleCompleteArchive}
                disabled={!completeState.enabled}
                title={completeState.reason}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 text-xs font-bold transition-colors"
            >
                <Save size={14} /> Complete
            </button>
         </div>

         <div className="w-px h-8 bg-slate-200 mx-2"></div>

         {/* Export Package */}
         <div className="flex flex-col items-center">
            <button 
                onClick={handleExportPackage}
                disabled={!exportState.enabled}
                title={exportState.reason}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors"
            >
                <Download size={14} /> Export Package
            </button>
         </div>

         {/* Close Program */}
         <div className="flex flex-col items-center">
            <button 
                onClick={handleCloseProgram}
                disabled={!closeState.enabled}
                title={closeState.reason}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-900 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold transition-colors shadow-sm"
            >
                <Lock size={14} /> Close Program
            </button>
         </div>
      </div>

      {/* Recent Local Activity Panel */}
      {localEvents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
              <History size={14} /> Recent S17 Activity (Session)
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

      {/* End of Lifecycle Panel */}
      {onNavigate && (
        <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-3`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${isArchived ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {isArchived ? <CheckCircle2 size={20} /> : <Timer size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">End of Lifecycle</h3>
              <p className="text-xs text-slate-700 mt-1 max-w-lg">
                {isArchived
                  ? "Lifecycle archived. System state is frozen for this context. You may review other areas."
                  : "Not archived yet. Complete closure operations to finalize the lifecycle."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto flex-wrap justify-end">
             <button
               onClick={() => handleNav('control_tower')}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 transition-colors"
             >
               <Radar size={14} /> Control Tower
             </button>
             <button
               onClick={() => handleNav('documentation')}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 transition-colors"
             >
               <FileText size={14} /> Documentation
             </button>
             <button
               onClick={() => handleNav('system_setup')}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
             >
               <RefreshCw size={14} /> Go to S0: Initiation
             </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-industrial-border flex gap-4 items-center">
         <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={16} /> Filters:
         </div>
         <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded px-2 py-1 focus:outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
         >
            <option value="All">All Categories</option>
            <option value="Workflow">Workflow</option>
            <option value="System">System</option>
            {!isOperator && <option value="Compliance">Compliance</option>}
            {!isOperator && <option value="Security">Security</option>}
         </select>
         <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded px-2 py-1 focus:outline-none"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
         >
            <option value="All">All Severities</option>
            <option value="Info">Info</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
         </select>
         <div className="flex-1"></div>
         <div className="relative">
            <input type="text" placeholder="Search logs..." className="bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-sm w-64 focus:outline-none" disabled />
            <Search size={14} className="absolute left-2 top-1.5 text-slate-400" />
         </div>
         
         <div className="w-px h-6 bg-slate-200 mx-2"></div>
         
         <button className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50" disabled>
             <Download size={14} /> Export CSV
         </button>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-lg shadow-sm border border-industrial-border overflow-hidden flex-1 flex flex-col">
         <div className="overflow-auto flex-1">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider w-40">Timestamp (IST)</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider w-32">Category</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider w-24">Severity</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Event & Message</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider w-40">Entity</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider w-48">Actor</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                    <LogRow key={log.id} log={log} />
                ))}
                </tbody>
            </table>
         </div>
         <div className="p-2 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
            Showing {filteredLogs.length} events. Logs are immutable and retained for compliance.
         </div>
      </div>

    </div>
  );
};
