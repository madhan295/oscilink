import { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { downloadProject } from '../../utils/projectSerializer';
import { X, HardDrive, Cloud, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
      <div 
        className="bg-white border border-[#E5EBE8] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#E5EBE8]">
          <h2 className="text-lg font-bold text-[#2C5E4A]">
            {step === 'choose' ? 'Save Project' : 'Cloud Storage Warning'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-[#B5C2BF] hover:text-[#2C5E4A] p-1 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'choose' ? (
            <div className="space-y-4">
              <p className="text-sm text-[#6A7B76] font-medium mb-4">
                Where would you like to save your project?
              </p>
              
              <div 
                className="p-4 rounded-xl border border-[#E5EBE8] bg-white hover:bg-[#F3F4F3] hover:border-[#82b49b] cursor-pointer flex gap-4 transition-all items-center shadow-sm"
                onClick={handleLocalSave}
              >
                <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center flex-shrink-0">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2C5E4A]">Save to Computer (Local)</h4>
                  <p className="text-xs text-[#6A7B76] font-medium mt-1">Download a .json file to your hard drive. Safe forever.</p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl border border-[#E5EBE8] bg-white hover:bg-[#F3F4F3] hover:border-[#82b49b] cursor-pointer flex gap-4 transition-all items-center shadow-sm"
                onClick={handleCloudClick}
              >
                <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center flex-shrink-0">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2C5E4A]">Save to Cloud</h4>
                  <p className="text-xs text-[#6A7B76] font-medium mt-1">Access your project from anywhere. Requires login.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2C5E4A] mb-2">Cloud Storage is Beta</h3>
                <p className="text-sm text-[#6A7B76] font-medium">
                  Cloud saving is currently in beta. Please ensure you also download a local copy of your project periodically to prevent data loss.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-6">
                <button 
                  className="flex-1 py-2.5 rounded-full text-sm font-bold bg-black/5 hover:bg-black/10 text-[#2C5E4A] transition-colors"
                  onClick={() => setStep('choose')}
                >
                  Go Back
                </button>
                <button 
                  className="flex-1 py-2.5 rounded-full text-sm font-bold bg-[#3C6A56] hover:bg-[#2F5343] text-white transition-colors"
                  onClick={handleCloudConfirm}
                >
                  I Understand
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
