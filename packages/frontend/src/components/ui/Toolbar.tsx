import { PanelLeft, PanelRight, Play, Loader2, Check } from 'lucide-react';
import { UndoRedoButtons } from './UndoRedoButtons';
import { useCompiler } from '../../hooks/useCompiler';
import { useSimulation } from '../../hooks/useSimulation';
import { useEditorStore } from '../../store/editorStore';
import { useSimulationStore } from '../../store/simulationStore';
import { CodeEditorRef } from '../editor/CodeEditor';

interface ToolbarProps {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean) => void;
  editorRef: React.RefObject<CodeEditorRef>;
}

export function Toolbar({ leftOpen, setLeftOpen, rightOpen, setRightOpen, editorRef }: ToolbarProps) {
  const { compile } = useCompiler();
  const simulation = useSimulation(); // Call this to ensure worker initializes
  const isCompiling = useEditorStore(state => state.isCompiling);
  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const status = useSimulationStore(state => state.status);

  const errorCount = compilationErrors.length;
  const showCheckmark = status === 'COMPILED' && errorCount === 0;

  return (
    <header className="h-[52px] min-h-[52px] bg-surface border-b border-border flex items-center px-4 gap-4">
      <h1 className="text-lg font-semibold text-primary">Oscilink</h1>
      <div className="h-6 w-px bg-border mx-2" />
      <UndoRedoButtons />
      
      <div className="h-6 w-px bg-border mx-2" />

      {/* Compile Button */}
      <button
        onClick={() => compile(editorRef)}
        disabled={isCompiling || status === 'RUNNING'}
        className="relative flex items-center gap-2 px-4 py-1.5 rounded bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
      >
        {isCompiling ? (
          <Loader2 size={16} className="animate-spin" />
        ) : showCheckmark ? (
          <Check size={16} />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
        <span className="font-medium text-sm">Compile</span>
        
        {/* Error count badge */}
        {errorCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {errorCount}
          </span>
        )}
      </button>

      <div className="flex items-center ml-auto gap-2 text-text-secondary">
        <button 
          onClick={() => setLeftOpen(!leftOpen)} 
          className={`p-1.5 rounded transition-colors ${leftOpen ? 'bg-surface-hover text-primary' : 'hover:bg-surface-hover'}`}
          title="Toggle Left Panel"
        >
          <PanelLeft size={18} />
        </button>
        <button 
          onClick={() => setRightOpen(!rightOpen)} 
          className={`p-1.5 rounded transition-colors ${rightOpen ? 'bg-surface-hover text-primary' : 'hover:bg-surface-hover'}`}
          title="Toggle Right Panel"
        >
          <PanelRight size={18} />
        </button>
      </div>
    </header>
  );
}
