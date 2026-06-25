import React, { useEffect, useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const UndoRedoButtons: React.FC = () => {
  const undo = useWorkspaceStore(state => state.undo);
  const redo = useWorkspaceStore(state => state.redo);
  const history = useWorkspaceStore(state => state.history);
  const historyIndex = useWorkspaceStore(state => state.historyIndex);

  const [flashUndo, setFlashUndo] = useState(false);
  const [flashRedo, setFlashRedo] = useState(false);

  useEffect(() => {
    const handleFlashUndo = () => {
      setFlashUndo(true);
      setTimeout(() => setFlashUndo(false), 200);
    };

    const handleFlashRedo = () => {
      setFlashRedo(true);
      setTimeout(() => setFlashRedo(false), 200);
    };

    document.addEventListener('flash-undo', handleFlashUndo);
    document.addEventListener('flash-redo', handleFlashRedo);

    return () => {
      document.removeEventListener('flash-undo', handleFlashUndo);
      document.removeEventListener('flash-redo', handleFlashRedo);
    };
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`p-1.5 rounded flex items-center justify-center transition-colors
          ${!canUndo ? 'opacity-40 cursor-not-allowed text-[#6A7B76]' : 'hover:bg-[#2C5E4A]/10 text-[#2C5E4A]'}
          ${flashUndo ? 'bg-[#3C6A56]/20 text-[#3C6A56]' : ''}
        `}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className={`p-1.5 rounded flex items-center justify-center transition-colors
          ${!canRedo ? 'opacity-40 cursor-not-allowed text-[#6A7B76]' : 'hover:bg-[#2C5E4A]/10 text-[#2C5E4A]'}
          ${flashRedo ? 'bg-[#3C6A56]/20 text-[#3C6A56]' : ''}
        `}
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
      >
        <Redo2 size={18} />
      </button>
    </div>
  );
};
