import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PinRef, Point } from '../types/components';
import { getAbsolutePinPosition } from '../utils/geometry';

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
        const absPos = getAbsolutePinPosition(comp, pin);
        setPreviewWirePoints([absPos.x, absPos.y, absPos.x, absPos.y]);
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
              const startPos = getAbsolutePinPosition(startComp, startPin);
              const endPos = getAbsolutePinPosition(endComp, endPin);
              
              const points = [startPos.x, startPos.y];
              intermediatePoints.forEach(p => {
                points.push(p.x, p.y);
              });
              points.push(endPos.x, endPos.y);
              
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
        const startPos = getAbsolutePinPosition(startComp, startPin);
        
        let endX = worldPoint.x;
        let endY = worldPoint.y;
        
        if (hoveredPin) {
           const endComp = components.find(c => c.id === hoveredPin.componentId);
           const pin = endComp?.pins[hoveredPin.pinId];
           if (endComp && pin) {
             const endPos = getAbsolutePinPosition(endComp, pin);
             endX = endPos.x;
             endY = endPos.y;
           }
        }

        const points = [startPos.x, startPos.y];
        intermediatePoints.forEach(p => {
          points.push(p.x, p.y);
        });
        points.push(endX, endY);

        setPreviewWirePoints(points);
      }
    }
  }, [isDrawingWire, wireDrawingFrom, components, hoveredPin, intermediatePoints]);

  useEffect(() => {
    if (!isDrawingWire) {
      setPreviewWirePoints(null);
      setIntermediatePoints([]);
    }
  }, [isDrawingWire]);

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

  const handleStageClick = useCallback((_e: any) => {
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
