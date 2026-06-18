import React, { useState, useRef, useEffect } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Circle, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { CanvasContext } from '../../canvas/Canvas';

interface UltrasonicSensorProps {
  component: CircuitComponent;
}

const COMMONLY_USED_PINS = ['VCC', 'TRIG', 'ECHO', 'GND'];

export const UltrasonicSensor: React.FC<UltrasonicSensorProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const handleDragStart = () => {
    useWorkspaceStore.getState().pushHistory();
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().updateComponentPosition(component.id, {
      x: e.target.x(),
      y: e.target.y()
    });
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

  const renderPins = () => {
    return Object.values(component.pins).map((pin) => {
      const isCommon = COMMONLY_USED_PINS.includes(pin.label);
      const isHovered = hoveredPin === pin.id;
      return (
        <Group
          key={pin.id}
          x={pin.position.x}
          y={pin.position.y}
          onMouseEnter={() => {
            if (isCommon) {
              setHoveredPin(pin.id);
              document.body.style.cursor = 'crosshair';
              handlePinMouseEnter({ componentId: component.id, pinId: pin.id });
            }
          }}
          onMouseLeave={() => {
            if (isCommon) {
              setHoveredPin(null);
              document.body.style.cursor = 'default';
              handlePinMouseLeave();
            }
          }}
          onMouseDown={(e) => {
            if (isCommon) onPinMouseDown(e, pin.id);
          }}
        >
          {isCommon && (
            <Group y={0}>
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
          )}
        </Group>
      );
    });
  };

  return (
    <Group
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
      <Group x={-52} y={-58}>
        <Rect width={104} height={48} fill="#115268" cornerRadius={2} />
        
        {/* Mounting Holes */}
        <Circle x={6} y={42} radius={3.5} fill="#ffffff" />
        <Circle x={98} y={6} radius={3.5} fill="#ffffff" />

        {/* Top Left Text */}
        <Text text="HC-SR04" x={3} y={3} fontSize={4.5} fill="#ffffff" fontFamily="sans-serif" fontStyle="bold" />

        {/* Top Center Text */}
        <Text text="ULTRASONIC SENSOR" x={52} y={4} offsetX={30} width={60} align="center" fontSize={3.5} fill="#ffffff" fontFamily="sans-serif" />

        {/* Center Text */}
        <Rect x={49} y={15} width={6} height={3} fill="#d1d5db" />
        <Text text="HC-SR04" x={52} y={19} offsetX={20} width={40} align="center" fontSize={4.5} fontStyle="bold" fill="#ffffff" />

        {/* ACT Component */}
        <Group x={46} y={7}>
          <Rect width={8} height={4.5} fill="transparent" stroke="#ffffff" strokeWidth={0.5} />
          <Rect width={8} height={2} fill="#e5e7eb" />
          <Rect y={2} width={8} height={2.5} fill="#1f2937" />
          <Text text="ACT" x={0} y={5.5} width={8} align="center" fontSize={3} fill="#ffffff" />
        </Group>

        {/* SMDs */}
        {/* Top near ACT */}
        <Group x={58} y={8}>
          <Rect x={0} y={0} width={1} height={1.5} fill="#d1d5db" />
          <Rect x={1} y={0} width={2.5} height={1.5} fill="#111827" />
          <Rect x={3.5} y={0} width={1} height={1.5} fill="#d1d5db" />
        </Group>
        
        {/* Bottom Left near pins */}
        <Group x={40.5} y={32}>
          <Rect x={0} y={0} width={1.5} height={1} fill="#d1d5db" />
          <Rect x={0} y={1} width={1.5} height={2.5} fill="#111827" />
          <Rect x={0} y={3.5} width={1.5} height={1} fill="#d1d5db" />
        </Group>

        {/* Bottom Right near pins */}
        <Group x={62} y={32}>
          <Rect x={0} y={0} width={1.5} height={1} fill="#d1d5db" />
          <Rect x={0} y={1} width={1.5} height={2.5} fill="#111827" />
          <Rect x={0} y={3.5} width={1.5} height={1} fill="#d1d5db" />
        </Group>

        {/* Left Transducer */}
        <Group x={22} y={24}>
          <Circle 
            radius={19} 
            fillLinearGradientStartPoint={{ x: -19, y: -19 }}
            fillLinearGradientEndPoint={{ x: 19, y: 19 }}
            fillLinearGradientColorStops={[0, '#f3f4f6', 1, '#9ca3af']}
          />
          <Circle radius={14} fill="#374151" />
          <Circle 
            radius={13} 
            fillLinearGradientStartPoint={{ x: -13, y: -13 }}
            fillLinearGradientEndPoint={{ x: 13, y: 13 }}
            fillLinearGradientColorStops={[0, '#a3a629', 1, '#70731a']}
          />
          <Circle 
            radius={9} 
            fillLinearGradientStartPoint={{ x: -9, y: -9 }}
            fillLinearGradientEndPoint={{ x: 9, y: 9 }}
            fillLinearGradientColorStops={[0, '#6b7280', 1, '#d1d5db']}
          />
        </Group>

        {/* Right Transducer */}
        <Group x={82} y={24}>
          <Circle 
            radius={19} 
            fillLinearGradientStartPoint={{ x: -19, y: -19 }}
            fillLinearGradientEndPoint={{ x: 19, y: 19 }}
            fillLinearGradientColorStops={[0, '#f3f4f6', 1, '#9ca3af']}
          />
          <Circle radius={14} fill="#374151" />
          <Circle 
            radius={13} 
            fillLinearGradientStartPoint={{ x: -13, y: -13 }}
            fillLinearGradientEndPoint={{ x: 13, y: 13 }}
            fillLinearGradientColorStops={[0, '#a3a629', 1, '#70731a']}
          />
          <Circle 
            radius={9} 
            fillLinearGradientStartPoint={{ x: -9, y: -9 }}
            fillLinearGradientEndPoint={{ x: 9, y: 9 }}
            fillLinearGradientColorStops={[0, '#6b7280', 1, '#d1d5db']}
          />
        </Group>

        {/* Pin Labels on PCB */}
        <Group x={42} y={26}>
          <Rect width={20} height={18} stroke="#ffffff" strokeWidth={0.5} />
          <Line points={[5, 0, 5, 18]} stroke="#ffffff" strokeWidth={0.5} />
          <Line points={[10, 0, 10, 18]} stroke="#ffffff" strokeWidth={0.5} />
          <Line points={[15, 0, 15, 18]} stroke="#ffffff" strokeWidth={0.5} />
          
          <Group x={1.5} y={15} rotation={-90}><Text text="VCC" fontSize={3} fill="#ffffff" /></Group>
          <Group x={6.5} y={15} rotation={-90}><Text text="TRIG" fontSize={2.8} fill="#ffffff" /></Group>
          <Group x={11.5} y={15} rotation={-90}><Text text="ECHO" fontSize={2.8} fill="#ffffff" /></Group>
          <Group x={16.5} y={15} rotation={-90}><Text text="GND" fontSize={3} fill="#ffffff" /></Group>

          <Circle x={2.5} y={16.5} radius={1} fill="#d1d5db" />
          <Circle x={7.5} y={16.5} radius={1} fill="#d1d5db" />
          <Circle x={12.5} y={16.5} radius={1} fill="#d1d5db" />
          <Circle x={17.5} y={16.5} radius={1} fill="#d1d5db" />
        </Group>

        {/* Black Pin Headers */}
        <Group x={43} y={45}>
          <Rect x={0} y={0} width={3} height={6} fill="#4b5563" />
          <Rect x={0} y={1} width={3} height={4} fill="#111827" />
        </Group>
        <Group x={48} y={45}>
          <Rect x={0} y={0} width={3} height={6} fill="#4b5563" />
          <Rect x={0} y={1} width={3} height={4} fill="#111827" />
        </Group>
        <Group x={53} y={45}>
          <Rect x={0} y={0} width={3} height={6} fill="#4b5563" />
          <Rect x={0} y={1} width={3} height={4} fill="#111827" />
        </Group>
        <Group x={58} y={45}>
          <Rect x={0} y={0} width={3} height={6} fill="#4b5563" />
          <Rect x={0} y={1} width={3} height={4} fill="#111827" />
        </Group>
        
        {/* Metal Pins */}
        <Rect x={44} y={51} width={1} height={7} fill="#d1d5db" />
        <Rect x={49} y={51} width={1} height={7} fill="#d1d5db" />
        <Rect x={54} y={51} width={1} height={7} fill="#d1d5db" />
        <Rect x={59} y={51} width={1} height={7} fill="#d1d5db" />
      </Group>

      {renderPins()}
    </Group>
  );
};



