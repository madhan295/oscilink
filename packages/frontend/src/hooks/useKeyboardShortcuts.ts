import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useUiStore } from '../store/uiStore';
import { createComponent } from '../utils/componentFactory';
export const isEditingText = (_e: KeyboardEvent | MouseEvent) => {
  const active = document.activeElement as HTMLElement;
  if (!active) return false;
  
  if (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA') {
    return true;
  }
  
  if (active.closest('.monaco-editor') || active.classList.contains('monaco-editor')) {
    return true;
  }
  
  return false;
};

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText(e)) return;

      const state = useWorkspaceStore.getState();

      // Ctrl+Z (Undo)
      if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
        document.dispatchEvent(new CustomEvent('flash-undo'));
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z (Redo)
      if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        state.redo();
        document.dispatchEvent(new CustomEvent('flash-redo'));
        return;
      }

      // Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        state.deleteSelected();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        state.cancelWireDrawing();
        state.clearSelection();
        return;
      }

      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        state.components.forEach(comp => state.selectComponent(comp.id, true));
        return;
      }

      // Ctrl+D (Duplicate)
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const selectedComponents = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selectedComponents.length > 0) {
          state.clearSelection();
          selectedComponents.forEach(comp => {
            const newComp = createComponent(comp.type, {
              x: comp.position.x + 24,
              y: comp.position.y + 24
            });
            newComp.properties = { ...comp.properties };
            newComp.rotation = comp.rotation;
            
            state.addComponent(newComp);
            state.selectComponent(newComp.id, true);
          });
        }
        return;
      }

      // R (Rotate)
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
        e.preventDefault();
        state.selectedComponentIds.forEach(id => {
          const comp = state.components.find(c => c.id === id);
          if (comp) {
            state.updateComponentRotation(id, (comp.rotation + 90) % 360);
          }
        });
        return;
      }

      // Ctrl+S (Save Options) or Ctrl+Shift+S (Save to Cloud directly)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          useUiStore.getState().setSaveProjectModalOpen(true);
        } else {
          useUiStore.getState().setSaveOptionsModalOpen(true);
        }
        return;
      }

      // Space key held (Pan Mode)
      if (e.code === 'Space' && !e.repeat) {
        // We prevent default so space doesn't scroll the page
        e.preventDefault();
        state.setPanMode(true);
      }

      // Zoom (Ctrl + or Ctrl -)
      if (e.ctrlKey && (e.key === '=' || e.key === '+' || e.key === '-')) {
        e.preventDefault();
        const scaleBy = 1.1;
        const newScale = e.key === '-' ? state.viewport.scale / scaleBy : state.viewport.scale * scaleBy;
        state.setViewport({
          ...state.viewport,
          scale: Math.max(0.1, Math.min(newScale, 5.0))
        });
        return;
      }

      // F (Fit to view)
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey) {
        e.preventDefault();
        if (state.components.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.components.forEach(c => {
          if (c.position.x < minX) minX = c.position.x;
          if (c.position.y < minY) minY = c.position.y;
          if (c.position.x > maxX) maxX = c.position.x;
          if (c.position.y > maxY) maxY = c.position.y;
        });
        
        const padding = 40;
        const compW = 200, compH = 200; // estimated max bounds
        const width = (maxX - minX) + compW;
        const height = (maxY - minY) + compH;
        
        // Window innerWidth fallback if container width isn't available globally
        const containerW = window.innerWidth;
        const containerH = window.innerHeight;
        
        const scaleX = containerW / (width + padding * 2);
        const scaleY = containerH / (height + padding * 2);
        let newScale = Math.min(scaleX, scaleY);
        newScale = Math.max(0.1, Math.min(newScale, 5.0));

        const centerX = minX + (maxX - minX) / 2 + compW / 2;
        const centerY = minY + (maxY - minY) / 2 + compH / 2;

        state.setViewport({
          scale: newScale,
          x: containerW / 2 - centerX * newScale,
          y: containerH / 2 - centerY * newScale
        });
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const state = useWorkspaceStore.getState();
        state.setPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
};
