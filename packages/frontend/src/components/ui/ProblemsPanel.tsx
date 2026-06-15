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
      <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-500 gap-3 min-h-[300px]">
        <CheckCircle size={48} className="text-green-500/50" />
        <p className="text-sm font-medium text-gray-400">No problems detected</p>
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
        <div className="border-b border-white/10 shrink-0">
          <button 
            onClick={() => setCircuitExpanded(!circuitExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-sm font-medium text-gray-200"
          >
            <div className="flex items-center gap-2">
              {circuitExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Circuit Problems</span>
            </div>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {circuitErrors.length}
            </span>
          </button>
          
          {circuitExpanded && (
            <div className="flex flex-col">
              {circuitErrors.map((err, i) => (
                <div 
                  key={i} 
                  className="flex flex-col gap-2 p-3 bg-red-500/5 border-l-2 border-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
                  onClick={() => err.affectedComponentIds && triggerFocus(err.affectedComponentIds)}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-red-300 font-medium text-sm">{err.type} Error</span>
                      <span className="text-gray-300 text-xs mt-1">{err.message}</span>
                      {err.hint && <span className="text-blue-400 text-xs mt-1">Hint: {err.hint}</span>}
                    </div>
                  </div>
                  {err.affectedComponentIds && err.affectedComponentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 ml-6">
                      {err.affectedComponentIds.map(id => (
                        <span 
                          key={id} 
                          onClick={(e) => { e.stopPropagation(); triggerFocus([id]); }}
                          className="flex items-center gap-1 bg-[#2A2B36] border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300 hover:bg-[#3A3B46]"
                        >
                          <Cpu size={10} className="text-gray-400" />
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
        <div className="border-b border-white/10 shrink-0">
          <button 
            onClick={() => setCodeExpanded(!codeExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-sm font-medium text-gray-200"
          >
            <div className="flex items-center gap-2">
              {codeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Code Errors</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${codeIssues.some(e => e.severity === 'error' || !e.isStatic) ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {codeIssues.length}
            </span>
          </button>
          
          {codeExpanded && (
            <div className="flex flex-col">
              {codeIssues.map((err, i) => {
                const isError = err.severity === 'error' || !err.isStatic;
                return (
                  <div key={i} className={`flex flex-col gap-2 p-3 border-l-2 ${isError ? 'bg-red-500/5 border-red-500' : 'bg-orange-500/5 border-orange-500'}`}>
                    <div className="flex items-start gap-2">
                      {isError ? <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-orange-400 shrink-0 mt-0.5" />}
                      <div className="flex flex-col min-w-0">
                        <span className={`${isError ? 'text-red-300' : 'text-orange-300'} font-medium text-sm flex items-center gap-2`}>
                          {err.isStatic ? 'Static Analysis' : 'Compilation Error'}
                          <button 
                            onClick={() => handleJumpToLine(err.line)}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded transition-colors"
                          >
                            Line {err.line}
                          </button>
                        </span>
                        <span className="text-gray-300 text-xs mt-1 font-mono whitespace-pre-wrap">{err.message}</span>
                        {err.hint && <span className="text-blue-400 text-xs mt-1">Hint: {err.hint}</span>}
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
        <div className="border-b border-white/10 shrink-0">
          <div className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-sm font-medium text-gray-200">
            <button 
              onClick={() => setRuntimeExpanded(!runtimeExpanded)}
              className="flex items-center gap-2"
            >
              {runtimeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Runtime Warnings</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                {runtimeWarnings.length}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); clearRuntimeWarnings(); }}
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="Clear Runtime Warnings"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          {runtimeExpanded && (
            <div className="flex flex-col">
              {runtimeWarnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-yellow-500/5 border-l-2 border-yellow-500">
                  <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-xs leading-relaxed">{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
