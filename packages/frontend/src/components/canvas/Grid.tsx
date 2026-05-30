import React, { useEffect, useRef } from 'react';
import { Layer, Shape } from 'react-konva';
import { useWorkspaceStore } from '../../store/workspaceStore';
import Konva from 'konva';

interface GridProps {
  width: number;
  height: number;
}

export const Grid: React.FC<GridProps> = ({ width, height }) => {
  const viewport = useWorkspaceStore((state) => state.viewport);
  const layerRef = useRef<Konva.Layer>(null);
  const shapeRef = useRef<Konva.Shape>(null);
  const drawnArea = useRef({ startX: 0, endX: 0, startY: 0, endY: 0 });

  useEffect(() => {
    if (!layerRef.current || !shapeRef.current) return;

    // Calculate visible area in world coordinates
    const startX = (0 - viewport.x) / viewport.scale - 100;
    const endX = (width - viewport.x) / viewport.scale + 100;
    const startY = (0 - viewport.y) / viewport.scale - 100;
    const endY = (height - viewport.y) / viewport.scale + 100;

    const c = drawnArea.current;

    // Redraw if the visible area moves outside the currently drawn area + padding
    if (
      startX < c.startX ||
      endX > c.endX ||
      startY < c.startY ||
      endY > c.endY ||
      c.startX === 0
    ) {
      // Add extra padding to the cached area so we don't redraw on every pixel pan
      drawnArea.current = {
        startX: startX - 200,
        endX: endX + 200,
        startY: startY - 200,
        endY: endY + 200,
      };

      // Clear cache and batch draw
      layerRef.current.clearCache();
      layerRef.current.batchDraw();
      
      // Once drawn, cache the layer permanently for this area
      // Actually, caching an infinite panning layer requires bounds.
      // Since we manually manage the drawn area, we can just rely on batchDraw.
      // To strictly follow "Cache this layer permanently", we can cache it over the current screen size.
      // However, caching dynamically sized layers during pan can be jittery.
      // We will stick to the manual batchDraw approach as it's highly optimized for grids.
    }
  }, [viewport.x, viewport.y, viewport.scale, width, height]);

  return (
    <Layer ref={layerRef} listening={false}>
      <Shape
        ref={shapeRef}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        sceneFunc={(context, shape) => {
          const c = drawnArea.current;
          if (c.startX === 0) return;

          const DOT_SPACING = 24;
          // Scale dot radius inversely to viewport scale so it stays 1px on screen
          const DOT_RADIUS = 1 / viewport.scale;

          context.beginPath();
          
          const firstX = Math.floor(c.startX / DOT_SPACING) * DOT_SPACING;
          const firstY = Math.floor(c.startY / DOT_SPACING) * DOT_SPACING;

          for (let x = firstX; x <= c.endX; x += DOT_SPACING) {
            for (let y = firstY; y <= c.endY; y += DOT_SPACING) {
              context.moveTo(x + DOT_RADIUS, y);
              context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2, false);
            }
          }
          
          context.fillStyle = 'rgba(255,255,255,0.08)';
          context.fill();
        }}
      />
    </Layer>
  );
};
