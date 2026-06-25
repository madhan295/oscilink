import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Circle, Text, Line, Path } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface ServoMotorProps {
  component: CircuitComponent;
}

export const ServoMotor = memo(({ component }: ServoMotorProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  
  const displayedAngleRef = useRef(90);
  const armGroupRef = useRef<Konva.Group>(null);
  
  const outerGroupRef = useRef<any>(null);
  useComponentDropAnimation(component, outerGroupRef);
  const animFrameRef = useRef<number>();

  const targetAngleRef = useRef(90);
  const targetSpeedRef = useRef(0);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const servoType = component.properties?.servoType || 'positional';

  useEffect(() => {
    let lastTime = performance.now();
    const updateAnimation = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      const state = useSimulationStore.getState();
      const compState = state.componentStates[component.id] as any;
      const targetAngle = compState?.angle ?? 90;
      const targetSpeed = compState?.speed ?? 0;

      let current = displayedAngleRef.current;
      if (servoType === 'continuous') {
        current += targetSpeed * 0.36 * dt;
      } else {
        const diff = targetAngle - current;
        if (Math.abs(diff) >= 0.5) {
          current += diff * 0.15;
        } else {
          current = targetAngle;
        }
      }
      
      displayedAngleRef.current = current;
      if (armGroupRef.current) {
        armGroupRef.current.rotation(current - 90);
      }
      
      animFrameRef.current = requestAnimationFrame(updateAnimation);
    };
    animFrameRef.current = requestAnimationFrame(updateAnimation);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [servoType]);

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

  const initialVisualAngle = displayedAngleRef.current - 90;

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
      <Group y={-10}>
        <Group listening={false}>
        <Path
          data="M 7 -26 L 43 -26 L 43 42 L 29 42 A 4 4 0 0 0 21 42 L 7 42 Z"
          fill="#287ae6"
          stroke="#1557b0"
          strokeWidth={2}
          lineJoin="round"
        />
        <Line points={[7, -20, 43, -20]} stroke="#1557b0" strokeWidth={1} />
        <Line points={[7, 36, 43, 36]} stroke="#1557b0" strokeWidth={1} />
        
        <Circle x={11} y={-23} radius={1.5} fill="#7cb3f5" />
        <Circle x={39} y={-23} radius={1.5} fill="#7cb3f5" />
        <Circle x={11} y={39} radius={1.5} fill="#7cb3f5" />
        <Circle x={39} y={39} radius={1.5} fill="#7cb3f5" />
      </Group>

      <Group x={25} y={-2}>
        <Group ref={armGroupRef} rotation={initialVisualAngle} listening={false}>
          {servoType === 'positional' ? (
            <>
              <Line points={[0, -20, 0, 20]} stroke="#9ca3af" strokeWidth={10} lineCap="round" />
              <Line points={[-12, 0, 12, 0]} stroke="#9ca3af" strokeWidth={10} lineCap="round" />
              <Circle x={0} y={0} radius={11} fill="#9ca3af" />
              
              <Line points={[0, -20, 0, 20]} stroke="#f3f4f6" strokeWidth={8} lineCap="round" />
              <Line points={[-12, 0, 12, 0]} stroke="#f3f4f6" strokeWidth={8} lineCap="round" />
              <Circle x={0} y={0} radius={10} fill="#f3f4f6" />

              {[ -6, -9, -12, -15, -18 ].map(y => <Circle key={`t${y}`} x={0} y={y} radius={1} fill="#9ca3af" />)}
              {[ 6, 9, 12, 15, 18 ].map(y => <Circle key={`b${y}`} x={0} y={y} radius={1} fill="#9ca3af" />)}
              {[ -6, -10 ].map(x => <Circle key={`l${x}`} x={x} y={0} radius={1} fill="#9ca3af" />)}
              {[ 6, 10 ].map(x => <Circle key={`r${x}`} x={x} y={0} radius={1} fill="#9ca3af" />)}
            </>
          ) : (
            <>
              <Circle radius={30} fill="#333333" stroke="#222222" strokeWidth={2} />
              <Circle radius={10} fill="#262626" />
              {[0, 72, 144, 216, 288].map(ang => (
                <Group key={ang} rotation={ang}>
                  <Rect x={8} y={-3} width={22} height={6} fill="#262626" />
                  <Rect x={12} y={-1.5} width={15} height={3} fill="#1a1a1a" cornerRadius={1} />
                </Group>
              ))}
              <Circle radius={28} stroke="#404040" strokeWidth={1} />
            </>
          )}

          <Circle x={0} y={0} radius={5} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
          <Line points={[-2.5, 0, 2.5, 0]} stroke="#6b7280" strokeWidth={1} />
          <Line points={[0, -2.5, 0, 2.5]} stroke="#6b7280" strokeWidth={1} />
          <Circle x={0} y={0} radius={2.5} stroke="#6b7280" strokeWidth={0.5} />
        </Group>
      </Group>

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
