import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, PanelRight, Play, Loader2, Square, RotateCcw, Cpu, ChevronDown, FileCode2, FolderOpen, Save, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { UndoRedoButtons } from './UndoRedoButtons';
import { useCompiler } from '../../hooks/useCompiler';
import { useSimulation } from '../../hooks/useSimulation';
import { HelpMenu } from './HelpMenu';
import { Tooltip } from './Tooltip';
import { useEditorStore } from '../../store/editorStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { CodeEditorRef } from '../editor/CodeEditor';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { UserMenu } from './UserMenu';
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

const CheckIcon = ({ status, hasErrors }: { status: string, hasErrors: boolean }) => {
  if (hasErrors) return <AlertTriangle size={14} className="text-error" />;
  if (status === 'COMPILED') return <Check size={14} className="text-accent-green" />;
  return <Cpu size={14} />;
};

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

  const [compileDropdownOpen, setCompileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCompileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const staticErrorCount = staticErrors.filter(e => e.severity === 'error').length;
  const staticWarningCount = staticErrors.filter(e => e.severity === 'warning').length;
  const totalErrors = compilationErrors.length + staticErrorCount + circuitErrors.filter(e => e.severity === 'error').length;
  const totalWarnings = runtimeWarnings.length + staticWarningCount + circuitErrors.filter(e => e.severity === 'warning').length;
  const hasDiagnostics = totalErrors > 0 || totalWarnings > 0 || circuitErrors.length > 0;

  const handleRun = () => {
    setCompileDropdownOpen(false);
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

  const getStatusDisplay = () => {
    if (isCompiling) return { text: 'Compiling...', color: 'text-accent-orange', dot: <Loader2 size={12} className="animate-spin text-accent-orange" /> };
    if (status === 'RUNNING') return { text: 'Running', color: 'text-accent-green', dot: <div className="w-2 h-2 rounded-full bg-accent-green animate-status-pulse" /> };
    if (status === 'ERROR') return { text: 'Error', color: 'text-accent-red', dot: <div className="w-2 h-2 rounded-full bg-accent-red" /> };
    if (status === 'COMPILED') return { text: 'Ready', color: 'text-accent-blue', dot: <div className="w-2 h-2 rounded-full bg-accent-blue" /> };
    if (status === 'PAUSED') return { text: 'Paused', color: 'text-accent-orange', dot: <div className="w-2 h-2 rounded-full bg-accent-orange" /> };
    return { text: 'Idle', color: 'text-text-muted', dot: <div className="w-2 h-2 rounded-full bg-text-muted" /> };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <header className="h-14 min-h-[56px] bg-surface border-b border-border-default flex items-center justify-between px-4">
      {/* Left Section: Logo */}
      <div className="flex items-center gap-3 w-[240px] flex-shrink-0">
        <div className="bg-primary/10 p-1.5 rounded-md text-primary">
          <Cpu size={20} />
        </div>
        <h1 className="text-lg font-bold text-text-primary tracking-tight">Arduino Sim</h1>
      </div>
      
      {/* Center Section: Actions */}
      <div className="flex items-center gap-4 flex-1 justify-center min-w-max px-4">
        {/* File Operations */}
        <div className="flex items-center gap-1 bg-elevated p-1 rounded-md border border-border-subtle flex-shrink-0">
          <Tooltip position="bottom" content="New Project" shortcut="Ctrl+N">
            <Button variant="ghost" size="sm" className="px-2" onClick={() => toast('New project feature coming soon')}>
              <FileCode2 size={16} />
            </Button>
          </Tooltip>
          <Tooltip position="bottom" content="Open Project" shortcut="Ctrl+O">
            <Button variant="ghost" size="sm" className="px-2" onClick={() => toast('Open project feature coming soon')}>
              <FolderOpen size={16} />
            </Button>
          </Tooltip>
          <Tooltip position="bottom" content="Save Project" shortcut="Ctrl+S">
            <Button variant="ghost" size="sm" className="px-2" onClick={() => setSaveOptionsModalOpen(true)}>
              <Save size={16} />
            </Button>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-border-default" />

        <UndoRedoButtons />

        <div className="h-6 w-px bg-border-default" />

        {/* Action Group */}
        <div className="flex items-center gap-2">
          {/* Compile Dropdown trigger */}
          <div className="relative flex items-center" id="tour-run-button" ref={dropdownRef}>
            <Tooltip position="bottom" content="Compile and Run (Shift+Enter)">
              <Button
                variant="primary"
                onClick={handleCompile}
                isLoading={isCompiling}
                disabled={status === 'RUNNING'}
                className="rounded-r-none border-r border-primary-hover px-4"
                leftIcon={!isCompiling && <CheckIcon status={status} hasErrors={totalErrors > 0} />}
              >
                Compile
              </Button>
            </Tooltip>
            
            <Tooltip position="bottom" content="Run Options">
              <Button
                variant="primary"
                className="rounded-l-none px-2"
                onClick={() => setCompileDropdownOpen(!compileDropdownOpen)}
                disabled={isCompiling || status === 'RUNNING'}
              >
                <ChevronDown size={16} />
              </Button>
            </Tooltip>

            {compileDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-elevated border border-border-default rounded-md shadow-lg z-50 py-1">
                <button
                  onClick={handleRun}
                  disabled={status !== 'COMPILED'}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play size={14} />
                  Run Simulation
                </button>
              </div>
            )}
          </div>

          <Tooltip position="bottom" content="Stop Simulation">
            <Button 
              variant="danger" 
              onClick={() => simulation.stop()}
              disabled={status !== 'RUNNING'}
              leftIcon={<Square size={14} fill="currentColor" />}
            >
              Stop
            </Button>
          </Tooltip>
          
          <Tooltip position="bottom" content="Reset Simulation">
            <Button 
              variant="secondary" 
              onClick={() => simulation.reset()}
              disabled={status === 'IDLE' || isCompiling}
              leftIcon={<RotateCcw size={14} />}
            >
              Reset
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Right Section: Status & Tools */}
      <div className="flex items-center justify-end gap-4 w-[240px] flex-shrink-0">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-full border border-border-subtle shadow-sm">
          {statusDisplay.dot}
          <span className={clsx('text-xs font-medium', statusDisplay.color)}>
            {statusDisplay.text}
          </span>
        </div>

        <div className="h-6 w-px bg-border-default" />

        {/* Panel Toggles & Diagnostics */}
        <div className="flex items-center gap-1 text-text-secondary">
          {hasDiagnostics && (
            <Tooltip position="bottom" content="Toggle Diagnostics Panel">
              <Button 
                variant="ghost" 
                size="sm"
                className={clsx('px-2 relative', errorPanelOpen && 'bg-surface-hover text-primary')}
                onClick={() => setErrorPanelOpen(!errorPanelOpen)} 
              >
                {totalErrors > 0 ? <AlertCircle size={16} className="text-error" /> : <AlertTriangle size={16} className="text-accent-orange" />}
                <span className={clsx('absolute -top-1 -right-1 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full', totalErrors > 0 ? 'bg-error' : 'bg-accent-orange')}>
                  {totalErrors > 0 ? totalErrors : totalWarnings > 0 ? totalWarnings : circuitErrors.length}
                </span>
              </Button>
            </Tooltip>
          )}

          <Tooltip position="bottom" content="Toggle Editor Panel">
            <Button variant="ghost" size="sm" className={clsx('px-2', leftOpen && 'bg-surface-hover text-primary')} onClick={() => setLeftOpen(!leftOpen)}>
              <PanelLeft size={16} />
            </Button>
          </Tooltip>
          
          <Tooltip position="bottom" content="Toggle Properties Panel">
            <Button variant="ghost" size="sm" className={clsx('px-2', rightOpen && 'bg-surface-hover text-primary')} onClick={() => setRightOpen(!rightOpen)}>
              <PanelRight size={16} />
            </Button>
          </Tooltip>
          
          <HelpMenu />

          <div className="ml-2 flex items-center justify-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
