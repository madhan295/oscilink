import React, { useState } from 'react';
import { PanelLeft, PanelRight, Play, Square, FileCode2, FolderOpen, Save, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { UndoRedoButtons } from './UndoRedoButtons';
import { useCompiler } from '../../hooks/useCompiler';
import { useSimulation } from '../../hooks/useSimulation';
import { Tooltip } from './Tooltip';
import { useEditorStore, DEFAULT_CODE } from '../../store/editorStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { deserializeProject, loadProjectFromFile } from '../../utils/projectSerializer';
import { CodeEditorRef } from '../editor/CodeEditor';
import toast from 'react-hot-toast';
import { UserMenu } from './UserMenu';
import { HelpMenu } from './HelpMenu';
import { clsx } from 'clsx';

interface ToolbarProps {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean) => void;
  errorPanelOpen: boolean;
  setErrorPanelOpen: (open: boolean) => void;
  editorRef: React.RefObject<CodeEditorRef>;
}

export function Toolbar({ leftOpen, setLeftOpen, rightOpen, setRightOpen, errorPanelOpen, setErrorPanelOpen, editorRef }: ToolbarProps) {
  const { compile } = useCompiler();
  const simulation = useSimulation();
  const { setSaveOptionsModalOpen } = useUiStore();
  const isCompiling = useEditorStore(state => state.isCompiling);
  const compilationErrors = useEditorStore(state => state.compilationErrors);
  const staticErrors = useEditorStore(state => state.staticErrors);
  const compiledHex = useEditorStore(state => state.compiledHex);
  const status = useSimulationStore(state => state.status);
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const runtimeWarnings = useSimulationStore(state => state.runtimeWarnings);
  
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace);
  const setCode = useEditorStore(state => state.setCode);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'new' | 'open'>('new');

  const staticErrorCount = staticErrors.filter(e => e.severity === 'error').length;
  const staticWarningCount = staticErrors.filter(e => e.severity === 'warning').length;
  const totalErrors = compilationErrors.length + staticErrorCount + circuitErrors.filter(e => e.severity === 'error').length;
  const totalWarnings = runtimeWarnings.length + staticWarningCount + circuitErrors.filter(e => e.severity === 'warning').length;
  const hasDiagnostics = totalErrors > 0 || totalWarnings > 0 || circuitErrors.length > 0;

  const handleNewProject = () => {
    setConfirmAction('new');
    setShowConfirmModal(true);
  };

  const executeNewProject = () => {
    resetWorkspace();
    setCode(DEFAULT_CODE);
    setShowConfirmModal(false);
  };

  const executeOpenProject = async () => {
    setShowConfirmModal(false);
    try {
      const data = await loadProjectFromFile();
      deserializeProject(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to open project');
    }
  };

  const handleOpenProject = () => {
    if (useWorkspaceStore.getState().components.length > 0) {
      setConfirmAction('open');
      setShowConfirmModal(true);
    } else {
      executeOpenProject();
    }
  };

  const handleRun = () => {
    if (!compiledHex) {
      toast.error('Please compile the code first');
      return;
    }
    const serializedGraph = useWorkspaceStore.getState().buildCircuitGraph();
    simulation.initialize(compiledHex, serializedGraph);
    simulation.start();
  };

  const handleCompile = () => {
    compile(editorRef);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex justify-center">
      <header className="w-full h-[60px] bg-white rounded-2xl flex items-center justify-between px-3 pointer-events-auto border border-black/5">
        
        {/* Left Section */}
        <div className="flex items-center gap-4 pl-1 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src="/favicon.svg" alt="Oscilink Logo" className="w-6 h-7 object-contain" />
            </div>
            <h1 className="text-lg font-bold text-[#2C5E4A] tracking-tight whitespace-nowrap">Oscilink</h1>
          </div>
          
          <div className="h-6 w-px bg-black/10 mx-2" />
          
          <div className="flex items-center gap-1 text-[#2C5E4A]">
            <Tooltip position="bottom" content="New Project" shortcut="Ctrl+N">
              <button className="p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors" onClick={handleNewProject}>
                <FileCode2 size={18} />
              </button>
            </Tooltip>
            <Tooltip position="bottom" content="Open Project" shortcut="Ctrl+O">
              <button className="p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors" onClick={handleOpenProject}>
                <FolderOpen size={18} />
              </button>
            </Tooltip>
            <Tooltip position="bottom" content="Save Project" shortcut="Ctrl+S">
              <button className="p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors" onClick={() => setSaveOptionsModalOpen(true)}>
                <Save size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Center Section: Controls */}
        <div className="flex items-center bg-[#F3F4F3] h-11 rounded-full pr-1.5 pl-5 gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 text-[#2C5E4A]">
            <button 
              onClick={handleRun} 
              disabled={status === 'RUNNING'} 
              className="hover:opacity-70 transition-opacity disabled:opacity-30"
              title="Run Simulation"
            >
              <Play size={16} fill={status === 'RUNNING' ? 'none' : 'currentColor'} /> 
            </button>
            <button 
              onClick={() => simulation.stop()} 
              disabled={status !== 'RUNNING'} 
              className="hover:opacity-70 transition-opacity disabled:opacity-30"
              title="Stop Simulation"
            >
              <Square size={16} fill={status === 'RUNNING' ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="h-5 w-[1.5px] bg-[#D1D5D4] ml-1" />

          <button 
            onClick={handleCompile}
            disabled={isCompiling || status === 'RUNNING'}
            className="h-[34px] px-4 bg-[#3C6A56] hover:bg-[#2F5343] text-white rounded-full flex items-center gap-2 text-[13px] font-semibold transition-colors disabled:opacity-70"
          >
            {isCompiling ? 'Compiling...' : 'Compile'}
            <Zap size={14} fill="currentColor" className="opacity-90" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2 pr-1 flex-1">
          <div className="flex items-center gap-1 text-[#2C5E4A]">
            <UndoRedoButtons />
          </div>

          <div className="h-6 w-px bg-black/10 mx-2" />

          <div className="flex items-center gap-1 text-[#2C5E4A]">
            {hasDiagnostics && (
              <Tooltip position="bottom" content="Toggle Diagnostics Panel">
                <button 
                  className={clsx('p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors', errorPanelOpen && 'bg-[#2C5E4A]/15')}
                  onClick={() => setErrorPanelOpen(!errorPanelOpen)} 
                >
                  <div className="relative flex items-center justify-center">
                    {totalErrors > 0 ? <AlertCircle size={18} className="text-error" /> : <AlertTriangle size={18} className="text-accent-orange" />}
                    <span className={clsx('absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full', totalErrors > 0 ? 'bg-error' : 'bg-accent-orange')}>
                      {totalErrors > 0 ? totalErrors : totalWarnings > 0 ? totalWarnings : circuitErrors.length}
                    </span>
                  </div>
                </button>
              </Tooltip>
            )}

            <Tooltip position="bottom" content="Toggle Editor Panel">
              <button className={clsx('p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors', leftOpen && 'bg-[#2C5E4A]/15')} onClick={() => setLeftOpen(!leftOpen)}>
                <PanelLeft size={18} />
              </button>
            </Tooltip>
            
            <Tooltip position="bottom" content="Toggle Properties Panel">
              <button className={clsx('p-2 rounded-md hover:bg-[#2C5E4A]/10 text-[#2C5E4A] transition-colors', rightOpen && 'bg-[#2C5E4A]/15')} onClick={() => setRightOpen(!rightOpen)}>
                <PanelRight size={18} />
              </button>
            </Tooltip>
            
            <div className="ml-1 flex items-center justify-center">
              <HelpMenu />
            </div>
          </div>
          
          <div className="ml-3">
            <UserMenu />
          </div>
        </div>
      </header>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-white border border-[#E5EBE8] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-full max-w-sm p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-[#2C5E4A]">
              {confirmAction === 'new' ? 'Create New Project' : 'Open Project'}
            </h2>
            <p className="text-sm text-[#6A7B76] font-medium leading-relaxed">
              {confirmAction === 'new' 
                ? 'Are you sure you want to start a new project? Any unsaved changes will be lost.' 
                : 'Opening a project will discard your current work. Continue?'}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                className="px-5 py-2 rounded-full text-sm font-bold bg-black/5 hover:bg-black/10 text-[#2C5E4A] transition-colors"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2 rounded-full text-sm font-bold bg-[#2C5E4A] hover:bg-[#1E4334] text-white shadow-sm transition-colors"
                onClick={confirmAction === 'new' ? executeNewProject : executeOpenProject}
              >
                {confirmAction === 'new' ? 'Start Fresh' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
