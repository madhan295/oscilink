import React, { useState, useRef } from 'react';
import { Group, Rect, Circle, Label, Tag, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface PushButtonProps {
  component: CircuitComponent;
}

export const PushButton: React.FC<PushButtonProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const outerGroupRef = useRef<any>(null);
  const capRef = useRef<any>(null);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const selectedComponentIds = useWorkspaceStore((state) => state.selectedComponentIds);
  const isSelected = selectedComponentIds.includes(component.id);
  const status = useSimulationStore((state) => state.status);
  
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

  const handleButtonDown = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (status !== 'RUNNING') return;
    
    setIsPressed(true);
    if (capRef.current) {
      capRef.current.to({ y: 22, duration: 0.05 });
    }
    
    window.dispatchEvent(new CustomEvent('EXTERNAL_INPUT', {
      detail: { componentId: component.id, state: 'pressed' }
    }));
  };

  const handleButtonUp = () => {
    if (!isPressed) return;
    setIsPressed(false);
    if (capRef.current) {
      capRef.current.to({ y: 20, duration: 0.08, easing: Konva.Easings.EaseOut });
    }
    
    window.dispatchEvent(new CustomEvent('EXTERNAL_INPUT', {
      detail: { componentId: component.id, state: 'released' }
    }));
  };

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
          x={-5} y={-5} width={50} height={50}
          stroke="#3b82f6" strokeWidth={2} dash={[6, 3]}
          listening={false}
        />
      )}

      {/* Leads */}
      <Group listening={false}>
        <Line points={[0, 20, 8, 20]} stroke="#C0C0C0" strokeWidth={2} />
        <Line points={[32, 20, 40, 20]} stroke="#C0C0C0" strokeWidth={2} />
      </Group>

      {/* Body */}
      <Rect
        x={8} y={8} width={24} height={24}
        fill="#333333" stroke="#111111" strokeWidth={1}
        cornerRadius={2}
        listening={false}
      />
      
      {/* Corner pins (decorative) */}
      <Group listening={false}>
        <Circle x={11} y={11} radius={3} fill="#C0C0C0" />
        <Circle x={29} y={11} radius={3} fill="#C0C0C0" />
        <Circle x={11} y={29} radius={3} fill="#C0C0C0" />
        <Circle x={29} y={29} radius={3} fill="#C0C0C0" />
      </Group>

      {/* Interactive Button Cap */}
      <Circle
        ref={capRef}
        x={20} y={20} radius={10}
        fill={isPressed ? '#990000' : '#cc0000'}
        stroke="#550000" strokeWidth={1}
        onMouseEnter={() => {
          setIsHoveringButton(true);
          if (status === 'RUNNING') document.body.style.cursor = 'pointer';
        }}
        onMouseLeave={() => {
          setIsHoveringButton(false);
          document.body.style.cursor = 'default';
          handleButtonUp();
        }}
        onMouseDown={handleButtonDown}
        onMouseUp={handleButtonUp}
      />

      {/* Tooltip for non-running state */}
      {isHoveringButton && status !== 'RUNNING' && (
        <Label x={20} y={0} opacity={0.9}>
          <Tag fill="#1f2937" pointerDirection="down" pointerWidth={6} pointerHeight={6} cornerRadius={4} />
          <Text text="Run simulation to interact" fill="white" fontSize={10} padding={4} />
        </Label>
      )}

      {renderPins()}
    </Group>
  );
};
