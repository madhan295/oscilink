import React, { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { downloadProject } from '../../utils/projectSerializer';
import { X, HardDrive, Cloud, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import toast from 'react-hot-toast';

export function SaveOptionsModal() {
  const { isSaveOptionsModalOpen, setSaveOptionsModalOpen, setSaveProjectModalOpen, setAuthModalOpen } = useUiStore();
  const { isAuthenticated } = useAuthStore();
  const currentProjectName = useWorkspaceStore(state => state.currentProjectName);
  
  const [step, setStep] = useState<'choose' | 'warning'>('choose');

  if (!isSaveOptionsModalOpen) return null;

  const handleClose = () => {
    setSaveOptionsModalOpen(false);
    setTimeout(() => setStep('choose'), 200); // reset after animation
  };

  const handleLocalSave = () => {
    const name = currentProjectName === 'Untitled Project' ? 'My_Circuit' : currentProjectName;
    downloadProject(name);
    handleClose();
  };

  const handleCloudClick = () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to save to the cloud.');
      setAuthModalOpen(true);
      handleClose();
      return;
    }
    setStep('warning');
  };

  const handleCloudConfirm = () => {
    handleClose();
    setSaveProjectModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
      <div 
        className="bg-elevated border border-border-default rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">
            {step === 'choose' ? 'Save Project' : 'Cloud Storage Warning'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'choose' ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary mb-4">
                Where would you like to save your project?
              </p>
              
              <div 
                className="p-4 rounded-lg border border-border-default hover:border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer flex gap-4 transition-colors items-center"
                onClick={handleLocalSave}
              >
                <div className="w-10 h-10 rounded-full bg-accent-orange/10 text-accent-orange flex items-center justify-center flex-shrink-0">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Save to Computer (Local)</h4>
                  <p className="text-xs text-text-muted mt-1">Download a .json file to your hard drive. Safe forever.</p>
                </div>
              </div>

              <div 
                className="p-4 rounded-lg border border-border-default hover:border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer flex gap-4 transition-colors items-center"
                onClick={handleCloudClick}
              >
                <div className="w-10 h-10 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center flex-shrink-0">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Save to Cloud</h4>
                  <p className="text-xs text-text-muted mt-1">Access your project from anywhere. Requires login.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Temporary Cloud Storage</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Please note that projects saved to the cloud will only be stored for <strong>1 week</strong>. After that, they may be automatically deleted. 
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mt-2">
                  For permanent storage, please use the Local Save option to download the file to your computer.
                </p>
              </div>
              
              <div className="w-full flex gap-3 mt-4 pt-4 border-t border-border-default">
                <Button 
                  className="flex-1" 
                  variant="secondary"
                  onClick={() => setStep('choose')}
                >
                  Go Back
                </Button>
                <Button 
                  className="flex-1" 
                  variant="primary"
                  onClick={handleCloudConfirm}
                >
                  I Understand, Proceed
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
