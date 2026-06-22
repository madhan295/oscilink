import { useEffect, useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useEditorStore } from '../../store/editorStore';
import { 
  X, 
  Plus, 
  Cpu, 
  Trash2, 
  Globe, 
  Lock, 
  Edit2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { 
  loadProjectsForCurrentUser, 
  deleteProject, 
  toggleProjectVisibility, 
  renameProject, 
  loadProjectById,
  ProjectSummary
} from '../../services/projectService';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './Button';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export function MyProjectsPanel() {
  const { isMyProjectsOpen, setMyProjectsOpen } = useUiStore();
  const resetWorkspace = useWorkspaceStore(state => state.resetWorkspace);
  const setCode = useEditorStore(state => state.setCode);
  
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadProjectsForCurrentUser();
      setProjects(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMyProjectsOpen) {
      fetchProjects();
    }
  }, [isMyProjectsOpen]);

  if (!isMyProjectsOpen) return null;

  const handleNewProject = () => {
    if (confirm('Are you sure you want to start a new project? Any unsaved changes will be lost.')) {
      resetWorkspace();
      setCode('');
      setMyProjectsOpen(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setMyProjectsOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-[380px] bg-elevated border-l border-border-default z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-surface">
          <h2 className="text-lg font-semibold text-text-primary">My Projects</h2>
          <button 
            onClick={() => setMyProjectsOpen(false)}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-surface-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-border-default bg-background flex-shrink-0">
          <Button 
            variant="primary" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleNewProject}
          >
            <Plus size={16} />
            New Project
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-surface rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <AlertCircle size={32} className="text-error" />
              <p className="text-text-secondary text-sm">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchProjects}>Try Again</Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70">
              <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-text-muted">
                <Cpu size={24} />
              </div>
              <p className="text-text-secondary">No projects yet</p>
              <Button variant="secondary" size="sm" onClick={handleNewProject}>Start Building</Button>
            </div>
          ) : (
            projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={() => setProjects(prev => prev.filter(p => p.id !== project.id))}
                onUpdate={(updated) => setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ProjectCard({ 
  project, 
  onDelete, 
  onUpdate 
}: { 
  project: ProjectSummary, 
  onDelete: () => void,
  onUpdate: (p: ProjectSummary) => void
}) {
  const { setMyProjectsOpen } = useUiStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  // Handle Double-click delete
  useEffect(() => {
    if (deleteConfirm) {
      const timer = setTimeout(() => setDeleteConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirm]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      onDelete();
      toast.success('Project deleted');
    } catch (e: any) {
      toast.error('Failed to delete project');
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await toggleProjectVisibility(project.id, !project.is_public);
      onUpdate({ ...project, is_public: !project.is_public });
      toast.success(project.is_public ? 'Project made private' : 'Project made public');
    } catch (e: any) {
      toast.error('Failed to update visibility');
    }
  };

  const handleRename = async () => {
    if (!editName.trim() || editName === project.name) {
      setIsEditing(false);
      setEditName(project.name);
      return;
    }

    try {
      await renameProject(project.id, editName);
      onUpdate({ ...project, name: editName });
      setIsEditing(false);
    } catch (e: any) {
      toast.error('Failed to rename project');
    }
  };

  const handleOpen = async () => {
    const toastId = toast.loading('Loading project...');
    try {
      await loadProjectById(project.id);
      toast.dismiss(toastId);
      setMyProjectsOpen(false);
    } catch (e: any) {
      toast.error('Failed to load project', { id: toastId });
    }
  };

  return (
    <div className="group flex flex-col bg-surface hover:bg-surface-hover border border-border-subtle hover:border-border-default rounded-lg transition-all overflow-hidden shadow-sm relative">
      <div className="h-32 bg-background relative border-b border-border-subtle cursor-pointer" onClick={handleOpen}>
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted/30">
            <Cpu size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded px-2 py-0.5 flex items-center gap-1 border border-white/10">
          {project.is_public ? <Globe size={12} className="text-accent-blue" /> : <Lock size={12} className="text-text-muted" />}
          <span className="text-[10px] font-medium text-white">{project.is_public ? 'Public' : 'Private'}</span>
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input 
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                onBlur={handleRename}
                className="flex-1 bg-background border border-accent-blue rounded px-2 py-0.5 text-sm text-text-primary focus:outline-none"
              />
              <button onClick={handleRename} className="p-1 text-accent-blue hover:bg-accent-blue/10 rounded">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <h3 
              className="text-sm font-semibold text-text-primary truncate flex-1 cursor-pointer hover:text-accent-blue transition-colors"
              onClick={handleOpen}
            >
              {project.name}
            </h3>
          )}
        </div>
        
        {project.description && (
          <p className="text-xs text-text-muted line-clamp-2 mb-2 leading-relaxed">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-muted font-medium">
            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background rounded transition-colors"
              title="Rename"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={handleToggleVisibility}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-background rounded transition-colors"
              title={project.is_public ? "Make Private" : "Make Public"}
            >
              {project.is_public ? <Lock size={14} /> : <Globe size={14} />}
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className={clsx(
                "p-1.5 rounded transition-colors",
                deleteConfirm 
                  ? "bg-error/20 text-error hover:bg-error/30" 
                  : "text-text-secondary hover:text-error hover:bg-error/10"
              )}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
