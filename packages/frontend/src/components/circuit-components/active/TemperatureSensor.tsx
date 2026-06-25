import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Group, Rect, Circle, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface TemperatureSensorProps {
  component: CircuitComponent;
}

export const TemperatureSensor = memo(({ component }: TemperatureSensorProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const displayGroupRef = useRef<Konva.Group>(null);
  const inactiveIconRef = useRef<Konva.Group>(null);
  const tempTextRef = useRef<Konva.Text>(null);
  const humTextRef = useRef<Konva.Text>(null);

  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.componentStates[component.id],
      (compState: any) => {
        const isActive = !!compState?.isActive;
        const temp = compState?.temperatureCelsius ?? 25.0;
        const humidity = compState?.humidity ?? 60;

        if (displayGroupRef.current) displayGroupRef.current.visible(isActive);
        if (inactiveIconRef.current) inactiveIconRef.current.visible(!isActive);
        if (tempTextRef.current) tempTextRef.current.text(`${temp.toFixed(1)}°C`);
        if (humTextRef.current) humTextRef.current.text(`${humidity.toFixed(0)}%`);
      }
    );
    return unsubscribe;
  }, [component.id]);

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

  const COMMONLY_USED_PINS = ['VCC', 'DATA', 'GND'];

  const renderPins = () => {
    return Object.values(component.pins).map((pin) => {
      const isCommon = COMMONLY_USED_PINS.includes(pin.id);
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
      scaleX={component.properties?.flipX ? -1 : 1}
      scaleY={component.properties?.flipY ? -1 : 1}
      draggable
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <Group x={-25} y={-66}>
        {/* Main PCB Board */}
        <Rect
          x={0}
          y={0}
          width={50}
          height={60}
          fill="#1a56db"
          cornerRadius={3}
          stroke="#1e65f8"
          strokeWidth={1}
          shadowColor="#000"
          shadowBlur={4}
          shadowOpacity={0.3}
          shadowOffsetY={2}
        />

        {/* DHT11 Text Label */}
        <Text
          x={0}
          y={4}
          width={50}
          align="center"
          text="DHT11"
          fontSize={7}
          fill="#ffffff"
          fontFamily="monospace"
          fontStyle="bold"
        />

        {/* Sensing Element Background */}
        <Rect
          x={7}
          y={14}
          width={36}
          height={30}
          fill="#0a2d6b"
          cornerRadius={2}
          stroke="#3b82f6"
          strokeWidth={0.5}
        />

        {/* Sensing Grid (Horizontal Lines) */}
        {[18, 22, 26, 30, 34, 38].map(yPos => (
          <Line
            key={`h-${yPos}`}
            points={[9, yPos, 41, yPos]}
            stroke="#60a5fa"
            strokeWidth={0.4}
            opacity={0.7}
          />
        ))}

        {/* Sensing Grid (Vertical Lines) */}
        {[13, 18, 23, 28, 33, 38].map(xPos => (
          <Line
            key={`v-${xPos}`}
            points={[xPos, 16, xPos, 42]}
            stroke="#60a5fa"
            strokeWidth={0.4}
            opacity={0.7}
          />
        ))}

        {/* Live Simulation Display Overlay */}
        <Group ref={displayGroupRef} visible={false}>
          <Rect
            x={2}
            y={14}
            width={46}
            height={28}
            fill="rgba(0,0,0,0.75)"
            cornerRadius={2}
          />
          <Text
            ref={tempTextRef}
            x={2}
            y={17}
            width={46}
            align="center"
            text="25.0°C"
            fontSize={11}
            fill="#ff6b6b"
            fontFamily="monospace"
            fontStyle="bold"
          />
          <Text
            ref={humTextRef}
            x={2}
            y={31}
            width={46}
            align="center"
            text="60%"
            fontSize={9}
            fill="#60a5fa"
            fontFamily="monospace"
          />
        </Group>

        <Group ref={inactiveIconRef} visible={true}>
          {/* Sensor Face Circle */}
          <Circle
            x={25}
            y={29}
            radius={9}
            fill="#1e3a8a"
            stroke="#60a5fa"
            strokeWidth={0.5}
          />

          {/* Temperature Icon */}
          <Circle
            x={25}
            y={29}
            radius={4}
            fill="none"
            stroke="#93c5fd"
            strokeWidth={1}
          />
          <Line
            points={[25, 25, 25, 32]}
            stroke="#93c5fd"
            strokeWidth={1.5}
          />
        </Group>

        {/* Pin Label Area */}
        <Text
          x={5}
          y={48}
          width={12}
          align="center"
          text="VCC"
          fontSize={4}
          fill="#ff6b6b"
          fontFamily="monospace"
        />
        <Text
          x={19}
          y={48}
          width={12}
          align="center"
          text="DAT"
          fontSize={4}
          fill="#ffffff"
          fontFamily="monospace"
        />
        <Text
          x={33}
          y={48}
          width={12}
          align="center"
          text="GND"
          fontSize={4}
          fill="#6ee7b7"
          fontFamily="monospace"
        />

        {/* Pin Holes */}
        <Circle x={11} y={56} radius={1.2} fill="#d1d5db" />
        <Circle x={25} y={56} radius={1.2} fill="#d1d5db" />
        <Circle x={39} y={56} radius={1.2} fill="#d1d5db" />

        {/* Metal Pins */}
        <Rect x={10.5} y={58} width={1} height={8} fill="#d1d5db" />
        <Rect x={24.5} y={58} width={1} height={8} fill="#d1d5db" />
        <Rect x={38.5} y={58} width={1} height={8} fill="#d1d5db" />
      </Group>

      {/* Render Pin Interaction Points */}
      {renderPins()}
    </Group>
  );
}, (prev, next) => {
  return (
    prev.component.position.x === next.component.position.x &&
    prev.component.position.y === next.component.position.y &&
    prev.component.rotation === next.component.rotation &&
    JSON.stringify(prev.component.properties) === JSON.stringify(next.component.properties)
  );
});
