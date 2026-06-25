import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Group, Rect, Circle, Text, Path } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface BuzzerProps {
  component: CircuitComponent;
}

export const Buzzer = memo(({ component }: BuzzerProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const waveOffsetRef = useRef(0);
  const isActiveRef = useRef(false);

  const arcRef0 = useRef<Konva.Path>(null);
  const arcRef1 = useRef<Konva.Path>(null);
  const arcRef2 = useRef<Konva.Path>(null);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/buzzer_sound.mp3');
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let animFrame: number;
    let lastIsActive = false;
    const animate = () => {
      // Get the latest isActive directly from the store on every frame
      const state = useSimulationStore.getState();
      const isActive = (state.componentStates[component.id] as any)?.isActive ?? false;
      isActiveRef.current = isActive;

      if (isActive !== lastIsActive) {
        lastIsActive = isActive;
        if (audioRef.current) {
          if (isActive && !isMuted) {
            audioRef.current.play().catch((err) => {
              console.warn('Audio play failed:', err);
            });
          } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }
      }
      if (isActiveRef.current) {
        waveOffsetRef.current = (waveOffsetRef.current + 0.4) % 15;
      } else {
        waveOffsetRef.current = 0;
      }
      
      const arcs = [arcRef0.current, arcRef1.current, arcRef2.current];
      
      for (let i = 0; i < 3; i++) {
        const arc = arcs[i];
        if (arc) {
          if (!isActiveRef.current) {
            arc.visible(false);
          } else {
            arc.visible(true);
            const r = 35 + waveOffsetRef.current + (i * 10);
            const opacity = Math.max(0, 1 - (r - 35) / 30);
            arc.data(`M ${20 - r * 0.5} ${-r * 0.866} A ${r} ${r} 0 0 1 ${20 + r * 0.5} ${-r * 0.866}`);
            arc.opacity(opacity);
          }
        }
      }

      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [component.id, isMuted]);

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

  // 7 small holes arranged in a circle
  const renderHoles = () => {
    const holes = [];
    const numHoles = 7;
    const radius = 10;
    for (let i = 0; i < numHoles; i++) {
      const angle = (i * 2 * Math.PI) / numHoles;
      holes.push(
        <Circle
          key={i}
          x={20 + radius * Math.cos(angle)}
          y={radius * Math.sin(angle)}
          radius={2.5}
          fill="#111"
        />
      );
    }
    // Add center hole
    holes.push(<Circle key="center" x={20} y={0} radius={2.5} fill="#111" />);
    return holes;
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
      <Path ref={arcRef0} stroke="#ef4444" strokeWidth={2} visible={false} listening={false} />
      <Path ref={arcRef1} stroke="#ef4444" strokeWidth={2} visible={false} listening={false} />
      <Path ref={arcRef2} stroke="#ef4444" strokeWidth={2} visible={false} listening={false} />

      <Group>
        {/* Physical pins extending from bottom */}
        {/* POSITIVE (left, slightly longer) */}
        <Rect x={9} y={20} width={2} height={20} fill="#9ca3af" />
        {/* NEGATIVE (right, slightly shorter) */}
        <Rect x={29} y={25} width={2} height={15} fill="#9ca3af" />

        {/* Outer circle */}
        <Circle x={20} y={0} radius={32} fill="#1a1a1a" stroke="#000" strokeWidth={1} />
        
        {/* Red plus mark on the left side of the outer ring */}
        <Rect x={-6} y={-1} width={6} height={2} fill="#ef4444" />
        <Rect x={-4} y={-3} width={2} height={6} fill="#ef4444" />

        {/* Inner circle */}
        <Circle x={20} y={0} radius={20} fill="#2a2a2a" />
        
        {/* Holes */}
        {renderHoles()}

        {/* Mute toggle button (speaker icon) */}
        <Group 
          x={38} y={-22} 
          onClick={(e) => {
            e.cancelBubble = true;
            setIsMuted(!isMuted);
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            setIsMuted(!isMuted);
          }}
        >
          <Circle radius={8} fill="#374151" />
          <Path 
            data={isMuted 
              ? "M -3 -2 L -1 -2 L 2 -4 L 2 4 L -1 2 L -3 2 Z M -4 -4 L 4 4" 
              : "M -3 -2 L -1 -2 L 2 -4 L 2 4 L -1 2 L -3 2 Z M 3 -1 Q 4 0 3 1"
            } 
            stroke="#d1d5db" 
            strokeWidth={1} 
            fill="none" 
          />
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
    JSON.stringify(prev.component.properties) === JSON.stringify(next.component.properties) &&
    JSON.stringify(prev.component.pins) === JSON.stringify(next.component.pins)
  );
});
