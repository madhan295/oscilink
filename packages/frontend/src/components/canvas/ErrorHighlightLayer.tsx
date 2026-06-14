import React, { useState, useEffect, useRef } from 'react';
import { Layer, Rect, Line, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSimulationStore } from '../../store/simulationStore';
import { getComponentBounds } from './InteractionLayer';
import { CircuitError } from '../../types/simulation';

const SEVERITY_COLORS = {
  error: '#ef4444', // Red 500
  warning: '#f97316', // Orange 500
  info: '#3b82f6', // Blue 500
};

export const ErrorHighlightLayer: React.FC = () => {
  const circuitErrors = useSimulationStore(state => state.circuitErrors);
  const status = useSimulationStore(state => state.status);
  const components = useWorkspaceStore(state => state.components);
  const wires = useWorkspaceStore(state => state.wires);
  const viewport = useWorkspaceStore(state => state.viewport);
  const focusTrigger = useWorkspaceStore(state => state.focusTrigger);

  const layerRef = useRef<Konva.Layer>(null);

  // Animation states (using React state for tooltips is fine, but not for 60fps animation)
  const [hoveredError, setHoveredError] = useState<{ text: string, x: number, y: number } | null>(null);

  // For 60fps animations, use refs to avoid React re-renders
  const dashOffsetRef = useRef(0);
  const pulseOpacityRef = useRef(0.04);
  const focusPulseOpacityRef = useRef(0);

  useEffect(() => {
    let anim: Konva.Animation;
    if (layerRef.current && status === 'RUNNING' && circuitErrors.length > 0) {
      anim = new Konva.Animation((frame) => {
        if (!frame || !layerRef.current) return;
        dashOffsetRef.current -= 0.5;
        
        // Sine wave between 0.04 and 0.10 for pulsing fill
        const time = frame.time;
        pulseOpacityRef.current = 0.07 + 0.03 * Math.sin(time / 200);
        
        // Find nodes and update directly
        const layer = layerRef.current;
        const dashRects = layer.find('.error-dash');
        dashRects.forEach(node => node.dashOffset(dashOffsetRef.current));
        
        const pulseRects = layer.find('.error-pulse');
        pulseRects.forEach(node => node.opacity(pulseOpacityRef.current));

        const pulseLines = layer.find('.error-pulse-line');
        pulseLines.forEach(node => node.opacity(pulseOpacityRef.current * 6));
      }, layerRef.current);
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [status, circuitErrors.length]);

  useEffect(() => {
    let anim: Konva.Animation;
    if (focusTrigger && layerRef.current) {
      anim = new Konva.Animation((frame) => {
        if (!frame || !layerRef.current) return;
        const elapsed = Date.now() - focusTrigger.timestamp;
        if (elapsed > 3000) {
          anim.stop();
          focusPulseOpacityRef.current = 0;
          const focusRects = layerRef.current.find('.focus-flash');
          focusRects.forEach(node => node.opacity(0));
          return;
        }
        // Rapid oscillation + decay
        const flash = 0.5 + 0.5 * Math.sin(elapsed / 50);
        const decay = 1 - (elapsed / 3000);
        focusPulseOpacityRef.current = flash * decay * 0.8;
        
        const focusRects = layerRef.current.find('.focus-flash');
        focusRects.forEach(node => node.opacity(focusPulseOpacityRef.current));
      }, layerRef.current);
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
      focusPulseOpacityRef.current = 0;
      if (layerRef.current) {
        const focusRects = layerRef.current.find('.focus-flash');
        focusRects.forEach(node => node.opacity(0));
      }
    };
  }, [focusTrigger]);

  if ((status !== 'RUNNING' || circuitErrors.length === 0) && !focusTrigger) {
    return <Layer listening={false} />;
  }

  // Pre-calculate merged errors per component/wire so we take highest severity
  const compErrorMap = new Map<string, { severity: CircuitError['severity'], message: string }>();
  const wireErrorMap = new Map<string, { severity: CircuitError['severity'] }>();

  const severityWeight = { error: 3, warning: 2, info: 1 };

  circuitErrors.forEach(err => {
    const w = severityWeight[err.severity];
    
    // Process component highlights
    err.affectedComponentIds?.forEach(id => {
      const existing = compErrorMap.get(id);
      if (!existing || w > severityWeight[existing.severity]) {
        compErrorMap.set(id, { severity: err.severity, message: err.message });
      } else if (existing && w === severityWeight[existing.severity]) {
        // Append messages of same severity
        existing.message += '\n• ' + err.message;
      }
    });

    // Process wire highlights
    err.affectedWireIds?.forEach(id => {
      const existing = wireErrorMap.get(id);
      if (!existing || w > severityWeight[existing.severity]) {
        wireErrorMap.set(id, { severity: err.severity });
      }
    });
  });

  return (
    <Layer 
      ref={layerRef} 
      listening={true} // Needs to be true to capture hover on icons, but components pass events through
      x={viewport.x} 
      y={viewport.y} 
      scaleX={viewport.scale} 
      scaleY={viewport.scale}
    >
      {/* 1. Wire Error Highlights */}
      {Array.from(wireErrorMap.entries()).map(([id, { severity }]) => {
        const wire = wires.find(w => w.id === id);
        if (!wire) return null;
        return (
          <Line
            key={`wire-err-${id}`}
            name="error-pulse-line"
            points={wire.points}
            stroke={SEVERITY_COLORS[severity]}
            strokeWidth={10} // Wider than regular wire
            opacity={pulseOpacityRef.current * 6} // oscillating between 0.24 and 0.60
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        );
      })}

      {/* 2. Component Error Overlays */}
      {Array.from(compErrorMap.entries()).map(([id, { severity, message }]) => {
        const comp = components.find(c => c.id === id);
        if (!comp) return null;

        const bounds = getComponentBounds(comp);
        const localX = bounds.x - comp.position.x;
        const localY = bounds.y - comp.position.y;
        
        // Expand bounding box by 6px
        const pad = 6;
        const rectX = localX - pad;
        const rectY = localY - pad;
        const rectW = bounds.width + pad * 2;
        const rectH = bounds.height + pad * 2;

        const color = SEVERITY_COLORS[severity];
        const isFocused = focusTrigger?.ids.includes(id);

        return (
          <Group 
            key={`comp-err-${id}`} 
            x={comp.position.x} 
            y={comp.position.y} 
            rotation={comp.rotation || 0}
          >
            {/* Focus Flash Overlay */}
            {isFocused && (
              <Rect
                name="focus-flash"
                x={rectX - 4}
                y={rectY - 4}
                width={rectW + 8}
                height={rectH + 8}
                fill="white"
                opacity={focusPulseOpacityRef.current}
                cornerRadius={10}
                listening={false}
              />
            )}

            {/* Pulsing Fill Overlay */}
            {status === 'RUNNING' && (
              <>
                <Rect
                  name="error-pulse"
                  x={rectX}
                  y={rectY}
                  width={rectW}
                  height={rectH}
                  fill={color}
                  opacity={pulseOpacityRef.current}
                  cornerRadius={8}
                  listening={false}
                />

                {/* Dashed Border Overlay */}
                <Rect
                  name="error-dash"
                  x={rectX}
                  y={rectY}
                  width={rectW}
                  height={rectH}
                  stroke={color}
                  strokeWidth={2 / viewport.scale}
                  dash={[8 / viewport.scale, 4 / viewport.scale]}
                  dashOffset={dashOffsetRef.current}
                  cornerRadius={8}
                  listening={false}
                />
              </>
            )}

            {/* Error Icon Badge */}
            <Group 
              x={rectX + rectW} 
              y={rectY}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  const pos = stage.getPointerPosition();
                  if (pos) {
                    setHoveredError({ 
                      text: message.includes('•') ? `• ${message}` : message, 
                      x: (pos.x - viewport.x) / viewport.scale, 
                      y: (pos.y - viewport.y) / viewport.scale 
                    });
                  }
                }
                // Update cursor
                const container = stage?.container();
                if (container) container.style.cursor = 'help';
              }}
              onMouseLeave={(e) => {
                setHoveredError(null);
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
              onMouseMove={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  const pos = stage.getPointerPosition();
                  if (pos) {
                    setHoveredError({ 
                      text: message.includes('•') ? `• ${message}` : message, 
                      x: (pos.x - viewport.x) / viewport.scale, 
                      y: (pos.y - viewport.y) / viewport.scale 
                    });
                  }
                }
              }}
            >
              <Circle
                x={0}
                y={0}
                radius={10 / viewport.scale}
                fill={color}
                shadowColor="rgba(0,0,0,0.3)"
                shadowBlur={4 / viewport.scale}
                shadowOffset={{ x: 0, y: 2 / viewport.scale }}
              />
              <Text
                x={0}
                y={0}
                text={severity === 'info' ? 'i' : '!'}
                fill="white"
                fontSize={14 / viewport.scale}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={4 / viewport.scale}
                offsetY={6 / viewport.scale}
                listening={false}
              />
            </Group>
          </Group>
        );
      })}

      {/* Tooltip rendered on top of everything */}
      {hoveredError && (
        <Group x={hoveredError.x + 15 / viewport.scale} y={hoveredError.y + 15 / viewport.scale} listening={false}>
          <Rect
            x={0}
            y={0}
            width={Math.max(200, Math.min(400, hoveredError.text.length * 7)) / viewport.scale}
            height={50 / viewport.scale}
            fill="#1e293b"
            cornerRadius={4 / viewport.scale}
            shadowColor="rgba(0,0,0,0.4)"
            shadowBlur={8 / viewport.scale}
            shadowOffset={{ x: 0, y: 4 / viewport.scale }}
          />
          <Text
            x={10 / viewport.scale}
            y={10 / viewport.scale}
            text={hoveredError.text}
            fill="#f8fafc"
            fontSize={12 / viewport.scale}
            fontFamily="sans-serif"
            width={(Math.max(200, Math.min(400, hoveredError.text.length * 7)) - 20) / viewport.scale}
            wrap="word"
          />
        </Group>
      )}
    </Layer>
  );
};
