import React, { useState, useRef, useEffect } from 'react';
import { File, FolderOpen, Save, BookOpen, ChevronRight } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useEditorStore, DEFAULT_CODE } from '../../store/editorStore';
import { useSimulationStore } from '../../store/simulationStore';
import { deserializeProject, downloadProject, loadProjectFromFile } from '../../utils/projectSerializer';
import { exampleProjects } from '../../data/exampleProjects';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export const FileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('My Arduino Project');
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const components = useWorkspaceStore((state: any) => state.components);
  
  // Close menu on click outside and listen to custom events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowExamples(false);
      }
    };

    const handleOpenSaveModal = () => {
      setShowSaveModal(true);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('open-save-modal', handleOpenSaveModal);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('open-save-modal', handleOpenSaveModal);
    };
  }, []);

  const executeNewProject = () => {
    useWorkspaceStore.getState().loadProject([], [], { x: 0, y: 0, scale: 1 });
    useEditorStore.getState().setCode(DEFAULT_CODE);
    useSimulationStore.getState().resetSimulation?.();
    toast.success("New project created");
    setIsOpen(false);
  };

  const handleNewProject = () => {
    if (components.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: "Create New Project",
        message: "Are you sure you want to create a new project? Unsaved changes will be lost.",
        onConfirm: () => {
          executeNewProject();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    executeNewProject();
  };

  const executeOpenProject = async () => {
    try {
      const data = await loadProjectFromFile();
      deserializeProject(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to open project');
    }
    setIsOpen(false);
  };

  const handleOpenProject = async () => {
    if (components.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: "Open Project",
        message: "Opening a project will discard your current work. Continue?",
        onConfirm: () => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          executeOpenProject();
        }
      });
      return;
    }
    executeOpenProject();
  };

  const handleSaveProject = () => {
    setIsOpen(false);
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    if (projectName.trim()) {
      downloadProject(projectName.trim());
      setShowSaveModal(false);
    }
  };

  const executeLoadExample = (index: number) => {
    deserializeProject(exampleProjects[index]);
    setIsOpen(false);
    setShowExamples(false);
  };

  const handleLoadExample = (index: number) => {
    if (components.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: "Load Example",
        message: "Loading an example will discard your current work. Continue?",
        onConfirm: () => {
          executeLoadExample(index);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    executeLoadExample(index);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={clsx("px-3 py-1.5 rounded text-sm font-medium transition-colors hover:bg-surface-hover text-text", isOpen && "bg-surface-active")}
      >
        File
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded shadow-xl py-1 z-50 text-sm">
          <button 
            onClick={handleNewProject}
            className="w-full text-left px-4 py-2 hover:bg-surface-hover flex items-center gap-2 text-text"
          >
            <File size={16} className="text-text-secondary" />
            New Project
          </button>
          <button 
            onClick={handleOpenProject}
            className="w-full text-left px-4 py-2 hover:bg-surface-hover flex items-center gap-2 text-text"
          >
            <FolderOpen size={16} className="text-text-secondary" />
            Open from File...
          </button>
          <button 
            onClick={handleSaveProject}
            className="w-full text-left px-4 py-2 hover:bg-surface-hover flex items-center gap-2 text-text"
          >
            <Save size={16} className="text-text-secondary" />
            Save as File...
          </button>

          <div className="h-px bg-border my-1" />

          {/* Examples Submenu */}
          <div 
            className="relative"
            onMouseEnter={() => setShowExamples(true)}
            onMouseLeave={() => setShowExamples(false)}
          >
            <button className="w-full text-left px-4 py-2 hover:bg-surface-hover flex items-center justify-between text-text">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-text-secondary" />
                Examples
              </div>
              <ChevronRight size={14} className="text-text-secondary" />
            </button>
            
            {showExamples && (
              <div className="absolute top-0 left-full ml-0.5 w-48 bg-surface border border-border rounded shadow-xl py-1 z-50">
                {exampleProjects.map((proj: any, idx: number) => (
                  <button 
                    key={proj.name}
                    onClick={() => handleLoadExample(idx)}
                    className="w-full text-left px-4 py-2 hover:bg-surface-hover text-text truncate"
                    title={proj.description}
                  >
                    {proj.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-lg shadow-2xl w-96 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text">Save Project</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">Project Name</label>
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmSave();
                  if (e.key === 'Escape') setShowSaveModal(false);
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text outline-none focus:border-blue-500 transition-colors"
                autoFocus
                placeholder="Enter project name..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded text-sm font-medium hover:bg-surface-hover text-text transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSave}
                disabled={!projectName.trim()}
                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-lg shadow-2xl w-96 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text">{confirmConfig.title}</h2>
            <p className="text-sm text-text-secondary">{confirmConfig.message}</p>
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded text-sm font-medium hover:bg-surface-hover text-text transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
