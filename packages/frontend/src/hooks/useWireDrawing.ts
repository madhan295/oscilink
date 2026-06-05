import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PinRef, Point, CircuitComponent, Pin } from '../types/components';

export const useWireDrawing = () => {
  const [previewWirePoints, setPreviewWirePoints] = useState<number[] | null>(null);
  const [hoveredPin, setHoveredPin] = useState<PinRef | null>(null);
  const [intermediatePoints, setIntermediatePoints] = useState<Point[]>([]);
  
  const isDrawingWire = useWorkspaceStore(state => state.isDrawingWire);
  const wireDrawingFrom = useWorkspaceStore(state => state.wireDrawingFrom);
  const components = useWorkspaceStore(state => state.components);
  const startWireDrawing = useWorkspaceStore(state => state.startWireDrawing);
  const finishWireDrawing = useWorkspaceStore(state => state.finishWireDrawing);
  const cancelWireDrawing = useWorkspaceStore(state => state.cancelWireDrawing);

  const currentMousePosRef = useRef<Point>({ x: 0, y: 0 });

  const handlePinMouseDown = useCallback((pinRef: PinRef) => {
    if (!isDrawingWire) {
      startWireDrawing(pinRef);
      setIntermediatePoints([]);
      // Initialize preview from this pin to itself
      const comp = components.find(c => c.id === pinRef.componentId);
      const pin = comp?.pins[pinRef.pinId];
      if (comp && pin) {
        const absX = comp.position.x + pin.position.x;
        const absY = comp.position.y + pin.position.y;
        setPreviewWirePoints([absX, absY, absX, absY]);
      }
    } else {
      if (wireDrawingFrom?.componentId !== pinRef.componentId || wireDrawingFrom?.pinId !== pinRef.pinId) {
        if (wireDrawingFrom?.componentId !== pinRef.componentId) {
          // Finish drawing
          if (previewWirePoints) {
            // Recompute final points to exact pin positions
            const startComp = components.find(c => c.id === wireDrawingFrom!.componentId);
            const startPin = startComp?.pins[wireDrawingFrom!.pinId];
            const endComp = components.find(c => c.id === pinRef.componentId);
            const endPin = endComp?.pins[pinRef.pinId];
            
            if (startComp && startPin && endComp && endPin) {
              const startX = startComp.position.x + startPin.position.x;
              const startY = startComp.position.y + startPin.position.y;
              const endX = endComp.position.x + endPin.position.x;
              const endY = endComp.position.y + endPin.position.y;
              
              const points = [startX, startY];
              intermediatePoints.forEach(p => {
                points.push(p.x, p.y);
              });
              points.push(endX, endY);
              
              finishWireDrawing(pinRef, points);
            } else {
              cancelWireDrawing();
            }
          } else {
            cancelWireDrawing();
          }
        } else {
          // Same component, cancel
          cancelWireDrawing();
        }
      } else {
        // Same pin, restart
        cancelWireDrawing();
        startWireDrawing(pinRef);
        setIntermediatePoints([]);
      }
      setPreviewWirePoints(null);
      setIntermediatePoints([]);
    }
  }, [isDrawingWire, wireDrawingFrom, components, previewWirePoints, intermediatePoints, startWireDrawing, finishWireDrawing, cancelWireDrawing]);

  const handlePinMouseEnter = useCallback((pinRef: PinRef) => {
    setHoveredPin(pinRef);
  }, []);

  const handlePinMouseLeave = useCallback(() => {
    setHoveredPin(null);
  }, []);

  const handleCanvasMouseMove = useCallback((worldPoint: Point) => {
    currentMousePosRef.current = worldPoint;
    
    if (isDrawingWire && wireDrawingFrom) {
      const startComp = components.find(c => c.id === wireDrawingFrom.componentId);
      const startPin = startComp?.pins[wireDrawingFrom.pinId];
      if (startComp && startPin) {
        const startX = startComp.position.x + startPin.position.x;
        const startY = startComp.position.y + startPin.position.y;
        
        let endX = worldPoint.x;
        let endY = worldPoint.y;
        
        if (hoveredPin) {
           const endComp = components.find(c => c.id === hoveredPin.componentId);
           const pin = endComp?.pins[hoveredPin.pinId];
           if (endComp && pin) {
             endX = endComp.position.x + pin.position.x;
             endY = endComp.position.y + pin.position.y;
           }
        }

        const points = [startX, startY];
        intermediatePoints.forEach(p => {
          points.push(p.x, p.y);
        });
        points.push(endX, endY);

        setPreviewWirePoints(points);
      }
    }
  }, [isDrawingWire, wireDrawingFrom, components, hoveredPin, intermediatePoints]);

  const handleCanvasKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDrawingWire) {
      cancelWireDrawing();
      setPreviewWirePoints(null);
      setIntermediatePoints([]);
    }
  }, [isDrawingWire, cancelWireDrawing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleCanvasKeyDown(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCanvasKeyDown]);

  const handleStageClick = useCallback((e: any) => {
    if (isDrawingWire && !hoveredPin) {
      // User clicked on canvas to create an intermediate point
      const newPoint = currentMousePosRef.current;
      setIntermediatePoints(prev => [...prev, newPoint]);
    }
  }, [isDrawingWire, hoveredPin]);

  return {
    previewWirePoints,
    hoveredPin,
    handlePinMouseDown,
    handlePinMouseEnter,
    handlePinMouseLeave,
    handleCanvasMouseMove,
    handleCanvasKeyDown,
    handleStageClick,
    isDrawingWire
  };
};
