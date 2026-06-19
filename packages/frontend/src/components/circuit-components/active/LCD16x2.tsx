import React, { useState, useRef, useEffect } from 'react';

import { Group, Rect, Circle, Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface LCDProps {
  component: CircuitComponent;
}

const COMMONLY_USED_PINS = ['VSS', 'VDD', 'V0', 'RS', 'RW', 'E', 'D4', 'D5', 'D6', 'D7', 'A', 'K'];

export const LCD16x2: React.FC<LCDProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  
  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const compState = useSimulationStore((state) => state.componentStates[component.id]) as any;
  const isBacklightOn = compState?.backlight ?? false;
  const rows = compState?.rows ?? ['                ', '                '];
  const cursorRow = compState?.cursorRow;
  const cursorCol = compState?.cursorCol;

  const prevRowsRef = useRef(rows);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rows && prevRowsRef.current) {
      if (rows[0] !== prevRowsRef.current[0]) setFlashRow(0);
      else if (rows[1] !== prevRowsRef.current[1]) setFlashRow(1);
      
      if (rows[0] !== prevRowsRef.current[0] || rows[1] !== prevRowsRef.current[1]) {
        const t = setTimeout(() => setFlashRow(null), 100);
        return () => clearTimeout(t);
      }
    }
    prevRowsRef.current = rows;
  }, [rows]);

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
          {/* Tiny labeled rectangle for the pin */}
          <Rect x={-3} y={0} width={6} height={8} fill="#9ca3af" />
          <Text 
            text={pin.label} 
            x={-15} y={12} 
            width={30} 
            align="center" 
            fontSize={7} 
            fontFamily="monospace"
            fill="#374151" 
          />
          
          {/* Interactive circle if common */}
          {isCommon && (
            <Group y={8}>
              <Circle x={0} y={0} radius={6} fill="transparent" />
              <Circle
                x={0} y={0}
                radius={isHovered ? 2.5 : 1.5}
                fill={isHovered ? '#fbbf24' : '#171717'}
                stroke={isHovered ? '#fbbf24' : '#404040'}
                strokeWidth={isHovered ? 1 : 0.5}
              />
            </Group>
          )}
        </Group>
      );
    });
  };

  const moduleWidth = 176;
  const moduleHeight = 72;
  const innerInset = 8;
  const innerWidth = moduleWidth - innerInset * 2;
  const innerHeight = moduleHeight - innerInset * 2;

  const bgColor = isBacklightOn ? '#1e3a8a' : '#14532d';
  const borderColor = isBacklightOn ? '#1e40af' : '#064e3b';
  const charColor = isBacklightOn ? '#a5f3fc' : '#86efac';
  const flashColor = isBacklightOn ? 'rgba(165, 243, 252, 0.2)' : 'rgba(134, 239, 172, 0.2)';

  const charWidth = 9;
  const charHeight = 16;
  
  // Center the 16x2 grid inside the inner display area
  const gridWidth = 16 * charWidth;
  const gridHeight = 2 * charHeight;
  const gridX = innerInset + (innerWidth - gridWidth) / 2;
  const gridY = innerInset + (innerHeight - gridHeight) / 2;

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
      <Group x={-12} y={-72}>
        {/* Module Background */}
        <Rect
          x={0} y={0}
          width={moduleWidth} height={moduleHeight}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={2}
          cornerRadius={4}
        />
        
        {/* Inner Display Area */}
        <Rect
          x={innerInset} y={innerInset}
          width={innerWidth} height={innerHeight}
          fill={isBacklightOn ? '#0f172a' : '#064e3b'}
          stroke="#000"
          strokeWidth={1}
        />

        {/* Characters Grid */}
        <Group x={gridX} y={gridY}>
          {rows.map((rowText: string, rIndex: number) => (
            <Group key={`row-${rIndex}`} y={rIndex * charHeight}>
              {/* Flash effect */}
              {flashRow === rIndex && (
                <Rect x={0} y={0} width={gridWidth} height={charHeight} fill={flashColor} />
              )}
              
              {rowText.split('').map((char, cIndex) => {
                const isCursorHere = cursorVisible && cursorRow === rIndex && cursorCol === cIndex;
                
                return (
                  <Group key={`cell-${rIndex}-${cIndex}`} x={cIndex * charWidth}>
                    {/* Character cell background / cursor */}
                    {isCursorHere && (
                      <Rect x={0} y={0} width={charWidth} height={charHeight} fill={charColor} />
                    )}
                    
                    {/* Character text */}
                    <Text
                      text={char}
                      x={0} y={2}
                      width={charWidth}
                      height={charHeight}
                      align="center"
                      fontSize={10}
                      fontFamily="monospace"
                      fill={isCursorHere ? (isBacklightOn ? '#0f172a' : '#064e3b') : charColor}
                    />
                  </Group>
                );
              })}
            </Group>
          ))}
        </Group>
        
        {/* Mounting holes on PCB */}
        <Circle x={4} y={4} radius={1.5} fill="#000" />
        <Circle x={moduleWidth - 4} y={4} radius={1.5} fill="#000" />
        <Circle x={4} y={moduleHeight - 4} radius={1.5} fill="#000" />
        <Circle x={moduleWidth - 4} y={moduleHeight - 4} radius={1.5} fill="#000" />
      </Group>

      {renderPins()}
    </Group>
  );
};



