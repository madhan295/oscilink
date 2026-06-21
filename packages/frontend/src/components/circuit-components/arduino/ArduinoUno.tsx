import React, { useState, useRef } from 'react';
import { Group, Rect, Text, Circle, Label, Tag, Path, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface ArduinoUnoProps {
  component: CircuitComponent;
}

export const ArduinoUno: React.FC<ArduinoUnoProps> = ({ component }) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const outerGroupRef = useRef<Konva.Group>(null);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);


  const pinVoltages = useSimulationStore(state => state.pinVoltages);

  const handleDragStart = () => {
    useWorkspaceStore.getState().pushHistory();
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    useWorkspaceStore.getState().moveSelectedComponents(component.id, e.target.x(), e.target.y());
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    useWorkspaceStore.getState().selectComponent(component.id, e.evt.shiftKey);
  };

  const onPinMouseDown = (e: KonvaEventObject<MouseEvent>, pinId: string) => {
    e.cancelBubble = true;
    const pin = component.pins[pinId];
    if (pin && pin.type !== 'power' && pin.type !== 'ground' && pin.connectedWireIds.length >= 1) {
      // Prevent multiple connections on data pins, unless it's the target pin during draw
      const state = useWorkspaceStore.getState();
      if (!state.isDrawingWire) return;
    }
    handlePinMouseDown({ componentId: component.id, pinId });
  };

  const getPinVoltage = (pinId: string) => {
    return pinVoltages[`${component.id}-${pinId}`] || pinVoltages[`${component.id}:${pinId}`] || 0;
  };

  const sx = 200 / 780;
  const sy = 140 / 540;

  // ─── HOVER DETECTION STRATEGY ───────────────────────────────────────────────
  //
  // Problem: At high zoom levels (e.g. 500%) per-shape onMouseEnter/onMouseLeave
  // events on tiny ~5px hit rects become unreliable — the stage scale transforms
  // screen coordinates but Konva's hit canvas pointer sampling can miss sub-pixel
  // shapes when the cursor moves faster than the hit canvas sample rate.
  //
  // Solution: Use a SINGLE wide invisible overlay Rect covering each entire pin
  // row. onMouseMove on the overlay computes which pin the cursor is over by
  // transforming the stage pointer position into the component's local coordinate
  // space and doing a simple nearest-pin lookup. This works correctly at any zoom
  // level because we only need ONE large shape to be hit, then we do our own math.
  //
  // onMouseLeave on the outer Group clears the hover state — this fires reliably
  // because the outer Group is large.
  // ─────────────────────────────────────────────────────────────────────────────

  const pinList = Object.values(component.pins);

  /**
   * Given a Konva mouse event, transform the stage pointer into the outer
   * Group's local coordinate space and return which pin (if any) is under it.
   */
  const getPinAtPointer = (e: KonvaEventObject<MouseEvent>): string | null => {
    const stage = e.target.getStage();
    if (!stage || !outerGroupRef.current) return null;

    // Stage pointer position is in ABSOLUTE (stage) coordinates
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    // Transform absolute → local coordinates of the outer Group
    const transform = outerGroupRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const local = transform.point(pointer);

    // Find the pin whose center is closest to the local pointer,
    // within a tolerance that matches half the pin spacing.
    const SNAP_X = 3.0;   // half of ~5px inter-pin spacing
    const SNAP_Y = 5.0;   // half of hitH=10

    let closest: string | null = null;
    let closestDist = Infinity;

    for (const pin of pinList) {
      if (pin.id.startsWith('NC')) continue;
      const dx = Math.abs(local.x - pin.position.x);
      const dy = Math.abs(local.y - pin.position.y);
      if (dx <= SNAP_X && dy <= SNAP_Y) {
        const dist = dx + dy;
        if (dist < closestDist) {
          closestDist = dist;
          closest = pin.id;
        }
      }
    }
    return closest;
  };

  const handleOverlayMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const pinId = getPinAtPointer(e);
    if (pinId !== hoveredPin) {
      setHoveredPin(pinId);
      if (pinId) {
        document.body.style.cursor = 'crosshair';
        handlePinMouseEnter({ componentId: component.id, pinId });
      } else {
        document.body.style.cursor = 'default';
        handlePinMouseLeave();
      }
    }
  };

  const handleOverlayMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setHoveredPin(null);
    document.body.style.cursor = 'default';
    handlePinMouseLeave();
  };

  const handleOverlayMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const pinId = getPinAtPointer(e);
    if (pinId) onPinMouseDown(e, pinId);
  };

  const w = 4.6;
  const h = 4.6;

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
      onMouseLeave={() => {
        setHoveredPin(null);
        document.body.style.cursor = 'default';
        handlePinMouseLeave();
      }}
    >
      {/* Invisible Hitbox */}
      <Rect x={-4} y={-4} width={208} height={148} fill="transparent" />

      {/* ── PCB GRAPHICS (listening={false} on Group propagates to all children) ── */}
      <Group scaleX={sx} scaleY={sy} listening={false}>
        <Path
          data="M 12,0 L 715,0 L 765,50 L 765,490 L 745,510 L 745,540 L 160,540 Q 150,540 145,530 L 135,515 Q 125,505 110,505 L 12,505 Q 0,505 0,493 L 0,12 Q 0,0 12,0 Z"
          fill="#1d70b8"
          shadowColor="black" shadowBlur={24} shadowOpacity={0.4} shadowOffset={{ x: 0, y: 12 }}
        />
        <Line points={[50, 100, 120, 100, 150, 130, 150, 200]} stroke="#16568c" strokeWidth={4} lineCap="round" lineJoin="round" opacity={0.6} />
        <Line points={[280, 150, 320, 150, 350, 120, 400, 120]} stroke="#16568c" strokeWidth={4} lineCap="round" lineJoin="round" opacity={0.6} />
        <Line points={[450, 320, 520, 320, 580, 380, 580, 430]} stroke="#16568c" strokeWidth={5} lineCap="round" lineJoin="round" opacity={0.5} />
        <Line points={[200, 480, 250, 480, 280, 450, 320, 450]} stroke="#16568c" strokeWidth={4} lineCap="round" lineJoin="round" opacity={0.6} />
        <Line points={[680, 250, 710, 250, 730, 270, 730, 350]} stroke="#16568c" strokeWidth={4} lineCap="round" lineJoin="round" opacity={0.6} />
        <Line points={[150, 250, 220, 250, 240, 270, 240, 330]} stroke="#cca43b" strokeWidth={1.2} lineCap="round" lineJoin="round" opacity={0.4} />
        <Line points={[310, 180, 350, 180, 380, 210, 420, 210]} stroke="#cca43b" strokeWidth={1.2} lineCap="round" lineJoin="round" opacity={0.4} />
        <Line points={[460, 480, 510, 480, 530, 500]} stroke="#cca43b" strokeWidth={1.2} lineCap="round" lineJoin="round" opacity={0.4} />
        {[[210, 110], [210, 125], [210, 140], [225, 110], [225, 125], [225, 140], [240, 110], [240, 125], [240, 140]].map(([cx, cy], i) => (
          <Circle key={`via1-${i}`} x={cx} y={cy} radius={3} fill="#cca43b" stroke="#333" strokeWidth={0.5} opacity={0.8} />
        ))}
        {[[682, 300], [682, 315], [682, 330], [697, 300], [697, 315], [697, 330]].map(([cx, cy], i) => (
          <Circle key={`via2-${i}`} x={cx} y={cy} radius={3.5} fill="#a1a1a1" stroke="#333" strokeWidth={0.5} />
        ))}
        {[[48, 310], [180, 460], [280, 390], [340, 310], [600, 110], [700, 80]].map(([cx, cy], i) => (
          <Circle key={`via3-${i}`} x={cx} y={cy} radius={2.5} fill="#cca43b" opacity={0.6} />
        ))}
        <Rect x={310} y={105} width={266} height={2} fill="white" opacity={0.85} />
        <Text x={310} y={111} width={266} text="DIGITAL (PWM ~)" fill="white" fontSize={14} fontFamily="sans-serif" fontStyle="900" opacity={0.85} align="center" letterSpacing={1} />
        <Rect x={324} y={420} width={124} height={2} fill="white" opacity={0.85} />
        <Text x={324} y={402} width={124} text="POWER" fill="white" fontSize={14} fontFamily="sans-serif" fontStyle="900" opacity={0.85} align="right" letterSpacing={0.5} />
        <Rect x={460} y={420} width={116} height={2} fill="white" opacity={0.85} />
        <Text x={460} y={402} width={116} text="ANALOG IN" fill="white" fontSize={14.5} fontFamily="sans-serif" fontStyle="900" opacity={0.85} align="center" letterSpacing={0.5} />
        <Group x={400} y={146} scaleX={0.85} scaleY={0.85}>
          <Circle x={36} y={32} radius={25} stroke="white" strokeWidth={8} />
          <Rect x={24} y={28} width={24} height={8} fill="white" cornerRadius={1} />
          <Circle x={86} y={32} radius={25} stroke="white" strokeWidth={8} />
          <Rect x={74} y={28} width={24} height={8} fill="white" cornerRadius={1} />
          <Rect x={82} y={20} width={8} height={24} fill="white" cornerRadius={1} />
        </Group>
        <Text x={352} y={205} width={180} text="ARDUINO" fill="white" fontSize={22} fontFamily="sans-serif" fontStyle="900" letterSpacing={3} align="center" />
        <Rect x={522} y={146} width={138} height={56} stroke="white" strokeWidth={2.5} dash={[6, 4]} cornerRadius={12} opacity={0.95} />
        <Text x={522} y={160} width={138} text="UNO" fill="white" fontSize={32} fontFamily="sans-serif" fontStyle="900" letterSpacing={2} align="center" />
        <Text x={284} y={141} text="L" fill="white" fontSize={14} fontFamily="sans-serif" fontStyle="900" opacity={0.85} />
        <Text x={266} y={198} width={25} text="TX" fill="white" fontSize={14} fontFamily="sans-serif" fontStyle="900" opacity={0.85} align="right" />
        <Text x={266} y={218} width={25} text="RX" fill="white" fontSize={14} fontFamily="sans-serif" fontStyle="900" opacity={0.85} align="right" />
        <Text x={704} y={143} text="ON" fill="white" fontSize={13} fontFamily="sans-serif" fontStyle="900" opacity={0.85} />
        {[[188, 22, 24], [132, 483, 32], [685, 192, 32], [685, 442, 32]].map(([cx, cy, d], i) => (
          <Group key={`hole-${i}`} x={cx + d / 2} y={cy + d / 2}>
            <Circle radius={d / 2} fill="#e5e7eb" stroke="#a1a1a1" strokeWidth={4} />
          </Group>
        ))}
        <Group x={-14} y={152}>
          <Rect width={172} height={148} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} cornerRadius={8} shadowColor="black" shadowBlur={15} shadowOpacity={0.5} shadowOffset={{ x: 5, y: 5 }} />
          <Rect x={10} y={10} width={152} height={128} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={2} cornerRadius={4} />
        </Group>
        <Group x={-14} y={418}>
          <Rect width={128} height={72} fill="#171717" stroke="#404040" strokeWidth={1} cornerRadius={8} shadowColor="black" shadowBlur={20} shadowOpacity={0.6} shadowOffset={{ x: 5, y: 10 }} />
          <Rect x={0} y={12} width={25} height={46} fill="black" cornerRadius={4} />
          <Circle x={12.5} y={35} radius={5} fill="#d97706" />
        </Group>
        <Group x={38} y={48}>
          <Rect x={-4} y={8} width={8} height={15} fill="#9ca3af" />
          <Rect x={-4} y={49} width={8} height={15} fill="#9ca3af" />
          <Rect x={84} y={8} width={8} height={15} fill="#9ca3af" />
          <Rect x={84} y={49} width={8} height={15} fill="#9ca3af" />
          <Rect x={11} y={3} width={66} height={66} fill="#d1d5db" stroke="#6b7280" strokeWidth={2} cornerRadius={8} shadowColor="black" shadowBlur={10} shadowOpacity={0.3} />
          <Circle x={44} y={36} radius={22} fill="#d1d5db" stroke="#9ca3af" strokeWidth={2} />
          <Circle x={44} y={36} radius={14} fill="#ef4444" stroke="#991b1b" strokeWidth={1} />
        </Group>
        <Group x={44} y={322}>
          <Rect x={0} y={0} width={35} height={65} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} cornerRadius={17.5} shadowColor="black" shadowBlur={4} shadowOpacity={0.3} />
          <Rect x={3.5} y={5} width={28} height={55} stroke="#d1d5db" strokeWidth={2} cornerRadius={14} />
          <Group x={17.5} y={32.5} rotation={90}>
            <Text x={-20} y={-5} text="16.000" fontSize={10} fontFamily="monospace" fontStyle="bold" fill="#374151" />
          </Group>
        </Group>
        <Group x={334} y={270}>
          <Rect width={358} height={82} fill="#171717" stroke="#404040" strokeWidth={2} cornerRadius={6} shadowColor="black" shadowBlur={24} shadowOpacity={0.6} shadowOffset={{ x: 2, y: 12 }} />
          <Path data="M 0,27 A 14,14 0 0,0 0,55 Z" fill="#1d70b8" stroke="#404040" strokeWidth={2} />
          <Circle x={16} y={74} radius={5.5} fill="#171717" stroke="#404040" strokeWidth={1} />
          {Array.from({ length: 14 }).map((_, i) => (
            <Rect key={`legT-${i}`} x={12 + i * 24} y={-14} width={6} height={16} fill="#9ca3af" stroke="#4b5563" strokeWidth={0.5} cornerRadius={2} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <Rect key={`legB-${i}`} x={12 + i * 24} y={80} width={6} height={16} fill="#9ca3af" stroke="#4b5563" strokeWidth={0.5} cornerRadius={2} />
          ))}
          <Circle x={43} y={41} radius={9} fill="#0a0a0a" stroke="#171717" />
          <Circle x={315} y={41} radius={9} fill="#0a0a0a" stroke="#171717" />
        </Group>
        <Rect x={225} y={26} width={190} height={28} fill="#1f2937" stroke="#404040" strokeWidth={1} cornerRadius={4} />
        <Rect x={424} y={26} width={152} height={28} fill="#1f2937" stroke="#404040" strokeWidth={1} cornerRadius={4} />
        <Rect x={296} y={486} width={152} height={28} fill="#1f2937" stroke="#404040" strokeWidth={1} cornerRadius={4} />
        <Rect x={460} y={486} width={116} height={28} fill="#1f2937" stroke="#404040" strokeWidth={1} cornerRadius={4} />
        <Group x={331} y={141}>
          <Rect width={18} height={14} fill="#262626" stroke="#737373" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={2.5} y={2.5} width={13} height={9} cornerRadius={2}
            fill={getPinVoltage('D13') > 2.5 ? '#fbbf24' : '#171717'}
            shadowColor={getPinVoltage('D13') > 2.5 ? '#fbbf24' : 'transparent'}
            shadowBlur={getPinVoltage('D13') > 2.5 ? 16 : 0}
          />
        </Group>
        <Group x={331} y={200}>
          <Rect width={18} height={14} fill="#262626" stroke="#737373" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={2.5} y={2.5} width={13} height={9} cornerRadius={2}
            fill={getPinVoltage('TX') > 1 ? '#facc15' : '#171717'}
            shadowColor={getPinVoltage('TX') > 1 ? '#facc15' : 'transparent'}
            shadowBlur={getPinVoltage('TX') > 1 ? 14 : 0}
          />
        </Group>
        <Group x={331} y={214}>
          <Rect width={18} height={14} fill="#262626" stroke="#737373" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={2.5} y={2.5} width={13} height={9} cornerRadius={2}
            fill={getPinVoltage('RX') > 1 ? '#facc15' : '#171717'}
            shadowColor={getPinVoltage('RX') > 1 ? '#facc15' : 'transparent'}
            shadowBlur={getPinVoltage('RX') > 1 ? 14 : 0}
          />
        </Group>
        <Group x={681} y={141}>
          <Rect width={18} height={14} fill="#262626" stroke="#737373" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={2.5} y={2.5} width={13} height={9} cornerRadius={2}
            fill="#22c55e" shadowColor="#22c55e" shadowBlur={16}
          />
        </Group>
      </Group>

      {/* ── PIN VISUALS (listening={false}) ─────────────────────────────────────
       *  These are purely decorative — they show the pin dot, glow, label, and
       *  tooltip. No hit testing here at all; all hover state comes from the
       *  overlay rects below via pointer-position math.
       */}
      {pinList.map(pin => {
        const isHovered = hoveredPin === pin.id;
        const voltage = getPinVoltage(pin.id);
        const isHigh = voltage > 2.5;

        let fillCol = '#171717';
        let glowCol = 'transparent';
        if (isHigh && (pin.type === 'digital' || pin.type === 'PWM' || pin.type === 'power')) {
          fillCol = '#22d3ee';
          glowCol = '#22d3ee';
        }

        const isNC = pin.id.startsWith('NC');
        const isTop = pin.position.y < 70;

        return (
          <Group
            key={pin.id}
            x={pin.position.x - w / 2}
            y={pin.position.y - h / 2}
            listening={false}
          >
            {/* Visible pin body */}
            <Rect
              x={isHovered ? -0.8 : 0}
              y={isHovered ? -0.8 : 0}
              width={isHovered ? w + 1.6 : w}
              height={isHovered ? h + 1.6 : h}
              fill="#1a1a1a"
              stroke={isHovered ? '#fbbf24' : '#404040'}
              strokeWidth={isHovered ? 1 : 0.5}
              cornerRadius={0.5}
              shadowColor={isHovered ? '#fbbf24' : 'transparent'}
              shadowBlur={isHovered ? 5 : 0}
            />
            {/* Inner metal core */}
            <Circle
              x={w / 2} y={h / 2}
              radius={isHovered ? 1.6 : 1}
              fill={fillCol}
              shadowColor={glowCol}
              shadowBlur={glowCol !== 'transparent' ? 3 : 0}
            />
            {/* Label */}
            {!isNC && pin.id !== 'SCL' && pin.id !== 'SDA' && (
              <Text
                text={pin.label}
                x={w / 2}
                y={isTop ? h + 3.5 : -3.5}
                fontSize={3} fontFamily="sans-serif" fontStyle="bold"
                fill="#ffffff" opacity={0.85}
                rotation={isTop ? 90 : -90}
                offsetX={0} offsetY={1.5}
              />
            )}
            {/* Tooltip */}
            {isHovered && !isNC && (
              <Label
                x={w / 2 + 5}
                y={isTop ? h + 2 : -20}
                opacity={1}
              >
                <Tag
                  fill="#1f2937" stroke="#4b5563" strokeWidth={0.5}
                  cornerRadius={2}
                  pointerDirection={isTop ? 'up' : 'down'}
                  pointerWidth={4} pointerHeight={4}
                />
                <Text
                  text={`${pin.label} (${pin.type})`}
                  fill="#ffffff" fontSize={8} padding={3}
                />
              </Label>
            )}
          </Group>
        );
      })}

      {/* ── HIT OVERLAY RECTS ────────────────────────────────────────────────────
       *
       *  Two large invisible rects cover the entire top and bottom pin rows.
       *  onMouseMove fires once per frame at any zoom level (no tiny sub-pixel
       *  shapes to miss). We invert the Group's absolute transform to convert
       *  the stage pointer into local coordinates, then snap to the nearest pin.
       *
       *  These are rendered LAST so they sit on top of everything else in z-order
       *  and reliably receive all pointer events.
       */}

      {/* Top DIGITAL (Group A+B) overlay — spans AREF(x≈60) to RX(x≈145), y≈[5,16] */}
      <Rect
        x={57} y={5.37}
        width={92} height={10}
        fill="rgba(0,0,0,0.001)"
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        onMouseDown={handleOverlayMouseDown}
      />

      {/* Bottom POWER block overlay — spans IOREF(x=78.20) to Vin(x=112.56), y≈[125,135] */}
      <Rect
        x={75.20} y={124.63}
        width={40.36} height={10}
        fill="rgba(0,0,0,0.001)"
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        onMouseDown={handleOverlayMouseDown}
      />

      {/* Bottom ANALOG IN block overlay — spans A0(x≈120) to A5(x≈145), y≈[125,135] */}
      <Rect
        x={117.26} y={124.63}
        width={31.13} height={10}
        fill="rgba(0,0,0,0.001)"
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        onMouseDown={handleOverlayMouseDown}
      />
    </Group>
  );
};


