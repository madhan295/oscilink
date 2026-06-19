import { useState } from 'react';
import { Terminal, AlertCircle, Code } from 'lucide-react';
import { SerialMonitor } from './editor/SerialMonitor';
import { ProblemsPanel } from './ui/ProblemsPanel';
import { CodeEditor, CodeEditorRef } from './editor/CodeEditor';
import { useEditorStore } from '../store/editorStore';
import { useSimulationStore } from '../store/simulationStore';

type Tab = 'code' | 'problems' | 'serial';

interface RightPanelProps {
  editorRef: React.RefObject<CodeEditorRef>;
}

export function RightPanel({ editorRef }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('code');

  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const staticErrors = useEditorStore(state => state.staticErrors);
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const runtimeWarnings = useSimulationStore(state => state.runtimeWarnings);
  
  const errorCount = compilationErrors.length + staticErrors.filter(e => e.severity === 'error').length + circuitErrors.filter(e => e.severity === 'error').length;
  const warningCount = staticErrors.filter(e => e.severity === 'warning').length + circuitErrors.filter(e => e.severity === 'warning').length + runtimeWarnings.length;

  const totalDiagnostics = errorCount + warningCount;
  
  let badgeColor = 'bg-gray-500/20 text-gray-400';
  if (errorCount > 0) {
    badgeColor = 'bg-red-500/20 text-red-400';
  } else if (warningCount > 0) {
    badgeColor = 'bg-orange-500/20 text-orange-400';
  }

  return (
    <aside className="w-full h-full bg-surface border-l border-border flex flex-col">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-border bg-[#1E1E1E]">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'code'
              ? 'border-primary text-primary bg-[#1A1B26]'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Code size={15} />
          Code
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'problems'
              ? 'border-primary text-primary bg-[#1A1B26]'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <AlertCircle size={15} />
          Problems
          {totalDiagnostics > 0 && (
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeColor}`}>
              {totalDiagnostics}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('serial')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'serial'
              ? 'border-primary text-primary bg-[#1A1B26]'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Terminal size={15} />
          Serial
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative bg-[#1A1B26]">
        {/* Render Code Editor but hide it when inactive to preserve state */}
        <div id="tour-code-editor" className={`absolute inset-0 flex flex-col ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <CodeEditor ref={editorRef} />
        </div>

        {activeTab === 'problems' && (
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            <ProblemsPanel editorRef={editorRef} />
          </div>
        )}

        {/* Keep SerialMonitor rendered but hidden to not lose its state */}
        <div className={`absolute inset-0 ${activeTab === 'serial' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SerialMonitor />
        </div>
      </div>
    </aside>
  );
}
