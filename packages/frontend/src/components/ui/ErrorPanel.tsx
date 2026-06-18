import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useSimulationStore } from '../../store/simulationStore';
import { useEditorStore } from '../../store/editorStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ChevronDown, ChevronRight, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { CircuitError } from '../../types/simulation';

interface ErrorPanelProps {
  onClose?: () => void;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ onClose }) => {
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const runtimeWarnings = useSimulationStore(state => state.runtimeWarnings);
  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const staticErrors = useEditorStore(state => state.staticErrors);
  const triggerFocus = useWorkspaceStore(state => state.triggerFocus);

  const [circuitExpanded, setCircuitExpanded] = useState(true);
  const [compilerExpanded, setCompilerExpanded] = useState(true);
  const [staticExpanded, setStaticExpanded] = useState(true);
  const [runtimeExpanded, setRuntimeExpanded] = useState(true);

  if (circuitErrors.length === 0 && compilationErrors.length === 0 && runtimeWarnings.length === 0 && staticErrors.length === 0) {
    return null;
  }

  // Sort circuit errors: error > warning > info
  const severityValue = { error: 3, warning: 2, info: 1 };
  const sortedCircuitErrors = [...circuitErrors].sort((a, b) => severityValue[b.severity] - severityValue[a.severity]);

  const getSeverityIcon = (severity: CircuitError['severity']) => {
    switch (severity) {
      case 'error': return <AlertCircle size={16} className="text-red-500 flex-shrink-0" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />;
      case 'info': return <Info size={16} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const getReadableType = (type: string) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const handleRowClick = (err: CircuitError) => {
    if (err.affectedComponentIds && err.affectedComponentIds.length > 0) {
      triggerFocus(err.affectedComponentIds);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 w-96 max-h-[60vh] bg-surface border border-border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden font-sans">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          Diagnostics
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-text-secondary hover:text-text transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {/* Circuit Errors Section */}
        {sortedCircuitErrors.length > 0 && (
          <div className="border border-border rounded bg-background overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-2 hover:bg-surface transition-colors text-sm font-medium"
              onClick={() => setCircuitExpanded(!circuitExpanded)}
            >
              <div className="flex items-center gap-2">
                {circuitExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Circuit Design</span>
              </div>
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {sortedCircuitErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              circuitExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-border flex flex-col">
                  {sortedCircuitErrors.map(err => (
                    <div 
                      key={err.id} 
                      className="p-3 border-b last:border-b-0 border-border hover:bg-surface/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(err)}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(err.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="font-bold text-sm text-text">
                              {getReadableType(err.type)}
                            </span>
                            {err.affectedComponentIds && err.affectedComponentIds.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {err.affectedComponentIds.map(id => (
                                  <span key={id} className="text-[10px] px-1.5 py-0.5 bg-surface-hover border border-border rounded text-text-secondary whitespace-nowrap">
                                    {id.split('-')[0]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary leading-snug">
                            {err.message}
                          </p>
                          {err.hint && (
                            <p className="text-xs text-text-muted italic mt-1.5">
                              Tip: {err.hint}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compilation Errors Section */}
        {compilationErrors.length > 0 && (
          <div className="border border-border rounded bg-background overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-2 hover:bg-surface transition-colors text-sm font-medium"
              onClick={() => setCompilerExpanded(!compilerExpanded)}
            >
              <div className="flex items-center gap-2">
                {compilerExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Compilation</span>
              </div>
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                {compilationErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              compilerExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-border flex flex-col p-2 space-y-2">
                  {compilationErrors.map((err, i) => (
                    <div key={i} className="text-sm text-red-400 font-mono bg-red-500/5 p-2 rounded border border-red-500/10 break-words">
                      <span className="font-bold text-red-300">Line {err.line}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Static Analysis Errors Section */}
        {staticErrors.length > 0 && (
          <div className="border border-border rounded bg-background overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-2 hover:bg-surface transition-colors text-sm font-medium"
              onClick={() => setStaticExpanded(!staticExpanded)}
            >
              <div className="flex items-center gap-2">
                {staticExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Static Analysis</span>
              </div>
              <span className={`${staticErrors.some(e => e.severity === 'error') ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'} text-xs px-2 py-0.5 rounded-full`}>
                {staticErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              staticExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-border flex flex-col p-2 space-y-2">
                  {staticErrors.map((err, i) => (
                    <div key={i} className={`text-sm ${err.severity === 'error' ? 'text-red-400 bg-red-500/5 border-red-500/10' : 'text-orange-400 bg-orange-500/5 border-orange-500/10'} p-2 rounded border break-words`}>
                      <div className="flex items-start gap-2">
                        {err.severity === 'error' ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p><span className="font-bold opacity-75">Line {err.line}:</span> {err.message}</p>
                          {err.hint && <p className="text-xs italic opacity-70 mt-1">Tip: {err.hint}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Runtime Warnings Section */}
        {runtimeWarnings.length > 0 && (
          <div className="border border-border rounded bg-background overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-2 hover:bg-surface transition-colors text-sm font-medium"
              onClick={() => setRuntimeExpanded(!runtimeExpanded)}
            >
              <div className="flex items-center gap-2">
                {runtimeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Runtime Warnings</span>
              </div>
              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
                {runtimeWarnings.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              runtimeExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-border flex flex-col p-2 space-y-2">
                  {runtimeWarnings.map((warn, i) => (
                    <div key={i} className="text-sm text-orange-400 bg-orange-500/5 p-2 rounded border border-orange-500/10 break-words flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
