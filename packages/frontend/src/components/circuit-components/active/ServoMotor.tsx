import React, { useState, useRef, useEffect } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Circle, Text, Line, Path } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface ServoMotorProps {
  component: CircuitComponent;
}

export const ServoMotor: React.FC<ServoMotorProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [displayedAngle, setDisplayedAngle] = useState(90);
  
  const outerGroupRef = useRef<any>(null);
  useComponentDropAnimation(component, outerGroupRef);
  const animFrameRef = useRef<number>();

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const compState = useSimulationStore((state) => state.componentStates[component.id]);
  const servoType = component.properties?.servoType || 'positional';
  const targetAngle = (compState as { angle?: number })?.angle ?? 90;
  const targetSpeed = (compState as { speed?: number })?.speed ?? 0;

  useEffect(() => {
    let lastTime = performance.now();
    const updateAnimation = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      setDisplayedAngle(current => {
        if (servoType === 'continuous') {
          return current + targetSpeed * 0.36 * dt;
        } else {
          const diff = targetAngle - current;
          if (Math.abs(diff) < 0.5) return targetAngle;
          return current + diff * 0.15;
        }
      });
      animFrameRef.current = requestAnimationFrame(updateAnimation);
    };
    animFrameRef.current = requestAnimationFrame(updateAnimation);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetAngle, targetSpeed, servoType]);

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
          <Text
            text={pin.label}
            visible={isHovered}
            x={-10} 
            y={6}
            width={20}
            align="center"
            fontSize={7} fontFamily="sans-serif" fontStyle="bold"
            fill="#374151" opacity={0.85}
          />
        </Group>
      );
    });
  };

  // Maps 0-180 to -90 to +90 visually
  const visualAngle = displayedAngle - 90;

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
      {/* Main visual elements shifted up to expose terminals */}
      <Group y={-10}>
        {/* Main Blue Body */}
        <Group>
        {/* The body shape with cutout at the bottom */}
        <Path
          data="M 7 -26 L 43 -26 L 43 42 L 29 42 A 4 4 0 0 0 21 42 L 7 42 Z"
          fill="#287ae6"
          stroke="#1557b0"
          strokeWidth={2}
          lineJoin="round"
        />
        {/* Horizontal lines to separate the tabs */}
        <Line points={[7, -20, 43, -20]} stroke="#1557b0" strokeWidth={1} />
        <Line points={[7, 36, 43, 36]} stroke="#1557b0" strokeWidth={1} />
        
        {/* Mounting holes */}
        <Circle x={11} y={-23} radius={1.5} fill="#7cb3f5" />
        <Circle x={39} y={-23} radius={1.5} fill="#7cb3f5" />
        <Circle x={11} y={39} radius={1.5} fill="#7cb3f5" />
        <Circle x={39} y={39} radius={1.5} fill="#7cb3f5" />


      </Group>

      {/* Output Shaft & Arm Pivot at Top Center */}
      <Group x={25} y={-2}>
        <Group rotation={visualAngle}>
          {servoType === 'positional' ? (
            <>
              {/* White Cross Arm */}
              {/* Outline */}
              <Line points={[0, -20, 0, 20]} stroke="#9ca3af" strokeWidth={10} lineCap="round" />
              <Line points={[-12, 0, 12, 0]} stroke="#9ca3af" strokeWidth={10} lineCap="round" />
              <Circle x={0} y={0} radius={11} fill="#9ca3af" />
              
              {/* Inner fill */}
              <Line points={[0, -20, 0, 20]} stroke="#f3f4f6" strokeWidth={8} lineCap="round" />
              <Line points={[-12, 0, 12, 0]} stroke="#f3f4f6" strokeWidth={8} lineCap="round" />
              <Circle x={0} y={0} radius={10} fill="#f3f4f6" />

              {/* Holes in the arms */}
              {[ -6, -9, -12, -15, -18 ].map(y => <Circle key={`t${y}`} x={0} y={y} radius={1} fill="#9ca3af" />)}
              {[ 6, 9, 12, 15, 18 ].map(y => <Circle key={`b${y}`} x={0} y={y} radius={1} fill="#9ca3af" />)}
              {[ -6, -10 ].map(x => <Circle key={`l${x}`} x={x} y={0} radius={1} fill="#9ca3af" />)}
              {[ 6, 10 ].map(x => <Circle key={`r${x}`} x={x} y={0} radius={1} fill="#9ca3af" />)}
            </>
          ) : (
            <>
              {/* Continuous Wheel */}
              <Circle radius={30} fill="#333333" stroke="#222222" strokeWidth={2} />
              {/* Inner Hub */}
              <Circle radius={10} fill="#262626" />
              {/* Spokes */}
              {[0, 72, 144, 216, 288].map(ang => (
                <Group key={ang} rotation={ang}>
                  <Rect x={8} y={-3} width={22} height={6} fill="#262626" />
                  <Rect x={12} y={-1.5} width={15} height={3} fill="#1a1a1a" cornerRadius={1} />
                </Group>
              ))}
              {/* Rim highlight */}
              <Circle radius={28} stroke="#404040" strokeWidth={1} />
            </>
          )}

          {/* Center screw (shared) */}
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
};



