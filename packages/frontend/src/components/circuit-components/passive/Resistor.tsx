import React, { useState, useRef } from 'react';
import { Group, Rect, Line, Circle, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { CanvasContext } from '../../canvas/Canvas';

interface ResistorProps {
  component: CircuitComponent;
}

function getResistorBands(resistance: number): string[] {
  const colors = [
    '#000000', '#8B4513', '#FF0000', '#FFA500', '#FFFF00',
    '#008000', '#0000FF', '#EE82EE', '#808080', '#FFFFFF'
  ];
  const gold = '#DAA520';

  if (resistance < 10) {
    const first = Math.floor(resistance);
    return [colors[first], colors[0], gold, gold];
  }

  const exp = Math.floor(Math.log10(resistance));
  const first = Math.floor(resistance / Math.pow(10, exp));
  const second = Math.floor((resistance - first * Math.pow(10, exp)) / Math.pow(10, exp - 1));
  let mult = exp - 1;
  if (mult < 0) mult = 0;
  if (mult > 9) mult = 9;

  return [colors[first], colors[second], colors[mult], gold];
}

export const Resistor: React.FC<ResistorProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const outerGroupRef = useRef<any>(null);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const selectedComponentIds = useWorkspaceStore((state) => state.selectedComponentIds);
  const isSelected = selectedComponentIds.includes(component.id);
  
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

  const resistance = Number(component.properties?.resistance || 220);
  const bands = getResistorBands(resistance);

  let resistanceLabel = `${resistance}Ω`;
  if (resistance >= 1000 && resistance < 1000000) {
    resistanceLabel = `${resistance / 1000}kΩ`;
  } else if (resistance >= 1000000) {
    resistanceLabel = `${resistance / 1000000}MΩ`;
  }

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
          x={-5} y={-5} width={70} height={35}
          stroke="#3b82f6" strokeWidth={2} dash={[6, 3]}
          listening={false}
        />
      )}

      {/* Leads */}
      <Group listening={false}>
        <Line points={[0, 10, 8, 10]} stroke="#C0C0C0" strokeWidth={2} />
        <Line points={[52, 10, 60, 10]} stroke="#C0C0C0" strokeWidth={2} />
      </Group>

      {/* Body */}
      <Group listening={false} x={8} y={3}>
        <Rect
          x={0} y={0}
          width={44} height={14}
          fill="#f5d098"
          stroke="#c79958"
          strokeWidth={1}
          cornerRadius={4}
        />
        {/* Bands: 20%, 35%, 50%, 80% */}
        <Rect x={44 * 0.2} y={0} width={4} height={14} fill={bands[0]} />
        <Rect x={44 * 0.35} y={0} width={4} height={14} fill={bands[1]} />
        <Rect x={44 * 0.5} y={0} width={4} height={14} fill={bands[2]} />
        <Rect x={44 * 0.8} y={0} width={4} height={14} fill={bands[3]} />
      </Group>

      {/* Resistance Label */}
      <Text
        text={resistanceLabel}
        x={0} y={20}
        width={60}
        align="center"
        fontSize={9}
        fontFamily="sans-serif"
        fill="#374151"
        listening={false}
      />

      {renderPins()}
    </Group>
  );
};
