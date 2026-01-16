import React, { useState, useEffect } from 'react';
import { FileText, ScrollText, ShieldCheck, FileCode, Info, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { DOC_ARTIFACTS } from '../docs/artifacts';

export const Documentation: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>(DOC_ARTIFACTS[0].id);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeArtifact = DOC_ARTIFACTS.find(a => a.id === activeTabId) || DOC_ARTIFACTS[0];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setContent(''); // Clear previous content while loading

    fetch(activeArtifact.path)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        if (isMounted) {
          setContent(text);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Doc load error:", err);
          setError(err.message || "Could not load document.");
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [activeArtifact.path]);

  // Icon mapping helper
  const getIcon = (id: string) => {
    switch (id) {
      case 'context': return Info;
      case 'rulebook': return ShieldCheck;
      case 'manifest': return Lock;
      case 'patchlog': return ScrollText;
      case 'backend': return FileCode;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-slate-200 pb-4">
        <div>
           <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">
              System <span className="text-slate-300">/</span> Reference
           </div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <FileText className="text-brand-600" size={24} aria-hidden="true" />
             System Documentation
           </h1>
           <p className="text-slate-500 text-sm mt-1">Live artifact loader (File-System backed).</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto custom-scrollbar" role="tablist">
        {DOC_ARTIFACTS.map(artifact => {
          const Icon = getIcon(artifact.id);
          const isActive = activeTabId === artifact.id;
          return (
            <button 
                key={artifact.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTabId(artifact.id)}
                className={`pb-2 px-1 text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-t ${
                  isActive 
                    ? 'text-brand-600 border-b-2 border-brand-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <Icon size={16} aria-hidden="true" /> {artifact.tab}
            </button>
          );
        })}
      </div>

      {/* Content Viewer */}
      <div className="flex-1 bg-slate-50 rounded-lg border border-industrial-border overflow-hidden flex flex-col relative">
         <div className="p-2 bg-white border-b border-slate-200 flex justify-between items-center px-4">
            <span className="text-xs font-mono text-slate-400">
                SOURCE: {activeArtifact.path}
            </span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed custom-scrollbar focus:outline-none" tabIndex={0}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 size={32} className="animate-spin text-brand-500" />
                <p>Fetching artifact...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
                <AlertCircle size={32} />
                <p className="font-bold text-red-600">Error Loading Document</p>
                <p className="text-xs">{error}</p>
                <p className="text-xs text-slate-400 mt-2">Ensure file exists at {activeArtifact.path}</p>
              </div>
            ) : (
              content
            )}
         </div>
      </div>

    </div>
  );
};
