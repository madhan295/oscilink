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
    <div className="absolute bottom-6 right-6 w-[420px] max-h-[60vh] bg-white border border-[#E5EBE8] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col z-50 overflow-hidden font-sans">
      <div className="flex items-center justify-between p-3.5 border-b border-[#E5EBE8] bg-[#F3F4F3]">
        <h3 className="font-bold text-[#2C5E4A] flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#f59e0b]" />
          Diagnostics
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-[#B5C2BF] hover:text-[#2C5E4A] transition-colors p-1 rounded-md hover:bg-black/5">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
        {/* Circuit Errors Section */}
        {sortedCircuitErrors.length > 0 && (
          <div className="border border-[#E5EBE8] rounded-xl bg-white overflow-hidden shadow-sm">
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-[#F3F4F3] transition-colors text-sm font-bold text-[#2C5E4A]"
              onClick={() => setCircuitExpanded(!circuitExpanded)}
            >
              <div className="flex items-center gap-2">
                {circuitExpanded ? <ChevronDown size={16} className="text-[#82b49b]" /> : <ChevronRight size={16} className="text-[#82b49b]" />}
                <span>Circuit Design</span>
              </div>
              <span className="bg-[#FCEAEB] text-[#FF8A8A] text-[11px] px-2 py-0.5 rounded-full font-bold">
                {sortedCircuitErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              circuitExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-[#E5EBE8] flex flex-col bg-white">
                  {sortedCircuitErrors.map(err => (
                    <div 
                      key={err.id} 
                      className="p-3 border-b last:border-b-0 border-[#E5EBE8] hover:bg-[#F3F4F3]/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(err)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {getSeverityIcon(err.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 mb-1.5">
                            <span className="font-bold text-sm text-[#2C5E4A]">
                              {getReadableType(err.type)}
                            </span>
                            {err.affectedComponentIds && err.affectedComponentIds.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {err.affectedComponentIds.map(id => (
                                  <span key={id} className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-black/5 rounded text-[#6A7B76] whitespace-nowrap">
                                    {id.split('-')[0]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-[#6A7B76] font-medium leading-relaxed">
                            {err.message}
                          </p>
                          {err.hint && (
                            <p className="text-xs text-[#82b49b] font-medium italic mt-2 flex items-start gap-1">
                              <span className="font-bold not-italic text-[#2C5E4A]">Tip:</span> {err.hint}
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
          <div className="border border-[#E5EBE8] rounded-xl bg-white overflow-hidden shadow-sm">
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-[#F3F4F3] transition-colors text-sm font-bold text-[#2C5E4A]"
              onClick={() => setCompilerExpanded(!compilerExpanded)}
            >
              <div className="flex items-center gap-2">
                {compilerExpanded ? <ChevronDown size={16} className="text-[#82b49b]" /> : <ChevronRight size={16} className="text-[#82b49b]" />}
                <span>Compilation</span>
              </div>
              <span className="bg-[#FCEAEB] text-[#FF8A8A] text-[11px] px-2 py-0.5 rounded-full font-bold">
                {compilationErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              compilerExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-[#E5EBE8] flex flex-col p-3 space-y-2 bg-white">
                  {compilationErrors.map((err, i) => (
                    <div key={i} className="text-sm font-medium text-[#ef4444] font-mono bg-[#ef4444]/5 p-2.5 rounded-lg border border-[#ef4444]/10 break-words leading-relaxed">
                      <span className="font-bold text-[#dc2626]">Line {err.line}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Static Analysis Errors Section */}
        {staticErrors.length > 0 && (
          <div className="border border-[#E5EBE8] rounded-xl bg-white overflow-hidden shadow-sm">
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-[#F3F4F3] transition-colors text-sm font-bold text-[#2C5E4A]"
              onClick={() => setStaticExpanded(!staticExpanded)}
            >
              <div className="flex items-center gap-2">
                {staticExpanded ? <ChevronDown size={16} className="text-[#82b49b]" /> : <ChevronRight size={16} className="text-[#82b49b]" />}
                <span>Static Analysis</span>
              </div>
              <span className={`${staticErrors.some(e => e.severity === 'error') ? 'bg-[#FCEAEB] text-[#FF8A8A]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'} text-[11px] px-2 py-0.5 rounded-full font-bold`}>
                {staticErrors.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              staticExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-[#E5EBE8] flex flex-col p-3 space-y-2 bg-white">
                  {staticErrors.map((err, i) => (
                    <div key={i} className={`text-sm font-medium ${err.severity === 'error' ? 'text-[#ef4444] bg-[#ef4444]/5 border-[#ef4444]/10' : 'text-[#d97706] bg-[#f59e0b]/5 border-[#f59e0b]/10'} p-2.5 rounded-lg border break-words leading-relaxed`}>
                      <div className="flex items-start gap-2.5">
                        {err.severity === 'error' ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <p><span className="font-bold opacity-75">Line {err.line}:</span> {err.message}</p>
                          {err.hint && <p className="text-xs italic opacity-70 mt-1.5 font-medium">Tip: {err.hint}</p>}
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
          <div className="border border-[#E5EBE8] rounded-xl bg-white overflow-hidden shadow-sm">
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-[#F3F4F3] transition-colors text-sm font-bold text-[#2C5E4A]"
              onClick={() => setRuntimeExpanded(!runtimeExpanded)}
            >
              <div className="flex items-center gap-2">
                {runtimeExpanded ? <ChevronDown size={16} className="text-[#82b49b]" /> : <ChevronRight size={16} className="text-[#82b49b]" />}
                <span>Runtime Warnings</span>
              </div>
              <span className="bg-[#f59e0b]/10 text-[#f59e0b] text-[11px] px-2 py-0.5 rounded-full font-bold">
                {runtimeWarnings.length}
              </span>
            </button>
            
            <div className={clsx(
              "grid transition-all duration-300 ease-in-out",
              runtimeExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className="border-t border-[#E5EBE8] flex flex-col bg-white">
                  {runtimeWarnings.map((warn, i) => (
                    <div key={i} className="p-3 border-b last:border-b-0 border-[#E5EBE8]">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[#d97706] leading-relaxed">
                            {warn}
                          </p>
                        </div>
                      </div>
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
