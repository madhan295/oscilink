import React, { useEffect, useRef } from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';

interface FlashAnimationProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export const PinFlashAnimation: React.FC<FlashAnimationProps> = ({ x, y, onComplete }) => {
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.scale({ x: 0.1, y: 0.1 });
      circleRef.current.opacity(1);

      const tween = new Konva.Tween({
        node: circleRef.current,
        duration: 0.3,
        scaleX: 2.5,
        scaleY: 2.5,
        opacity: 0,
        easing: Konva.Easings.EaseOut,
        onFinish: () => {
          if (onComplete) onComplete();
        }
      });
      tween.play();

      return () => {
        tween.destroy();
      };
    }
  }, []);

  return (
    <Circle
      ref={circleRef}
      x={x}
      y={y}
      radius={6}
      fill="#06b6d4" // Cyan-500
      listening={false}
    />
  );
};
