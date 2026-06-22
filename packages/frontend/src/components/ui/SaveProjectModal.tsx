import React, { useState, useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { saveProject } from '../../services/projectService';
import { X, Globe, Lock, Loader2, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import toast from 'react-hot-toast';

export function SaveProjectModal() {
  const { isSaveProjectModalOpen, setSaveProjectModalOpen } = useUiStore();
  const currentProjectName = useWorkspaceStore(state => state.currentProjectName);
  
  const [name, setName] = useState(currentProjectName);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isSaveProjectModalOpen) {
      setName(currentProjectName === 'Untitled Project' ? '' : currentProjectName);
      setSavedUrl(null);
      setCopied(false);
    }
  }, [isSaveProjectModalOpen, currentProjectName]);

  if (!isSaveProjectModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsSaving(true);
    try {
      const id = await saveProject(name.trim(), description.trim(), isPublic);
      toast.success('Project saved successfully!');
      
      if (isPublic) {
        // Construct a shareable URL assuming routing like /project/:id exists
        // Since we don't have routing yet, we'll just mock a URL format
        const url = `${window.location.origin}?project=${id}`;
        setSavedUrl(url);
      } else {
        setSaveProjectModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const copyUrl = () => {
    if (savedUrl) {
      navigator.clipboard.writeText(savedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
      <div 
        className="bg-elevated border border-border-default rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">Save to Cloud</h2>
          <button 
            onClick={() => setSaveProjectModalOpen(false)}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {savedUrl ? (
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
              <Check size={32} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1">Project Saved & Public!</h3>
              <p className="text-sm text-text-secondary">Anyone with the link can view your circuit.</p>
            </div>
            
            <div className="w-full flex items-center gap-2 mt-4 bg-background border border-border-default rounded-md p-2">
              <input 
                type="text" 
                readOnly 
                value={savedUrl} 
                className="flex-1 bg-transparent text-sm text-text-primary outline-none"
              />
              <Button size="sm" variant="secondary" onClick={copyUrl} className="flex-shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={() => setSaveProjectModalOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Blinking LED"
                className="w-full bg-background border border-border-default rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Description <span className="text-text-muted font-normal">(Optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this circuit do?"
                rows={3}
                className="w-full bg-background border border-border-default rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all resize-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-text-secondary">Visibility</label>
              
              <div 
                className={`p-3 rounded-lg border cursor-pointer flex gap-3 transition-colors ${!isPublic ? 'border-accent-blue bg-accent-blue/5' : 'border-border-default hover:border-border-subtle bg-surface'}`}
                onClick={() => setIsPublic(false)}
              >
                <div className={`mt-0.5 ${!isPublic ? 'text-accent-blue' : 'text-text-muted'}`}>
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${!isPublic ? 'text-accent-blue' : 'text-text-primary'}`}>Private</h4>
                  <p className="text-xs text-text-muted mt-0.5">Only you can see and edit this project.</p>
                </div>
              </div>

              <div 
                className={`p-3 rounded-lg border cursor-pointer flex gap-3 transition-colors ${isPublic ? 'border-accent-blue bg-accent-blue/5' : 'border-border-default hover:border-border-subtle bg-surface'}`}
                onClick={() => setIsPublic(true)}
              >
                <div className={`mt-0.5 ${isPublic ? 'text-accent-blue' : 'text-text-muted'}`}>
                  <Globe size={18} />
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${isPublic ? 'text-accent-blue' : 'text-text-primary'}`}>Public</h4>
                  <p className="text-xs text-text-muted mt-0.5">Anyone with the link can view. Only you can edit.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setSaveProjectModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSaving || !name.trim()}
                leftIcon={isSaving && <Loader2 size={16} className="animate-spin" />}
              >
                {isSaving ? 'Saving...' : 'Save Project'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
