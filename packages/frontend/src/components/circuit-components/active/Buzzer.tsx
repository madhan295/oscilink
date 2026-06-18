import React, { useState, useRef, useEffect } from 'react';
import { useComponentDropAnimation } from '../../../hooks/useComponentDropAnimation';
import { Group, Rect, Circle, Text, Path } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface BuzzerProps {
  component: CircuitComponent;
}

export const Buzzer: React.FC<BuzzerProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [waveOffset, setWaveOffset] = useState(0);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const compState = useSimulationStore((state) => state.componentStates[component.id]) as any;
  const isActive = compState?.isActive ?? false;
  const frequency = compState?.frequency ?? 1000;

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      if (isActive) {
        setWaveOffset((prev) => (prev + 0.4) % 15);
      } else {
        setWaveOffset(0);
      }
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [isActive]);

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
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive && !isMuted) {
      audio.play().catch((err) => {
        console.warn('Audio play failed (maybe require user interaction):', err);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isActive, isMuted]);

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

  // Sound waves
  const renderSoundWaves = () => {
    if (!isActive) return null;
    const arcs = [];
    for (let i = 0; i < 3; i++) {
      const r = 35 + waveOffset + (i * 10);
      const opacity = Math.max(0, 1 - (r - 35) / 30);
      arcs.push(
        <Path
          key={i}
          data={`M ${20 - r * 0.5} ${-r * 0.866} A ${r} ${r} 0 0 1 ${20 + r * 0.5} ${-r * 0.866}`}
          stroke="#ef4444"
          strokeWidth={2}
          opacity={opacity}
        />
      );
    }
    return arcs;
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
      {renderSoundWaves()}

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
};



