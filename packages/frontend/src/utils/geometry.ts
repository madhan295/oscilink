import { CircuitComponent, Pin } from '../types/components';

export function getAbsolutePinPosition(comp: CircuitComponent, pin: Pin) {
  const rotation = comp.rotation || 0;
  const flipX = comp.properties?.flipX ? -1 : 1;
  const flipY = comp.properties?.flipY ? -1 : 1;
  const rad = (Math.PI / 180) * rotation;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  // Apply flip scale first
  const px = pin.position.x * flipX;
  const py = pin.position.y * flipY;
  
  // Then rotate
  const rx = px * cos - py * sin;
  const ry = px * sin + py * cos;
  
  // Then translate
  return {
    x: comp.position.x + rx,
    y: comp.position.y + ry
  };
}
