import { useEffect, useRef } from 'react';
import Konva from 'konva';

export function useComponentDropAnimation(
  component: { isNew?: boolean },
  groupRef: React.RefObject<any>
) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (component.isNew && groupRef.current && !hasRun.current) {
      hasRun.current = true;
      // Set initial scale to 0.7
      groupRef.current.scale({ x: 0.7, y: 0.7 });
      
      // Animate with Konva Tween
      const tween = new Konva.Tween({
        node: groupRef.current,
        duration: 0.25,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.ElasticEaseOut,
      });
      
      tween.play();

      return () => {
        tween.destroy();
      };
    }
  }, [component.isNew, groupRef]);
}
