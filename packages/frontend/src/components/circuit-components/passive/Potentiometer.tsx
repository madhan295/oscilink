import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Group, Rect, Circle, Label, Tag, Text, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface PotentiometerProps {
  component: CircuitComponent;
}

export const Potentiometer = memo(({ component }: PotentiometerProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [isHoveringKnob, setIsHoveringKnob] = useState(false);
  const [isDraggingKnob, setIsDraggingKnob] = useState(false);
  const [localValue, setLocalValue] = useState(512);
  
  const outerGroupRef = useRef<Konva.Group>(null);
  const knobRef = useRef<Konva.Group>(null);
  const valTextRef = useRef<Konva.Text>(null);
  const volTextRef = useRef<Konva.Text>(null);
  const isDraggingRef = useRef(isDraggingKnob);
  const localValueRef = useRef(localValue);

  useEffect(() => {
    isDraggingRef.current = isDraggingKnob;
    localValueRef.current = localValue;
  }, [isDraggingKnob, localValue]);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const status = useSimulationStore((state) => state.status);

  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.componentStates[component.id],
      (compState: any) => {
        const simValue = compState?.value ?? 512;
        const simVoltage = compState?.voltage ?? 0;
        
        const displayValue = isDraggingRef.current ? localValueRef.current : simValue;
        const angle = ((displayValue / 1023) * 270) - 135;
        
        if (knobRef.current) knobRef.current.rotation(angle);
        if (valTextRef.current) valTextRef.current.text(Math.round(displayValue).toString());
        if (volTextRef.current) volTextRef.current.text(`${simVoltage.toFixed(2)}V`);
      }
    );
    return unsubscribe;
  }, [component.id]);

  const getDisplayValue = () => isDraggingKnob ? localValue : (useSimulationStore.getState().componentStates[component.id] as any)?.value ?? 512;

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

  const notifyValueChange = useCallback((val: number) => {
    window.dispatchEvent(new CustomEvent('EXTERNAL_INPUT', {
      detail: { componentId: component.id, type: 'potentiometer', value: val }
    }));
  }, [component.id]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.cancelBubble = true;
    if (status !== 'RUNNING') return;
    
    const delta = e.evt.deltaY < 0 ? 30 : -30;
    const currentVal = getDisplayValue();
    const newVal = Math.max(0, Math.min(1023, currentVal + delta));
    setLocalValue(newVal);
    if (knobRef.current) knobRef.current.rotation(((newVal / 1023) * 270) - 135);
    notifyValueChange(newVal);
  }, [status, notifyValueChange]);

  const handleKnobMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (status !== 'RUNNING') return;
    e.cancelBubble = true;
    setIsDraggingKnob(true);
    setLocalValue(getDisplayValue());
  }, [status]);

  useEffect(() => {
    if (!isDraggingKnob) return;

    const handleMouseMove = () => {
      if (!outerGroupRef.current) return;
      const stage = outerGroupRef.current.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;

      const transform = outerGroupRef.current.getAbsoluteTransform().copy();
      transform.invert();
      const local = transform.point(pointer);
      
      const centerX = 25;
      const centerY = 18;
      
      let angle = Math.atan2(local.y - centerY, local.x - centerX) * (180 / Math.PI);
      
      let relAngle = angle + 90;
      if (relAngle > 180) relAngle -= 360;
      
      relAngle = Math.max(-135, Math.min(135, relAngle));
      
      const newValue = Math.round(((relAngle + 135) / 270) * 1023);
      setLocalValue(newValue);
      if (knobRef.current) knobRef.current.rotation(((newValue / 1023) * 270) - 135);
      notifyValueChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDraggingKnob(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingKnob, component.id, notifyValueChange]);

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

  const initialDisplayValue = getDisplayValue();
  const initialAngle = ((initialDisplayValue / 1023) * 270) - 135;

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
      <Group listening={false}>
        <Line points={[10, 36, 10, 40]} stroke="#C0C0C0" strokeWidth={2} />
        <Line points={[25, 36, 25, 40]} stroke="#C0C0C0" strokeWidth={2} />
        <Line points={[40, 36, 40, 40]} stroke="#C0C0C0" strokeWidth={2} />
      </Group>

      <Circle x={25} y={18} radius={18} fill="#262626" stroke="#404040" strokeWidth={2} listening={false} />

      <Group
        x={25} y={18}
        onWheel={handleWheel}
        onMouseEnter={() => {
          setIsHoveringKnob(true);
          if (status === 'RUNNING') document.body.style.cursor = 'grab';
        }}
        onMouseLeave={() => {
          setIsHoveringKnob(false);
          document.body.style.cursor = 'default';
        }}
        onMouseDown={handleKnobMouseDown}
      >
        <Circle x={0} y={0} radius={14} fill="#333333" stroke="#525252" strokeWidth={1} />
        <Group ref={knobRef} rotation={initialAngle}>
          <Line points={[0, -2, 0, -12]} stroke="#fbbf24" strokeWidth={2} lineCap="round" />
        </Group>
      </Group>

      {isHoveringKnob && status !== 'RUNNING' && (
        <Label x={25} y={-10} opacity={0.9}>
          <Tag fill="#1f2937" pointerDirection="down" pointerWidth={6} pointerHeight={6} cornerRadius={4} />
          <Text text="Run simulation to interact" fill="white" fontSize={10} padding={4} />
        </Label>
      )}

      {status === 'RUNNING' && (
        <Group x={25} y={50}>
          <Text ref={valTextRef} text={Math.round(initialDisplayValue).toString()} fill="#60a5fa" fontSize={10} align="center" offsetX={15} width={30} />
          <Text ref={volTextRef} text="0.00V" fill="#34d399" fontSize={10} align="center" y={12} offsetX={15} width={30} />
        </Group>
      )}

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
