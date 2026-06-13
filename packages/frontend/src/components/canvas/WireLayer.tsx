import React, { useRef, useEffect } from 'react';
import { Group, Shape, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface WireLayerProps {
  previewWirePoints: number[] | null;
}

export const WireLayer: React.FC<WireLayerProps> = ({ previewWirePoints }) => {
  const wires = useWorkspaceStore(state => state.wires);
  const selectedWireIds = useWorkspaceStore(state => state.selectedWireIds);
  const selectWire = useWorkspaceStore(state => state.selectWire);
  const removeWire = useWorkspaceStore(state => state.removeWire);
  const isDrawingWire = useWorkspaceStore(state => state.isDrawingWire);

  const [hoveredWireId, setHoveredWireId] = React.useState<string | null>(null);
  
  const dashOffsetRef = useRef(0);
  const animationRef = useRef<Konva.Animation | null>(null);
  const layerRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const hasErrorWires = wires.some(w => w.isError);
    const hasPreview = !!previewWirePoints;
    
    if (hasErrorWires || hasPreview) {
      animationRef.current = new Konva.Animation((frame) => {
        if (frame) {
          dashOffsetRef.current = -(frame.time / 20) % 20;
          if (layerRef.current) {
            layerRef.current.getLayer()?.batchDraw();
          }
        }
      }, layerRef.current?.getLayer());
      
      animationRef.current.start();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [wires, previewWirePoints]);

  const colorMap: Record<string, string> = {
    red: '#ef4444',
    black: '#171717',
    blue: '#3b82f6',
    yellow: '#eab308',
    green: '#22c55e',
    orange: '#f97316',
    white: '#f8fafc',
    error: '#dc2626'
  };

  const normalWires = wires.filter(w => !selectedWireIds.includes(w.id) && !w.isError);

  const drawNormalWires = (context: Konva.Context) => {
    const colorGroups: Record<string, typeof normalWires> = {};
    normalWires.forEach(w => {
      const c = w.color || 'blue';
      if (!colorGroups[c]) colorGroups[c] = [];
      colorGroups[c].push(w);
    });

    for (const [color, colorWires] of Object.entries(colorGroups)) {
      context.beginPath();
      context.strokeStyle = colorMap[color] || colorMap.blue;
      context.lineWidth = 1.5;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      
      colorWires.forEach(w => {
        const pts = w.points;
        if (pts && pts.length >= 2) {
          context.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) {
            context.lineTo(pts[i], pts[i + 1]);
          }
        }
      });
      context.stroke();
    }
  };

  const renderWireInteractiveLayer = (wire: any, isSelected: boolean, isError: boolean) => {
    const pts = wire.points;
    let midX = 0, midY = 0;
    if (pts.length >= 6) {
       midX = (pts[2] + pts[4]) / 2;
       midY = (pts[3] + pts[5]) / 2;
    } else if (pts.length >= 4) {
       midX = (pts[0] + pts[2]) / 2;
       midY = (pts[1] + pts[3]) / 2;
    }

    return (
      <Group key={`interactive-${wire.id}`}>
        {isSelected && (
          <Line
            points={wire.points}
            stroke="white"
            strokeWidth={5}
            opacity={0.8}
            lineJoin="round"
            lineCap="round"
            listening={false}
          />
        )}
        
        {isError && (
          <Line
            points={wire.points}
            stroke={colorMap.error}
            strokeWidth={3}
            lineJoin="round"
            lineCap="round"
            dash={[10, 5]}
            sceneFunc={(ctx, shape) => {
              shape.dashOffset(dashOffsetRef.current);
              (shape as any)._sceneFunc(ctx);
            }}
            listening={false}
          />
        )}
        
        {isSelected && !isError && (
          <Line
            points={wire.points}
            stroke={colorMap[wire.color || 'blue']}
            strokeWidth={1.5}
            lineJoin="round"
            lineCap="round"
            listening={false}
          />
        )}

        <Line
          points={wire.points}
          stroke="transparent"
          strokeWidth={3}
          lineJoin="round"
          lineCap="round"
          listening={!isDrawingWire}
          onMouseEnter={() => {
            setHoveredWireId(wire.id);
            document.body.style.cursor = 'pointer';
          }}
          onMouseLeave={() => {
            setHoveredWireId(null);
            document.body.style.cursor = 'default';
          }}
          onClick={(e) => {
            e.cancelBubble = true;
            selectWire(wire.id, e.evt.shiftKey);
          }}
        />
        
        {hoveredWireId === wire.id && (
          <>
            {!isSelected && !isError && (
              <Line
                points={wire.points}
                stroke={colorMap[wire.color || 'blue']}
                strokeWidth={3}
                opacity={0.5}
                listening={false}
              />
            )}
            <Group
              x={midX} y={midY}
              onMouseEnter={() => {
                document.body.style.cursor = 'pointer';
              }}
              onMouseLeave={() => {
                document.body.style.cursor = 'default';
              }}
              onClick={(e) => {
                e.cancelBubble = true;
                removeWire(wire.id);
              }}
            >
              <Circle radius={8} fill="#ef4444" shadowColor="black" shadowBlur={4} shadowOpacity={0.3} />
              <Line points={[-3, -3, 3, 3]} stroke="white" strokeWidth={2} />
              <Line points={[-3, 3, 3, -3]} stroke="white" strokeWidth={2} />
            </Group>
          </>
        )}
      </Group>
    );
  };

  return (
    <Group ref={layerRef} name="wire-layer">
      {/* Batched normal wires rendering */}
      {normalWires.length > 0 && (
        <Shape
          sceneFunc={drawNormalWires}
          listening={false}
        />
      )}

      {/* Interactive layer for all wires */}
      {wires.map(wire => renderWireInteractiveLayer(
        wire, 
        selectedWireIds.includes(wire.id),
        wire.isError || false
      ))}

      {/* Preview wire */}
      {previewWirePoints && (
        <Line
          points={previewWirePoints}
          stroke="#06b6d4"
          strokeWidth={1.5}
          dash={[10, 10]}
          lineJoin="round"
          sceneFunc={(ctx, shape) => {
            shape.dashOffset(dashOffsetRef.current);
            (shape as any)._sceneFunc(ctx);
          }}
          listening={false}
        />
      )}
    </Group>
  );
};
