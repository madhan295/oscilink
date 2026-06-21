import React, { useState, useRef } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Line, Circle, Text, Shape } from 'react-konva';
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
  useComponentDropAnimation(component, outerGroupRef);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const handleDragStart = () => {
    useWorkspaceStore.getState().pushHistory();
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
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
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Rect x={-5} y={-5} width={70} height={35} fill="transparent" listening={false} />

      {/* Leads */}
      <Group listening={false}>
        <Line points={[0, 10, 8, 10]} stroke="#C0C0C0" strokeWidth={2} />
        <Line points={[52, 10, 60, 10]} stroke="#C0C0C0" strokeWidth={2} />
      </Group>

      {/* Body */}
      <Group x={8} y={3}>
        {/* Base Body Shape */}
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(7, 0);
            context.lineTo(10, 0);
            context.bezierCurveTo(12, 0, 13, 2, 15, 2);
            context.lineTo(29, 2);
            context.bezierCurveTo(31, 2, 32, 0, 34, 0);
            context.lineTo(37, 0);
            context.arc(37, 7, 7, -Math.PI / 2, Math.PI / 2);
            context.lineTo(34, 14);
            context.bezierCurveTo(32, 14, 31, 12, 29, 12);
            context.lineTo(15, 12);
            context.bezierCurveTo(13, 12, 12, 14, 10, 14);
            context.lineTo(7, 14);
            context.arc(7, 7, 7, Math.PI / 2, Math.PI * 1.5);
            context.closePath();
            context.fillStrokeShape(shape);
          }}
          fill="#dcb285"
          stroke="#b68c5b"
          strokeWidth={1}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={3}
          shadowOffsetY={1}
        />

        {/* Color Bands */}
        <Group
          clipFunc={(context) => {
            context.beginPath();
            context.moveTo(7, 0);
            context.lineTo(10, 0);
            context.bezierCurveTo(12, 0, 13, 2, 15, 2);
            context.lineTo(29, 2);
            context.bezierCurveTo(31, 2, 32, 0, 34, 0);
            context.lineTo(37, 0);
            context.arc(37, 7, 7, -Math.PI / 2, Math.PI / 2);
            context.lineTo(34, 14);
            context.bezierCurveTo(32, 14, 31, 12, 29, 12);
            context.lineTo(15, 12);
            context.bezierCurveTo(13, 12, 12, 14, 10, 14);
            context.lineTo(7, 14);
            context.arc(7, 7, 7, Math.PI / 2, Math.PI * 1.5);
            context.closePath();
          }}
        >
          <Rect x={7} y={0} width={4} height={14} fill={bands[0]} />
          <Rect x={15} y={0} width={4} height={14} fill={bands[1]} />
          <Rect x={23} y={0} width={4} height={14} fill={bands[2]} />
          <Rect x={33} y={0} width={4} height={14} fill={bands[3]} />
        </Group>

        {/* 3D Highlight/Shadow Overlay */}
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath();
            context.moveTo(7, 0);
            context.lineTo(10, 0);
            context.bezierCurveTo(12, 0, 13, 2, 15, 2);
            context.lineTo(29, 2);
            context.bezierCurveTo(31, 2, 32, 0, 34, 0);
            context.lineTo(37, 0);
            context.arc(37, 7, 7, -Math.PI / 2, Math.PI / 2);
            context.lineTo(34, 14);
            context.bezierCurveTo(32, 14, 31, 12, 29, 12);
            context.lineTo(15, 12);
            context.bezierCurveTo(13, 12, 12, 14, 10, 14);
            context.lineTo(7, 14);
            context.arc(7, 7, 7, Math.PI / 2, Math.PI * 1.5);
            context.closePath();
            context.fillStrokeShape(shape);
          }}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 14 }}
          fillLinearGradientColorStops={[
            0, 'rgba(0,0,0,0.15)',
            0.3, 'rgba(255,255,255,0.4)',
            0.6, 'rgba(255,255,255,0)',
            1, 'rgba(0,0,0,0.25)'
          ]}
          listening={false}
        />
      </Group>

      {renderPins()}
    </Group>
  );
};
