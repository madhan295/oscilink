import React, { useEffect, useRef, useState, useCallback, createContext } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Grid } from './Grid';
import { Plus, Minus } from 'lucide-react';
import Konva from 'konva';

export const CanvasContext = createContext<{ stopPropagation: (e: any) => void }>({
  stopPropagation: (e) => e.cancelBubble = true,
});

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const viewport = useWorkspaceStore((state) => state.viewport);
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);

  // Measure canvas container dimensions using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Track spacebar for panning
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

  // Zoom Behavior
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const scaleBy = 1.1;
    // zoom in on scroll up (deltaY < 0), zoom out on scroll down (deltaY > 0)
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 5.0));
    
    // Find point under mouse in world coords before scale
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };
    
    // Calculate new x and y to keep the point under the mouse
    const newX = pointer.x - mousePointTo.x * newScale;
    const newY = pointer.y - mousePointTo.y * newScale;
    
    setViewport({ scale: newScale, x: newX, y: newY });
  }, [viewport, setViewport]);

  // Pan Behavior
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Middle click (button 1) or Space + Left click (button 0)
    if (e.evt.button === 1 || (e.evt.button === 0 && isSpacePressed)) {
      setIsPanning(true);
      e.cancelBubble = true;
    }
  }, [isSpacePressed]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning) return;
    
    setViewport({
      scale: viewport.scale,
      x: viewport.x + e.evt.movementX,
      y: viewport.y + e.evt.movementY
    });
  }, [isPanning, viewport, setViewport]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  // Click on empty canvas
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only clear selection if we clicked directly on the stage (empty area)
    if (e.target === stageRef.current) {
      clearSelection();
    }
  }, [clearSelection]);

  // UI Zoom Controls
  const handleZoomIn = () => {
    setViewport({ ...viewport, scale: Math.min(5.0, viewport.scale * 1.1) });
  };

  const handleZoomOut = () => {
    setViewport({ ...viewport, scale: Math.max(0.1, viewport.scale / 1.1) });
  };

  const handleResetZoom = () => {
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  const cursorStyle = isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default');
  const zoomPercent = Math.round(viewport.scale * 100);

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
          
          <Layer>
            <Group 
              x={viewport.x} 
              y={viewport.y} 
              scaleX={viewport.scale} 
              scaleY={viewport.scale}
            >
              {/* Layer 2: Wire layer */}
              <Group name="layer2-wires">
              </Group>
              
              {/* Layer 3: Component layer */}
              <Group name="layer3-components">
                <CanvasContext.Provider value={{ stopPropagation: (e) => { e.cancelBubble = true; } }}>
                </CanvasContext.Provider>
              </Group>
              
              {/* Layer 4: Overlay layer */}
              <Group name="layer4-overlay" listening={false}>
              </Group>
            </Group>
          </Layer>
        </Stage>
      )}

      {/* Zoom Indicator UI Overlay */}
      <div className="absolute bottom-4 right-4 flex items-center bg-surface border border-border rounded-full shadow-lg overflow-hidden text-text select-none z-10">
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-surface-hover transition-colors flex items-center justify-center"
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
          className="p-2 hover:bg-surface-hover transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
