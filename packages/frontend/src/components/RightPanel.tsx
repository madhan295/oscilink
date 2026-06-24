import { useEffect, useState } from 'react';
import { Terminal, AlertCircle, Code, Settings2, HelpCircle } from 'lucide-react';
import { SerialMonitor } from './editor/SerialMonitor';
import { ProblemsPanel } from './ui/ProblemsPanel';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { CodeEditor, CodeEditorRef } from './editor/CodeEditor';
import { useEditorStore } from '../store/editorStore';
import { useSimulationStore } from '../store/simulationStore';
import { useWorkspaceStore } from '../store/workspaceStore';

type Tab = 'code' | 'problems' | 'serial' | 'properties';

interface RightPanelProps {
  editorRef: React.RefObject<CodeEditorRef>;
}

export function RightPanel({ editorRef }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('code');

  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const staticErrors = useEditorStore(state => state.staticErrors);
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const runtimeWarnings = useSimulationStore(state => state.runtimeWarnings);
  const selectedComponentIds = useWorkspaceStore(state => state.selectedComponentIds);
  
  useEffect(() => {
    if (selectedComponentIds.length > 0) {
      setActiveTab('properties');
    } else if (activeTab === 'properties') {
      setActiveTab('code');
    }
  }, [selectedComponentIds]);
  
  const errorCount = compilationErrors.length + staticErrors.filter(e => e.severity === 'error').length + circuitErrors.filter(e => e.severity === 'error').length;
  const warningCount = staticErrors.filter(e => e.severity === 'warning').length + circuitErrors.filter(e => e.severity === 'warning').length + runtimeWarnings.length;

  const totalDiagnostics = errorCount + warningCount;
  
  let badgeColor = 'bg-black/5 text-[#6A7B76]';
  if (errorCount > 0) {
    badgeColor = 'bg-[#FCEAEB] text-[#FF8A8A]';
  } else if (warningCount > 0) {
    badgeColor = 'bg-[#FFF2E5] text-[#FFA048]';
  }

  return (
    <aside className="w-full h-full bg-white flex flex-col rounded-2xl overflow-hidden border border-black/5">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-[#E5EBE8] bg-white px-2 pt-2">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 ${
            activeTab === 'code'
              ? 'border-[#2C5E4A] text-[#2C5E4A]'
              : 'border-transparent text-[#6A7B76] hover:text-[#2C5E4A] hover:bg-black/5'
          }`}
        >
          <Code size={16} />
          Code
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 ${
            activeTab === 'problems'
              ? 'border-[#2C5E4A] text-[#2C5E4A]'
              : 'border-transparent text-[#6A7B76] hover:text-[#2C5E4A] hover:bg-black/5'
          }`}
        >
          <AlertCircle size={16} />
          Problems
          {totalDiagnostics > 0 && (
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeColor}`}>
              {totalDiagnostics}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('serial')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 ${
            activeTab === 'serial'
              ? 'border-[#2C5E4A] text-[#2C5E4A]'
              : 'border-transparent text-[#6A7B76] hover:text-[#2C5E4A] hover:bg-black/5'
          }`}
        >
          <Terminal size={16} />
          Serial
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 ${
            activeTab === 'properties'
              ? 'border-[#2C5E4A] text-[#2C5E4A]'
              : 'border-transparent text-[#6A7B76] hover:text-[#2C5E4A] hover:bg-black/5'
          }`}
        >
          <Settings2 size={16} />
          Properties
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative bg-white">
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

        {/* Properties Panel Tab */}
        <div className={`absolute inset-0 overflow-hidden ${activeTab === 'properties' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <PropertiesPanel />
        </div>
      </div>
    </aside>
  );
}
