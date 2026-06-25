import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Path, Circle, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface LEDProps {
  component: CircuitComponent;
}

export const LED = memo(({ component }: LEDProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const outerGroupRef = useRef<Konva.Group>(null);
  const glowRef = useRef<Konva.Circle>(null);
  const bodyGroupRef = useRef<Konva.Group>(null);
  const domeRef = useRef<Konva.Path>(null);
  const baseRef = useRef<Konva.Path>(null);
  
  useComponentDropAnimation(component, outerGroupRef);
  const animFrameRef = useRef<number>();

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);
  
  const baseColor = String(component.properties?.color || 'RED').toUpperCase();
  const colorMap: Record<string, { r: number, g: number, b: number }> = {
    RED: { r: 255, g: 0, b: 0 },
    GREEN: { r: 0, g: 255, b: 0 },
    BLUE: { r: 0, g: 0, b: 255 },
    YELLOW: { r: 255, g: 255, b: 0 },
    WHITE: { r: 255, g: 255, b: 255 }
  };
  const c = colorMap[baseColor] || colorMap.RED;

  // Animate brightness smoothly using refs
  useEffect(() => {
    let currentBrightness = 0;

    const animate = () => {
      // Get the latest brightness directly from the store on every frame
      // This is robust against keys being deleted during resetSimulation()
      const state = useSimulationStore.getState();
      const targetBrightness = (state.componentStates[component.id] as any)?.brightness ?? 0;

      if (Math.abs(currentBrightness - targetBrightness) >= 0.01) {
        const isTurningOn = targetBrightness > currentBrightness;
        const step = isTurningOn ? 0.3 : 0.15;
        currentBrightness += (targetBrightness - currentBrightness) * step;

        const r = Math.floor(c.r * 0.3 + (c.r - c.r * 0.3) * currentBrightness);
        const g = Math.floor(c.g * 0.3 + (c.g - c.g * 0.3) * currentBrightness);
        const b = Math.floor(c.b * 0.3 + (c.b - c.b * 0.3) * currentBrightness);
        const currentColor = `rgb(${r}, ${g}, ${b})`;

        if (glowRef.current) {
          if (currentBrightness > 0.05) {
            (glowRef.current as any).setAttr('visible', true);
            (glowRef.current as any).setAttr('fillRadialGradientColorStops', [
              0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.9 * currentBrightness})`,
              0.4, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.4 * currentBrightness})`,
              1, 'rgba(0, 0, 0, 0)'
            ]);
          } else {
            (glowRef.current as any).setAttr('visible', false);
          }
        }
        
        if (bodyGroupRef.current) {
          (bodyGroupRef.current as any).setAttr('shadowBlur', currentBrightness > 0.05 ? 15 * currentBrightness : 0);
          (bodyGroupRef.current as any).setAttr('shadowOpacity', currentBrightness);
        }
        if (domeRef.current) (domeRef.current as any).setAttr('fill', currentColor);
        if (baseRef.current) (baseRef.current as any).setAttr('fill', currentColor);

      } else if (currentBrightness !== targetBrightness) {
        // Snap to target to ensure it fully settles
        currentBrightness = targetBrightness;
        const r = Math.floor(c.r * 0.3 + (c.r - c.r * 0.3) * currentBrightness);
        const g = Math.floor(c.g * 0.3 + (c.g - c.g * 0.3) * currentBrightness);
        const b = Math.floor(c.b * 0.3 + (c.b - c.b * 0.3) * currentBrightness);
        const currentColor = `rgb(${r}, ${g}, ${b})`;

        if (glowRef.current) (glowRef.current as any).setAttr('visible', currentBrightness > 0.05);
        if (bodyGroupRef.current) {
          (bodyGroupRef.current as any).setAttr('shadowBlur', 0);
          (bodyGroupRef.current as any).setAttr('shadowOpacity', currentBrightness);
        }
        if (domeRef.current) (domeRef.current as any).setAttr('fill', currentColor);
        if (baseRef.current) (baseRef.current as any).setAttr('fill', currentColor);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };
    
    animFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [component.id, c.r, c.g, c.b]);

  const handleDragStart = useCallback(() => {
    useWorkspaceStore.getState().pushHistory();
  }, []);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
  }, [component.id]);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
  }, [component.id]);

  const handleClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    useWorkspaceStore.getState().selectComponent(component.id, e.evt.shiftKey);
  }, [component.id]);

  const onPinMouseDown = useCallback((e: KonvaEventObject<MouseEvent>, pinId: string) => {
    e.cancelBubble = true;
    handlePinMouseDown({ componentId: component.id, pinId });
  }, [component.id, handlePinMouseDown]);
  
  const renderPins = () => {
    return Object.values(component.pins).map((pin) => {
      const isHovered = hoveredPin === pin.id;
      return (
        <Group
          key={pin.id}
          x={pin.position.x}
          y={pin.position.y}
          onMouseEnter={() => {
            setHoveredPin(pin.id);
            document.body.style.cursor = 'crosshair';
            handlePinMouseEnter({ componentId: component.id, pinId: pin.id });
          }}
          onMouseLeave={() => {
            setHoveredPin(null);
            document.body.style.cursor = 'default';
            handlePinMouseLeave();
          }}
          onMouseDown={(e) => onPinMouseDown(e, pin.id)}
        >
          <Circle x={0} y={0} radius={6} fill="transparent" />
          <Circle
            x={0} y={0}
            radius={isHovered ? 2.5 : 1.5}
            fill={isHovered ? '#fbbf24' : '#171717'}
            stroke={isHovered ? '#fbbf24' : '#404040'}
            strokeWidth={isHovered ? 1 : 0.5}
          />
          {isHovered && (
            <Group x={-12} y={8}>
              <Rect width={24} height={10} fill="#1f2937" cornerRadius={2} opacity={0.9} />
              <Text
                text={pin.label}
                width={24} height={10}
                align="center" verticalAlign="middle"
                fontSize={6} fill="#fbbf24"
                fontFamily="monospace" fontStyle="bold"
              />
            </Group>
          )}
        </Group>
      );
    });
  };

  return (
    <Group
      ref={outerGroupRef}
      x={component.position.x}
      y={component.position.y}
      rotation={component.rotation}
      scaleX={component.properties?.flipX ? -1 : 1}
      scaleY={component.properties?.flipY ? -1 : 1}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Rect x={-5} y={-5} width={50} height={55} fill="transparent" listening={false} />
      {/* Leads */}
      <Group listening={false}>
        <Path data="M 14 20 L 14 25 L 10 25 L 10 38" stroke="#C0C0C0" strokeWidth={2} lineJoin="round" />
        <Path data="M 26 20 L 26 25 L 30 25 L 30 34" stroke="#C0C0C0" strokeWidth={2} lineJoin="round" />
      </Group>

      {/* Glow effect */}
      <Circle
        ref={glowRef}
        x={20} y={14}
        radius={32}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={32}
        visible={false}
        listening={false}
      />

      {/* LED Body */}
      <Group 
        ref={bodyGroupRef}
        x={12} y={6}
        shadowColor={`rgb(${c.r}, ${c.g}, ${c.b})`}
        shadowBlur={0}
        shadowOpacity={0}
      >
        {/* Dome */}
        <Path
          ref={domeRef}
          data="M 0 8 A 8 8 0 0 1 16 8 Z"
          fill={`rgb(${c.r * 0.3}, ${c.g * 0.3}, ${c.b * 0.3})`}
          opacity={0.9}
        />
        {/* Base with notch on the right side */}
        <Path
          ref={baseRef}
          data="M 0 8 L 16 8 L 16 12 L 15 14 L 0 14 Z"
          fill={`rgb(${c.r * 0.3}, ${c.g * 0.3}, ${c.b * 0.3})`}
        />
      </Group>

      {renderPins()}
    </Group>
  );
}, (prev, next) => {
  return (
    prev.component.position.x === next.component.position.x &&
    prev.component.position.y === next.component.position.y &&
    prev.component.rotation === next.component.rotation &&
    JSON.stringify(prev.component.properties) === JSON.stringify(next.component.properties) &&
    JSON.stringify(prev.component.pins) === JSON.stringify(next.component.pins)
  );
});
