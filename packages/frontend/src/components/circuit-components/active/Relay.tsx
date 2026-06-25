import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Group, Rect, Circle, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface RelayProps {
  component: CircuitComponent;
}

const COMMONLY_USED_PINS = ['IN', 'VCC', 'GND', 'NO', 'COM', 'NC'];

export const Relay = memo(({ component }: RelayProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const ledRef = useRef<Konva.Rect>(null);

  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.componentStates[component.id],
      (compState: any) => {
        const isActivated = compState?.isActivated ?? false;
        if (ledRef.current) {
          ledRef.current.fill(isActivated ? "#ef4444" : "#4b5563");
        }
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

  const renderPins = () => {
    return Object.values(component.pins).map((pin) => {
      const isCommon = COMMONLY_USED_PINS.includes(pin.id);
      const isHovered = hoveredPin === pin.id;
      
      const isTopSide = ['NO', 'COM', 'NC'].includes(pin.id);
      
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
          {!isTopSide && (
            // Red pin extending from PCB bottom to connection point
            <Rect x={-1.5} y={-12} width={3} height={12} fill="#ef4444" />
          )}

          {isCommon && (
            <Group x={0} y={0}>
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
      <Group x={-35} y={-50}>
        {/* Main PCB */}
        <Rect width={70} height={100} fill="#262626" cornerRadius={2} />
        
        {/* Mounting holes */}
        <Circle x={5} y={5} radius={2} fill="#e5e7eb" />
        <Circle x={65} y={5} radius={2} fill="#e5e7eb" />
        <Circle x={5} y={95} radius={2} fill="#e5e7eb" />
        <Circle x={65} y={95} radius={2} fill="#e5e7eb" />

        {/* Top Terminal Block (Blue) */}
        <Rect x={10} y={0} width={55} height={20} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1} />
        {/* Screw terminals */}
        {[20, 37.5, 55].map((x) => (
          <Group key={x} x={x} y={10}>
            <Circle radius={6} fill="#fcd34d" stroke="#b45309" strokeWidth={1} />
            <Line points={[-4, -4, 4, 4]} stroke="#b45309" strokeWidth={1.5} />
          </Group>
        ))}
        {/* Terminal Labels */}
        <Text text="NC" x={16} y={22} fontSize={7} fill="#ffffff" fontFamily="monospace" />
        <Text text="C" x={35} y={22} fontSize={7} fill="#ffffff" fontFamily="monospace" />
        <Text text="NO" x={51} y={22} fontSize={7} fill="#ffffff" fontFamily="monospace" />

        {/* Main Relay Box */}
        <Rect x={20} y={32} width={45} height={50} fill="#3b82f6" />
        {/* Text on Relay Box (rotated) */}
        <Group x={25} y={80} rotation={-90}>
          <Text text="SRD-05VDC-SL-C" x={0} y={0} fontSize={6} fill="#ffffff" fontFamily="monospace" />
          <Text text="10A 250VAC 10A 125VAC" x={0} y={10} fontSize={4} fill="#ffffff" fontFamily="monospace" />
          <Text text="10A 30VDC  10A 28VDC" x={0} y={18} fontSize={4} fill="#ffffff" fontFamily="monospace" />
        </Group>

        {/* Right side text */}
        <Text text="Keyes_SR1y" x={68} y={85} rotation={-90} fontSize={8} fill="#ffffff" fontFamily="monospace" />

        {/* Left side components */}
        {/* Diode D1 */}
        <Text text="D1" x={2} y={35} rotation={-90} fontSize={5} fill="#ffffff" />
        <Rect x={8} y={30} width={6} height={14} fill="#000000" />
        <Rect x={8} y={30} width={6} height={3} fill="#9ca3af" />
        <Circle x={11} y={28} radius={1} fill="#9ca3af" />
        <Circle x={11} y={46} radius={1} fill="#9ca3af" />
        
        {/* Transistor Q1 */}
        <Text text="Q1" x={2} y={55} rotation={-90} fontSize={5} fill="#ffffff" />
        <Rect x={8} y={52} width={6} height={5} fill="#000000" />
        <Line points={[9, 57, 9, 59]} stroke="#9ca3af" strokeWidth={1} />
        <Line points={[11, 57, 11, 59]} stroke="#9ca3af" strokeWidth={1} />
        <Line points={[13, 57, 13, 59]} stroke="#9ca3af" strokeWidth={1} />
        
        {/* Resistor R1 */}
        <Text text="R1" x={18} y={75} rotation={-90} fontSize={5} fill="#ffffff" />
        <Rect x={8} y={65} width={6} height={12} fill="#000000" stroke="#ffffff" strokeWidth={0.5} />
        <Circle x={11} y={63} radius={1} fill="#9ca3af" />
        <Circle x={11} y={79} radius={1} fill="#9ca3af" />

        {/* Bottom Left LED */}
        <Text text="ON_Led" x={4} y={85} fontSize={5} fill="#ffffff" />
        <Rect ref={ledRef} x={8} y={92} width={6} height={4} fill="#4b5563" />

        {/* Bottom Right Header block */}
        <Rect x={35} y={85} width={30} height={15} stroke="#ffffff" strokeWidth={0.5} />
        <Text text="S" x={38} y={86} fontSize={6} fill="#ffffff" />
        <Text text="-" x={58} y={86} fontSize={6} fill="#ffffff" />
        {/* Black headers */}
        <Rect x={38} y={93} width={4} height={7} fill="#000000" />
        <Rect x={48} y={93} width={4} height={7} fill="#000000" />
        <Rect x={58} y={93} width={4} height={7} fill="#000000" />
      </Group>

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
