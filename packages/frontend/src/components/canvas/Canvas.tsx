import React, { useEffect, useRef, useState, useCallback, createContext } from 'react';
import { Stage, Layer } from 'react-konva';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Grid } from './Grid';
import { Plus, Minus, Maximize, RotateCw, Undo2, Redo2 } from 'lucide-react';
import Konva from 'konva';
import { useWireDrawing } from '../../hooks/useWireDrawing';
import { WireLayer } from './WireLayer';
import { ComponentLayer } from './ComponentLayer';
import { InteractionLayer } from './InteractionLayer';
import { ErrorHighlightLayer } from './ErrorHighlightLayer';
import { PinRef } from '../../types/components';

export const CanvasContext = createContext<{ 
  stopPropagation: (e: any) => void;
  handlePinMouseDown: (pinRef: PinRef) => void;
  handlePinMouseEnter: (pinRef: PinRef) => void;
  handlePinMouseLeave: () => void;
}>({
  stopPropagation: (e) => e.cancelBubble = true,
  handlePinMouseDown: () => {},
  handlePinMouseEnter: () => {},
  handlePinMouseLeave: () => {},
});

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panHasMovedRef = useRef(false);
  
  const viewport = useWorkspaceStore((state) => state.viewport);
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const components = useWorkspaceStore((state) => state.components);
  const selectedComponentIds = useWorkspaceStore((state) => state.selectedComponentIds);
  const updateComponentRotation = useWorkspaceStore((state) => state.updateComponentRotation);
  const undo = useWorkspaceStore((state) => state.undo);
  const redo = useWorkspaceStore((state) => state.redo);
  const history = useWorkspaceStore((state) => state.history);
  const historyIndex = useWorkspaceStore((state) => state.historyIndex);
  const focusTrigger = useWorkspaceStore((state) => state.focusTrigger);

  const {
    previewWirePoints,
    handlePinMouseDown,
    handlePinMouseEnter,
    handlePinMouseLeave,
    handleCanvasMouseMove: handleWireMouseMove,
    handleStageClick: handleWireStageClick
  } = useWireDrawing();

  useEffect(() => {
    if (!containerRef.current) return;
    
    let lastLeft = containerRef.current.getBoundingClientRect().left;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
        
        const newLeft = entry.target.getBoundingClientRect().left;
        if (newLeft !== lastLeft) {
          const deltaLeft = newLeft - lastLeft;
          const currentViewport = useWorkspaceStore.getState().viewport;
          useWorkspaceStore.getState().setViewport({
            ...currentViewport,
            x: currentViewport.x - deltaLeft
          });
          lastLeft = newLeft;
        }
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle focusTrigger to pan and zoom to specific components
  useEffect(() => {
    if (!focusTrigger || focusTrigger.ids.length === 0 || components.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    const targetComponents = components.filter(c => focusTrigger.ids.includes(c.id));
    if (targetComponents.length === 0) return;

    targetComponents.forEach(c => {
      // rough approximation of bounds since we don't have getComponentBounds here, but position is close enough for center
      if (c.position.x < minX) minX = c.position.x;
      if (c.position.y < minY) minY = c.position.y;
      if (c.position.x > maxX) maxX = c.position.x;
      if (c.position.y > maxY) maxY = c.position.y;
    });

    const padding = 150;
    const compWidth = 100;
    const compHeight = 100;
    
    const width = (maxX - minX) + compWidth;
    const height = (maxY - minY) + compHeight;

    const scaleX = dimensions.width / (width + padding * 2);
    const scaleY = dimensions.height / (height + padding * 2);
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.max(0.5, Math.min(newScale, 2.0)); // Don't zoom in crazy far

    const centerX = minX + (maxX - minX) / 2 + compWidth / 2;
    const centerY = minY + (maxY - minY) / 2 + compHeight / 2;

    const newX = dimensions.width / 2 - centerX * newScale;
    const newY = dimensions.height / 2 - centerY * newScale;

    // TODO: Smooth animation would be nice, but instant setViewport is fine for now
    setViewport({ scale: newScale, x: newX, y: newY });
    
  }, [focusTrigger, dimensions.width, dimensions.height, setViewport]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 10.0));
    
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };
    
    const newX = pointer.x - mousePointTo.x * newScale;
    const newY = pointer.y - mousePointTo.y * newScale;
    
    setViewport({ scale: newScale, x: newX, y: newY });
  }, [viewport, setViewport]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const isStageClick = e.target === e.target.getStage();
    if (e.evt.button === 1 || (e.evt.button === 0 && isSpacePressed) || (e.evt.button === 0 && isStageClick)) {
      setIsPanning(true);
      panHasMovedRef.current = false;
      e.cancelBubble = true;
    }
  }, [isSpacePressed]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const worldPoint = {
          x: (pointer.x - viewport.x) / viewport.scale,
          y: (pointer.y - viewport.y) / viewport.scale
        };
        handleWireMouseMove(worldPoint);
      }
    }

    if (!isPanning) return;
    
    panHasMovedRef.current = true;
    
    setViewport({
      scale: viewport.scale,
      x: viewport.x + e.evt.movementX,
      y: viewport.y + e.evt.movementY
    });
  }, [isPanning, viewport, setViewport, handleWireMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (panHasMovedRef.current) {
      panHasMovedRef.current = false;
      return;
    }
    if (e.target === stageRef.current) {
      clearSelection();
      handleWireStageClick(e);
    }
  }, [clearSelection, handleWireStageClick]);

  const handleZoomIn = () => {
    setViewport({ ...viewport, scale: Math.min(10.0, viewport.scale * 1.1) });
  };

  const handleZoomOut = () => {
    setViewport({ ...viewport, scale: Math.max(0.1, viewport.scale / 1.1) });
  };

  const handleResetZoom = () => {
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  const handleFit = () => {
    if (components.length === 0) {
      handleResetZoom();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    components.forEach(c => {
      if (c.position.x < minX) minX = c.position.x;
      if (c.position.y < minY) minY = c.position.y;
      if (c.position.x > maxX) maxX = c.position.x;
      if (c.position.y > maxY) maxY = c.position.y;
    });

    const padding = 100;
    const compWidth = 200;
    const compHeight = 200;
    
    const width = (maxX - minX) + compWidth;
    const height = (maxY - minY) + compHeight;

    const scaleX = dimensions.width / (width + padding * 2);
    const scaleY = dimensions.height / (height + padding * 2);
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.max(0.1, Math.min(newScale, 10.0));

    const centerX = minX + (maxX - minX) / 2 + compWidth / 2;
    const centerY = minY + (maxY - minY) / 2 + compHeight / 2;

    const newX = dimensions.width / 2 - centerX * newScale;
    const newY = dimensions.height / 2 - centerY * newScale;

    setViewport({ scale: newScale, x: newX, y: newY });
  };

  const handleRotate = () => {
    selectedComponentIds.forEach(id => {
      const comp = components.find(c => c.id === id);
      if (comp) {
        updateComponentRotation(id, (comp.rotation + 90) % 360);
      }
    });
  };

  const cursorStyle = isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default');
  const zoomPercent = Math.round(viewport.scale * 100);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedComponentIds.length > 0;

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
      style={{ cursor: cursorStyle }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleStageClick}
        >
          {/* Layer 1: Grid */}
          <Grid width={dimensions.width} height={dimensions.height} />
          
          <CanvasContext.Provider value={{ 
            stopPropagation: (e) => { e.cancelBubble = true; },
            handlePinMouseDown,
            handlePinMouseEnter,
            handlePinMouseLeave
          }}>
            {/* Layer 2: Component layer */}
            <ComponentLayer dimensions={dimensions} />

            {/* Layer 2.5: Error Highlights */}
            <ErrorHighlightLayer />

            {/* Layer 3: Wire layer */}
            <Layer x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
              <WireLayer previewWirePoints={previewWirePoints} />
            </Layer>
            
            {/* Layer 4: Interaction layer */}
            <InteractionLayer />
          </CanvasContext.Provider>
        </Stage>
      )}

      {/* Zoom Indicator UI Overlay */}
      <div 
        className="absolute bottom-4 flex items-center bg-surface border border-border rounded-full shadow-lg overflow-hidden text-text select-none z-10 h-10 transition-all duration-300 ease-in-out"
        style={{ right: '16px' }}
      >
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={`px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center border-r border-border ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={`px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center border-r border-border ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
        <button 
          onClick={handleRotate}
          disabled={!hasSelection}
          className={`px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center border-r border-border ${!hasSelection ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Rotate (R)"
        >
          <RotateCw size={16} />
        </button>
        <button 
          onClick={handleFit}
          className="px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center border-r border-border"
          title="Fit to Screen (F)"
        >
          <Maximize size={16} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={handleResetZoom}
          className="px-3 py-2 text-xs font-medium hover:bg-surface-hover transition-colors border-x border-border"
          title="Reset Zoom"
        >
          {zoomPercent}%
        </button>
        <button 
          onClick={handleZoomIn}
          className="px-3 hover:bg-surface-hover h-full transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
