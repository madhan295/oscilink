import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, CheckCircle, Cpu, Trash2 } from 'lucide-react';
import { CodeEditorRef } from '../editor/CodeEditor';

interface ProblemsPanelProps {
  editorRef?: React.RefObject<CodeEditorRef>;
}

export function ProblemsPanel({ editorRef }: ProblemsPanelProps) {
  const [circuitExpanded, setCircuitExpanded] = useState(true);
  const [codeExpanded, setCodeExpanded] = useState(true);
  const [runtimeExpanded, setRuntimeExpanded] = useState(true);

  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const staticErrors = useEditorStore(state => state.staticErrors);
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const runtimeWarnings = useSimulationStore(state => state.runtimeWarnings);
  const clearRuntimeWarnings = useSimulationStore(state => state.clearRuntimeWarnings);
  const triggerFocus = useWorkspaceStore(state => state.triggerFocus);

  // Merge compilation and static errors
  const codeIssues = [
    ...compilationErrors.map(e => ({ ...e, isStatic: false })),
    ...staticErrors.map(e => ({ ...e, isStatic: true }))
  ];

  const isEmpty = circuitErrors.length === 0 && codeIssues.length === 0 && runtimeWarnings.length === 0;

  if (isEmpty) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-[#6A7B76] gap-3 min-h-[300px]">
        <CheckCircle size={48} className="text-[#82b49b]/50" />
        <p className="text-sm font-bold text-[#6A7B76]">No problems detected</p>
      </div>
    );
  }

  const handleJumpToLine = (line: number) => {
    if (editorRef?.current) {
      editorRef.current.jumpToLine(line);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Circuit Problems */}
      {circuitErrors.length > 0 && (
        <div className="border-b border-[#E5EBE8] shrink-0">
          <button 
            onClick={() => setCircuitExpanded(!circuitExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors text-[13px] font-bold text-[#2C5E4A]/70 hover:text-[#2C5E4A]"
          >
            <div className="flex items-center gap-2">
              {circuitExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Circuit Problems</span>
            </div>
            <span className="bg-[#d2e8d6] text-[#2C5E4A] text-[11px] px-2 py-0.5 rounded-full">
              {circuitErrors.length}
            </span>
          </button>
          
          {circuitExpanded && (
            <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
              {circuitErrors.map((err, i) => (
                <div 
                  key={i} 
                  className="flex flex-col gap-2 p-4 bg-[#F3F4F3] rounded-xl cursor-pointer hover:bg-[#d2e8d6] transition-colors"
                  onClick={() => err.affectedComponentIds && triggerFocus(err.affectedComponentIds)}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[#2C5E4A] shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[#2C5E4A] font-bold text-sm tracking-wide">{err.type} Error</span>
                      <span className="text-[#B5C2BF] font-medium text-[13px] mt-1">{err.message}</span>
                      {err.hint && <span className="text-[#5B9DF6] font-medium text-[13px] mt-2">Hint: {err.hint}</span>}
                    </div>
                  </div>
                  {err.affectedComponentIds && err.affectedComponentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-6">
                      {err.affectedComponentIds.map(id => (
                        <span 
                          key={id} 
                          onClick={(e) => { e.stopPropagation(); triggerFocus([id]); }}
                          className="flex items-center gap-1.5 bg-[#2C5E4A] px-2 py-1 rounded text-[11px] text-white/90 hover:bg-[#1a382c] transition-colors"
                        >
                          <Cpu size={12} className="text-white/70" />
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Code Errors */}
      {codeIssues.length > 0 && (
        <div className="border-b border-[#E5EBE8] shrink-0">
          <button 
            onClick={() => setCodeExpanded(!codeExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors text-[13px] font-bold text-[#2C5E4A]/70 hover:text-[#2C5E4A]"
          >
            <div className="flex items-center gap-2">
              {codeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Code Errors</span>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${codeIssues.some(e => e.severity === 'error' || !e.isStatic) ? 'bg-[#d2e8d6] text-[#2C5E4A]' : 'bg-[#FFF2E5] text-[#FFA048]'}`}>
              {codeIssues.length}
            </span>
          </button>
          
          {codeExpanded && (
            <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
              {codeIssues.map((err, i) => {
                const isError = err.severity === 'error' || !err.isStatic;
                return (
                  <div key={i} className={`flex flex-col gap-2 p-4 rounded-xl ${isError ? 'bg-[#F3F4F3] hover:bg-[#d2e8d6] transition-colors cursor-pointer' : 'bg-[#FFF9F2]'}`}>
                    <div className="flex items-start gap-2">
                      {isError ? <AlertCircle size={16} className="text-[#2C5E4A] shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-[#FFA048] shrink-0 mt-0.5" />}
                      <div className="flex flex-col min-w-0">
                        <span className={`${isError ? 'text-[#2C5E4A]' : 'text-[#FFA048]'} font-bold text-sm tracking-wide flex items-center gap-2`}>
                          {err.isStatic ? 'Static Analysis' : 'Compilation Error'}
                          <button 
                            onClick={() => handleJumpToLine(err.line)}
                            className="bg-black/5 hover:bg-black/10 text-[#6A7B76] text-[10px] px-1.5 py-0.5 rounded transition-colors font-bold"
                          >
                            Line {err.line}
                          </button>
                        </span>
                        <span className="text-[#B5C2BF] font-medium text-[13px] mt-1 font-mono whitespace-pre-wrap">{err.message}</span>
                        {err.hint && <span className="text-[#5B9DF6] font-medium text-[13px] mt-2">Hint: {err.hint}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Runtime Warnings */}
      {runtimeWarnings.length > 0 && (
        <div className="border-b border-[#E5EBE8] shrink-0">
          <div className="w-full flex items-center justify-between p-3 hover:bg-black/5 transition-colors text-[13px] font-bold text-[#2C5E4A]/70 hover:text-[#2C5E4A]">
            <button 
              onClick={() => setRuntimeExpanded(!runtimeExpanded)}
              className="flex items-center gap-2"
            >
              {runtimeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Runtime Warnings</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="bg-[#FFF2E5] text-[#FFA048] text-[11px] px-2 py-0.5 rounded-full">
                {runtimeWarnings.length}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); clearRuntimeWarnings(); }}
                className="p-1 hover:bg-black/5 rounded text-[#B5C2BF] hover:text-[#6A7B76] transition-colors"
                title="Clear Runtime Warnings"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          {runtimeExpanded && (
            <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
              {runtimeWarnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2 p-4 bg-[#FFF9F2] rounded-xl">
                  <AlertTriangle size={16} className="text-[#FFA048] shrink-0 mt-0.5" />
                  <span className="text-[#B5C2BF] font-medium text-[13px] leading-relaxed">{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
