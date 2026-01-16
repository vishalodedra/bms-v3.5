import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, LayoutDashboard, FileText, Copy, Terminal } from 'lucide-react';
import { NavView, PATCH_ID } from '../types';

interface Props {
  children: ReactNode;
  onNavigate?: (view: NavView) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Fix: Explicitly importing and extending Component ensures properties like props and setState are correctly recognized.
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  // Fix: Accessing setState through inheritance from Component.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("BPM-OS Runtime Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  // Fix: handleDashboard correctly accesses inherited props and setState from Component.
  private handleDashboard = () => {
    const { onNavigate } = this.props;
    if (onNavigate) {
      onNavigate('dashboard');
      this.setState({ hasError: false, error: null, errorInfo: null });
    } else {
      window.location.reload();
    }
  };

  // Fix: handleDocs correctly accesses inherited props and setState from Component.
  private handleDocs = () => {
    const { onNavigate } = this.props;
    if (onNavigate) {
      onNavigate('documentation');
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  private copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `BPM-OS ERROR REPORT\nPatch: ${PATCH_ID}\nTime: ${new Date().toISOString()}\n\nMessage: ${error?.message}\n\nStack:\n${errorInfo?.componentStack || error?.stack || 'No stack trace available.'}`;
    navigator.clipboard.writeText(details).then(() => {
        alert("Error details copied to clipboard.");
    });
  };

  public render() {
    const { hasError, error } = this.state;
    // Fix: render method correctly accesses children from this.props which is inherited from Component.
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-900 p-6">
          <div className="max-w-xl w-full bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="bg-red-50 border-b border-red-100 p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                 <ShieldAlert size={32} />
              </div>
              <div>
                 <h1 className="text-xl font-bold text-red-900">System Encountered an Error</h1>
                 <p className="text-sm text-red-700 mt-1">The application has caught a runtime exception. This incident has been logged locally.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    <RefreshCw size={18} />
                    Reload Application
                  </button>
                  
                  <button
                    onClick={this.handleDashboard}
                    className="flex items-center justify-center gap-2 bg-brand-50 text-brand-700 border border-brand-200 px-4 py-3 rounded-lg hover:bg-brand-100 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    <LayoutDashboard size={18} />
                    Return to Dashboard
                  </button>
               </div>

               <button
                  onClick={this.handleDocs}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 py-2 text-sm font-medium transition-colors"
               >
                  <FileText size={16} />
                  Consult System Documentation
               </button>
            </div>

            {/* Technical Details */}
            <div className="bg-slate-50 p-6 border-t border-slate-200">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                     <Terminal size={12} /> Debug Context
                  </span>
                  <button 
                    onClick={this.copyErrorDetails}
                    className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-800 font-medium"
                  >
                     <Copy size={12} /> Copy Details
                  </button>
               </div>
               <div className="bg-slate-900 rounded p-3 text-xs font-mono text-red-300 overflow-auto max-h-32 border border-slate-700 shadow-inner">
                  {error?.toString()}
               </div>
               <div className="mt-2 text-[10px] text-slate-400 text-right">
                  Build: {PATCH_ID}
               </div>
            </div>

          </div>
        </div>
      );
    }

    // Fix: render method correctly returns children from inherited props.
    return children;
  }
}

export default ErrorBoundary;