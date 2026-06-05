import { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PinRef, Point, CircuitComponent, Pin } from '../types/components';

function getPinNormal(comp: CircuitComponent, pin: Pin): { dx: number, dy: number } {
  if (comp.type === 'LED') return { dx: 0, dy: 1 };
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const pins = Object.values(comp.pins);
  if (pins.length <= 1) return { dx: 0, dy: -1 };

  pins.forEach(p => {
    if (p.position.x < minX) minX = p.position.x;
    if (p.position.x > maxX) maxX = p.position.x;
    if (p.position.y < minY) minY = p.position.y;
    if (p.position.y > maxY) maxY = p.position.y;
  });

  const spreadX = maxX - minX;
  const spreadY = maxY - minY;

  if (spreadX > spreadY * 1.5) {
    return pin.position.x < minX + spreadX / 2 ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };
  } else if (spreadY > spreadX * 1.5) {
    return pin.position.y < minY + spreadY / 2 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };
  } else {
    const dTop = Math.abs(pin.position.y - minY);
    const dBottom = Math.abs(maxY - pin.position.y);
    const dLeft = Math.abs(pin.position.x - minX);
    const dRight = Math.abs(maxX - pin.position.x);

    // Prefer Y axis for corner pins unless X axis is strictly closer
    if (dTop <= dLeft && dTop <= dRight && dTop <= dBottom) return { dx: 0, dy: -1 };
    if (dBottom <= dLeft && dBottom <= dRight) return { dx: 0, dy: 1 };
    if (dLeft <= dRight) return { dx: -1, dy: 0 };
    return { dx: 1, dy: 0 };
  }
}

function routeWire(startX: number, startY: number, endX: number, endY: number, startNormal: { dx: number, dy: number }, endNormal?: { dx: number, dy: number }): number[] {
  const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  if (dist < 60) {
    return [startX, startY, endX, endY];
  }

  const OFF = 20;

  const p1x = startX;
  const p1y = startY;
  const p2x = startX + startNormal.dx * OFF;
  const p2y = startY + startNormal.dy * OFF;

  if (endNormal) {
    const pEx = endX + endNormal.dx * OFF;
    const pEy = endY + endNormal.dy * OFF;

    if (startNormal.dy !== 0 && endNormal.dy !== 0) {
      const midY = (p2y + pEy) / 2;
      return [p1x, p1y, p2x, p2y, p2x, midY, pEx, midY, pEx, pEy, endX, endY];
    } else if (startNormal.dx !== 0 && endNormal.dx !== 0) {
      const midX = (p2x + pEx) / 2;
      return [p1x, p1y, p2x, p2y, midX, p2y, midX, pEy, pEx, pEy, endX, endY];
    } else {
      if (startNormal.dy !== 0) {
        return [p1x, p1y, p2x, p2y, pEx, p2y, pEx, pEy, endX, endY];
      } else {
        return [p1x, p1y, p2x, p2y, p2x, pEy, pEx, pEy, endX, endY];
      }
    }
  } else {
    if (startNormal.dy !== 0) {
      return [p1x, p1y, p2x, p2y, endX, p2y, endX, endY];
    } else {
      return [p1x, p1y, p2x, p2y, p2x, endY, endX, endY];
    }
  }
}

export const useWireDrawing = () => {
  const [previewWirePoints, setPreviewWirePoints] = useState<number[] | null>(null);
  const [hoveredPin, setHoveredPin] = useState<PinRef | null>(null);
  
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
              
              const startNormal = getPinNormal(startComp, startPin);
              const endNormal = getPinNormal(endComp, endPin);
              
              const points = routeWire(startX, startY, endX, endY, startNormal, endNormal);
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
      }
      setPreviewWirePoints(null);
    }
  }, [isDrawingWire, wireDrawingFrom, components, previewWirePoints, startWireDrawing, finishWireDrawing, cancelWireDrawing]);

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
        
        const startNormal = getPinNormal(startComp, startPin);
        
        let endNormal: { dx: number, dy: number } | undefined = undefined;
        if (hoveredPin) {
           const endComp = components.find(c => c.id === hoveredPin.componentId);
           const pin = endComp?.pins[hoveredPin.pinId];
           if (endComp && pin) {
             endX = endComp.position.x + pin.position.x;
             endY = endComp.position.y + pin.position.y;
             endNormal = getPinNormal(endComp, pin);
           }
        }

        const points = routeWire(startX, startY, endX, endY, startNormal, endNormal);
        setPreviewWirePoints(points);
      }
    }
  }, [isDrawingWire, wireDrawingFrom, components, hoveredPin]);

  const handleCanvasKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isDrawingWire) {
      cancelWireDrawing();
      setPreviewWirePoints(null);
    }
  }, [isDrawingWire, cancelWireDrawing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleCanvasKeyDown(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCanvasKeyDown]);

  const handleStageClick = useCallback((e: any) => {
    if (isDrawingWire && !hoveredPin) {
      cancelWireDrawing();
      setPreviewWirePoints(null);
    }
  }, [isDrawingWire, hoveredPin, cancelWireDrawing]);

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
