import React, { useState, useRef, useEffect } from 'react';
import { Group, Rect, Path, Circle, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface LEDProps {
  component: CircuitComponent;
}

export const LED: React.FC<LEDProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const outerGroupRef = useRef<any>(null);
  const [displayedBrightness, setDisplayedBrightness] = useState(0);
  const animFrameRef = useRef<number>();

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const selectedComponentIds = useWorkspaceStore((state) => state.selectedComponentIds);
  const isSelected = selectedComponentIds.includes(component.id);
  
  const compState = useSimulationStore((state) => state.componentStates[component.id]);
  const targetBrightness = (compState as { brightness?: number })?.brightness ?? 0;
  
  // Animate brightness smoothly

  useEffect(() => {
    let currentBrightness = displayedBrightness;
    
    const animate = () => {
      if (Math.abs(currentBrightness - targetBrightness) < 0.01) {
        if (currentBrightness !== targetBrightness) {
          currentBrightness = targetBrightness;
          setDisplayedBrightness(currentBrightness);
        }
        return;
      }
      
      const isTurningOn = targetBrightness > currentBrightness;
      const step = isTurningOn ? 0.3 : 0.15;
      
      currentBrightness += (targetBrightness - currentBrightness) * step;
      setDisplayedBrightness(currentBrightness);
      
      animFrameRef.current = requestAnimationFrame(animate);
    };
    
    animFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetBrightness]);

  const handleDragStart = () => {
    useWorkspaceStore.getState().pushHistory();
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().updateComponentPosition(component.id, {
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    useWorkspaceStore.getState().selectComponent(component.id, e.evt.shiftKey);
  };

  const onPinMouseDown = (e: KonvaEventObject<MouseEvent>, pinId: string) => {
    e.cancelBubble = true;
    handlePinMouseDown({ componentId: component.id, pinId });
  };

  const baseColor = String(component.properties?.color || 'RED').toUpperCase();
  const colorMap: Record<string, { r: number, g: number, b: number }> = {
    RED: { r: 255, g: 0, b: 0 },
    GREEN: { r: 0, g: 255, b: 0 },
    BLUE: { r: 0, g: 0, b: 255 },
    YELLOW: { r: 255, g: 255, b: 0 },
    WHITE: { r: 255, g: 255, b: 255 }
  };
  
  const c = colorMap[baseColor] || colorMap.RED;
  
  const r = Math.floor(c.r * 0.3 + (c.r - c.r * 0.3) * displayedBrightness);
  const g = Math.floor(c.g * 0.3 + (c.g - c.g * 0.3) * displayedBrightness);
  const b = Math.floor(c.b * 0.3 + (c.b - c.b * 0.3) * displayedBrightness);
  const currentColor = `rgb(${r}, ${g}, ${b})`;
  
  const renderPins = () => {
    return Object.values(component.pins).map((pin) => {
      const isHovered = hoveredPin === pin.id;
      const isAnode = pin.id === 'ANODE';
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
          <Circle x={0} y={0} radius={8} fill="transparent" />
          
          <Rect
            x={isHovered ? -2.8 : -2}
            y={isHovered ? -2.8 : -2}
            width={isHovered ? 5.6 : 4}
            height={isHovered ? 5.6 : 4}
            fill="#1a1a1a"
            stroke={isHovered ? '#fbbf24' : '#404040'}
            strokeWidth={isHovered ? 1 : 0.5}
            cornerRadius={0.5}
            shadowColor={isHovered ? '#fbbf24' : 'transparent'}
            shadowBlur={isHovered ? 5 : 0}
          />
          <Circle
            x={0} y={0}
            radius={isHovered ? 1.6 : 1}
            fill="#171717"
            shadowColor="transparent"
            shadowBlur={0}
          />
          <Text
            text={isAnode ? '+' : '-'}
            x={isAnode ? -10 : 4} 
            y={-3}
            fontSize={8} fontFamily="sans-serif" fontStyle="bold"
            fill="#374151" opacity={0.85}
          />
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
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      {isSelected && (
        <Rect
          x={-5} y={-5} width={50} height={55}
          stroke="#3b82f6" strokeWidth={2} dash={[6, 3]}
          listening={false}
        />
      )}

      {/* Leads */}
      <Group listening={false}>
        <Path data="M 14 20 L 14 25 L 10 25 L 10 38" stroke="#C0C0C0" strokeWidth={2} lineJoin="round" />
        <Path data="M 26 20 L 26 25 L 30 25 L 30 34" stroke="#C0C0C0" strokeWidth={2} lineJoin="round" />
      </Group>

      {/* Glow effect */}
      {displayedBrightness > 0.05 && (
        <Circle
          x={20} y={14}
          radius={16}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={16}
          fillRadialGradientColorStops={[
            0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.6 * displayedBrightness})`,
            1, 'rgba(0, 0, 0, 0)'
          ]}
          listening={false}
        />
      )}

      {/* LED Body */}
      <Group listening={false} x={12} y={6}>
        {/* Dome */}
        <Path
          data="M 0 8 A 8 8 0 0 1 16 8 Z"
          fill={currentColor}
          opacity={0.9}
        />
        {/* Base with notch on the right side */}
        <Path
          data="M 0 8 L 16 8 L 16 12 L 15 14 L 0 14 Z"
          fill={currentColor}
        />
      </Group>

      {renderPins()}
    </Group>
  );
};
