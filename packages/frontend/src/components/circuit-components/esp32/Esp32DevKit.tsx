import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Group, Rect, Text, Circle, Label, Tag, Path, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { CircuitComponent } from '../../../types/components';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useSimulationStore } from '../../../store/simulationStore';
import { CanvasContext } from '../../canvas/Canvas';

interface Esp32DevKitProps {
  component: CircuitComponent;
}

export const Esp32DevKit = memo(({ component }: Esp32DevKitProps) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const outerGroupRef = useRef<Konva.Group>(null);
  const pcbGroupRef = useRef<Konva.Group>(null);

  const pinRefs = useRef<Record<string, Konva.Circle>>({});
  const pwrLedRef = useRef<Konva.Rect>(null);
  const d2LedRef = useRef<Konva.Rect>(null);

  const { handlePinMouseDown, handlePinMouseEnter, handlePinMouseLeave } = React.useContext(CanvasContext);

  const pinList = Object.values(component.pins);

  // Cache static PCB graphics
  useEffect(() => {
    if (pcbGroupRef.current) {
      pcbGroupRef.current.cache({ pixelRatio: 2 });
    }
    return () => {
      if (pcbGroupRef.current) pcbGroupRef.current.clearCache();
    };
  }, []);

  // Subscribe to pin voltages to update pin contact glows & onboard D2 LED
  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.pinVoltages,
      (voltages: any) => {
        const getV = (pid: string) => voltages[`${component.id}-${pid}`] || voltages[`${component.id}:${pid}`] || 0;

        for (const pin of pinList) {
          const circle = pinRefs.current[pin.id];
          if (circle) {
            const v = getV(pin.id) > 1.5;
            let fillCol = '#09090b';
            let glowCol = 'transparent';
            if (v && (pin.type === 'digital' || pin.type === 'PWM' || pin.type === 'power')) {
              fillCol = '#22d3ee';
              glowCol = '#22d3ee';
            }
            circle.fill(fillCol);
            circle.shadowColor(glowCol);
            circle.shadowBlur(glowCol !== 'transparent' ? 3 : 0);
          }
        }

        const isD2On = getV('D2') > 1.5;
        if (d2LedRef.current) {
          d2LedRef.current.fill(isD2On ? '#3b82f6' : '#1e293b');
          d2LedRef.current.shadowColor(isD2On ? '#3b82f6' : 'transparent');
          d2LedRef.current.shadowBlur(isD2On ? 8 : 0);
        }
      }
    );
    return unsubscribe;
  }, [component.id, pinList]);

  // Subscribe to simulation status for onboard PWR LED
  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.status,
      (status) => {
        const isRunning = status === 'RUNNING';
        if (pwrLedRef.current) {
          pwrLedRef.current.fill(isRunning ? '#ef4444' : '#450a0a');
          pwrLedRef.current.shadowColor(isRunning ? '#ef4444' : 'transparent');
          pwrLedRef.current.shadowBlur(isRunning ? 8 : 0);
        }
        if (!isRunning && d2LedRef.current) {
          d2LedRef.current.fill('#1e293b');
          d2LedRef.current.shadowBlur(0);
        }
      }
    );
    return unsubscribe;
  }, []);

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
    const pin = component.pins[pinId];
    if (pin && pin.type !== 'power' && pin.type !== 'ground' && pin.connectedWireIds.length >= 1) {
      const state = useWorkspaceStore.getState();
      if (!state.isDrawingWire) return;
    }
    handlePinMouseDown({ componentId: component.id, pinId });
  }, [component.id, component.pins, handlePinMouseDown]);

  // Scale factors: 405x742 viewBox -> 148x270 px on canvas
  const sx = 148 / 405;
  const sy = 270 / 742;

  const getPinAtPointer = (e: KonvaEventObject<MouseEvent>): string | null => {
    const stage = e.target.getStage();
    if (!stage || !outerGroupRef.current) return null;

    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    const transform = outerGroupRef.current.getAbsoluteTransform().copy();
    transform.invert();
    const local = transform.point(pointer);

    const SNAP_RADIUS = 6.0;

    let closest: string | null = null;
    let closestDist = Infinity;

    for (const pin of pinList) {
      const dx = local.x - pin.position.x;
      const dy = local.y - pin.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= SNAP_RADIUS && dist < closestDist) {
        closestDist = dist;
        closest = pin.id;
      }
    }
    return closest;
  };

  const handleOverlayMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
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
  }, [hoveredPin, component.id, handlePinMouseEnter, handlePinMouseLeave]);

  const handleOverlayMouseLeave = useCallback(() => {
    setHoveredPin(null);
    document.body.style.cursor = 'default';
    handlePinMouseLeave();
  }, [handlePinMouseLeave]);

  const handleOverlayMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const pinId = getPinAtPointer(e);
    if (pinId) onPinMouseDown(e, pinId);
  }, [onPinMouseDown]);

  // Handle tactile switch clicks
  const handleBootClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    useSimulationStore.getState().setPinVoltage(`${component.id}-CLK`, 0.0);
    setTimeout(() => {
      useSimulationStore.getState().setPinVoltage(`${component.id}-CLK`, 3.3);
    }, 200);
  }, [component.id]);

  const handleEnClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    useSimulationStore.getState().setPinVoltage(`${component.id}-EN`, 0.0);
    setTimeout(() => {
      useSimulationStore.getState().setPinVoltage(`${component.id}-EN`, 3.3);
    }, 200);
  }, [component.id]);

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
      onMouseLeave={() => {
        setHoveredPin(null);
        document.body.style.cursor = 'default';
        handlePinMouseLeave();
      }}
    >
      {/* Bounding box for selection & hit area */}
      <Rect x={-4} y={-4} width={156} height={280} fill="transparent" />

      {/* ── STATIC PCB GRAPHICS (CACHED) ── */}
      <Group ref={pcbGroupRef} scaleX={sx} scaleY={sy} listening={false}>
        {/* PCB Glossy Deep-Black Body */}
        <Rect
          x={0}
          y={0}
          width={405}
          height={742}
          cornerRadius={16}
          fill="#07080a"
          shadowColor="#000000"
          shadowBlur={20}
          shadowOpacity={0.65}
          shadowOffset={{ x: 0, y: 10 }}
        />

        {/* Outer White Silkscreen Boundary Border */}
        <Rect
          x={8}
          y={8}
          width={389}
          height={726}
          cornerRadius={14}
          stroke="#ffffff"
          strokeWidth={1.5}
          opacity={0.9}
        />

        {/* 4 Corner Mounting Holes (with metallic solder pads) */}
        {[
          [32, 32],
          [373, 32],
          [32, 710],
          [373, 710]
        ].map(([cx, cy], i) => (
          <Group key={`hole-${i}`} x={cx} y={cy}>
            <Circle radius={16} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} />
            <Circle radius={13} stroke="#ffffff" strokeWidth={1.5} opacity={0.7} />
            <Circle radius={10} fill="#d1d5db" stroke="#64748b" strokeWidth={0.5} />
          </Group>
        ))}

        {/* ── TOP ANTENNA (INVERTED-F MEANDERED TRACE) ── */}
        <Group>
          {/* Gold Inverted-F Meander Trace */}
          <Path
            data="M 75,90 L 75,22 L 265,22 L 105,22 L 105,72 L 125,72 L 125,22 L 145,22 L 145,72 L 165,72 L 165,22 L 185,22 L 185,72 L 205,72 L 205,22 L 225,22 L 225,72 L 245,72 L 245,22 L 265,22 L 265,90"
            stroke="#cca43b"
            strokeWidth={4.8}
            lineCap="round"
            lineJoin="round"
          />
          {/* Ground Feed Stub */}
          <Line points={[105, 90, 105, 72]} stroke="#cca43b" strokeWidth={4.8} lineCap="round" />
          <Circle x={105} y={90} radius={3} fill="#cca43b" />

          {/* White Silkscreen Letter 'K' in Center */}
          <Text
            text="K"
            x={192}
            y={80}
            fontSize={13}
            fontFamily="sans-serif"
            fontStyle="bold"
            fill="#ffffff"
          />

          {/* Two Gold Vias next to 'K' */}
          <Circle x={245} y={90} radius={4} fill="#cca43b" stroke="#785918" strokeWidth={0.5} />
          <Circle x={245} y={90} radius={1.8} fill="#09090b" />
          <Circle x={265} y={90} radius={4} fill="#cca43b" stroke="#785918" strokeWidth={0.5} />
          <Circle x={265} y={90} radius={1.8} fill="#09090b" />
        </Group>

        {/* ── ESP-WROOM-32 METAL SHIELDING CAN (68, 104) ── */}
        <Group x={68} y={104}>
          {/* Outer metal shield frame with champagne/nickel brushed color */}
          <Rect
            width={269}
            height={295}
            fill="#c2bcaf"
            stroke="#a8a090"
            strokeWidth={2}
            cornerRadius={8}
            shadowColor="#000000"
            shadowBlur={16}
            shadowOpacity={0.4}
            shadowOffset={{ x: 1, y: 4 }}
          />
          {/* Inner highlight bevel */}
          <Rect
            x={4}
            y={4}
            width={261}
            height={287}
            cornerRadius={6}
            fill="#cfc9be"
            stroke="#f5f0e6"
            strokeWidth={1.5}
          />

          {/* Gold Castellated Solder Pads Around Bottom Edge (8 pads) */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Group key={`cast-b-${i}`} x={14 + i * 31} y={290}>
              <Rect width={16} height={12} fill="#cca43b" stroke="#785918" strokeWidth={0.5} cornerRadius={1} />
              <Rect x={3} y={2} width={10} height={8} fill="#e2e8f0" cornerRadius={1} />
            </Group>
          ))}

          {/* Gold Castellated Solder Pads on Left & Right Sides */}
          {Array.from({ length: 6 }).map((_, i) => (
            <React.Fragment key={`cast-lr-${i}`}>
              <Rect x={-6} y={24 + i * 42} width={8} height={14} fill="#cca43b" stroke="#785918" strokeWidth={0.5} cornerRadius={1} />
              <Rect x={267} y={24 + i * 42} width={8} height={14} fill="#cca43b" stroke="#785918" strokeWidth={0.5} cornerRadius={1} />
            </React.Fragment>
          ))}

          {/* Laser-Etched Header: [ Wi Fi ] Logo Badge and "ESP-32" */}
          <Group x={16} y={24}>
            {/* Wi Fi Badge */}
            <Rect width={72} height={36} fill="#ffffff" stroke="#334155" strokeWidth={2} cornerRadius={6} />
            <Text
              text="Wi Fi"
              x={0}
              y={7}
              width={72}
              align="center"
              fontSize={18}
              fontFamily="sans-serif"
              fontStyle="900"
              fill="#1e293b"
            />
            {/* Large ESP-32 text */}
            <Text
              text="ESP-32"
              x={88}
              y={2}
              fontSize={34}
              fontFamily="sans-serif"
              fontStyle="900"
              fill="#2c2a26"
            />
          </Group>

          {/* Second Row: Espressif Spiral, Bluetooth Oval, FC, CE Logos */}
          <Group x={18} y={78}>
            {/* Espressif stylized logo icon */}
            <Group x={24} y={18}>
              <Circle radius={18} fill="#2c2a26" />
              <Circle radius={12} fill="#cfc9be" />
              <Circle radius={6} fill="#2c2a26" />
              <Rect x={-4} y={-4} width={8} height={8} fill="#cfc9be" />
            </Group>

            {/* Bluetooth Logo inside Oval Badge */}
            <Group x={84} y={18}>
              <Circle radius={16} fill="#2c2a26" />
              <Text text="ᛒ" x={-10} y={-14} fontSize={22} fontStyle="bold" fill="#cfc9be" />
            </Group>

            {/* FC and CE regulatory logos */}
            <Text
              text="FC  CE"
              x={130}
              y={2}
              fontSize={28}
              fontFamily="sans-serif"
              fontStyle="900"
              fill="#2c2a26"
              letterSpacing={4}
            />
          </Group>

          {/* Third Row: "WiFi+BT SoC Inside" */}
          <Text
            text="WiFi+BT SoC Inside"
            x={0}
            y={136}
            width={269}
            align="center"
            fontSize={18}
            fontFamily="sans-serif"
            fontStyle="900"
            fill="#2c2a26"
            letterSpacing={0.5}
          />

          {/* Fourth Row: "ISM2.4G 802.11/b/g/n" */}
          <Text
            text="ISM2.4G 802.11/b/g/n"
            x={0}
            y={168}
            width={269}
            align="center"
            fontSize={16}
            fontFamily="sans-serif"
            fontStyle="900"
            fill="#2c2a26"
            letterSpacing={0.5}
          />

          {/* Pin 1 Orientation Circle Dot (Bottom-Left) */}
          <Circle x={28} y={222} radius={7.5} fill="#0a0a0c" />
        </Group>

        {/* ── HORIZONTAL RESISTOR & CAPACITOR BANK (Y: 422) ── */}
        <Group y={422}>
          {/* [103] Black Resistor */}
          <Group x={88}>
            <Rect width={22} height={36} fill="#18181b" stroke="#e2e8f0" strokeWidth={1} cornerRadius={2} />
            <Text text="103" x={-7} y={14} width={36} align="center" fontSize={8} fontFamily="monospace" fontStyle="bold" fill="#ffffff" rotation={-90} />
          </Group>
          {/* [103] Black Resistor */}
          <Group x={118}>
            <Rect width={22} height={36} fill="#18181b" stroke="#e2e8f0" strokeWidth={1} cornerRadius={2} />
            <Text text="103" x={-7} y={14} width={36} align="center" fontSize={8} fontFamily="monospace" fontStyle="bold" fill="#ffffff" rotation={-90} />
          </Group>
          {/* [103] Black Resistor */}
          <Group x={148}>
            <Rect width={22} height={36} fill="#18181b" stroke="#e2e8f0" strokeWidth={1} cornerRadius={2} />
            <Text text="103" x={-7} y={14} width={36} align="center" fontSize={8} fontFamily="monospace" fontStyle="bold" fill="#ffffff" rotation={-90} />
          </Group>
          {/* Tan Ceramic Capacitor */}
          <Group x={178}>
            <Rect width={22} height={36} fill="#b45309" stroke="#cbd5e1" strokeWidth={1} cornerRadius={2} />
            <Rect x={0} y={0} width={22} height={6} fill="#cbd5e1" />
            <Rect x={0} y={30} width={22} height={6} fill="#cbd5e1" />
          </Group>
          {/* [103] Black Resistor */}
          <Group x={208}>
            <Rect width={22} height={36} fill="#18181b" stroke="#e2e8f0" strokeWidth={1} cornerRadius={2} />
            <Text text="103" x={-7} y={14} width={36} align="center" fontSize={8} fontFamily="monospace" fontStyle="bold" fill="#ffffff" rotation={-90} />
          </Group>
          {/* [103] Black Resistor */}
          <Group x={238}>
            <Rect width={22} height={36} fill="#18181b" stroke="#e2e8f0" strokeWidth={1} cornerRadius={2} />
            <Text text="103" x={-7} y={14} width={36} align="center" fontSize={8} fontFamily="monospace" fontStyle="bold" fill="#ffffff" rotation={-90} />
          </Group>
        </Group>

        {/* Q2 and Q1 Silkscreen & Transistors */}
        <Text text="Q2" x={212} y={464} fontSize={13} fontFamily="monospace" fontStyle="bold" fill="#ffffff" />
        <Text text="Q1" x={256} y={464} fontSize={13} fontFamily="monospace" fontStyle="bold" fill="#ffffff" />
        {/* SOT-23 Q2 */}
        <Group x={206} y={482}>
          <Rect width={24} height={30} fill="#18181b" stroke="#334155" strokeWidth={1} cornerRadius={2} />
          <Text text="J3Y" x={-3} y={12} width={30} align="center" fontSize={7} fontFamily="monospace" fill="#94a3b8" rotation={-90} />
        </Group>
        {/* SOT-23 Q1 */}
        <Group x={248} y={482}>
          <Rect width={24} height={30} fill="#18181b" stroke="#334155" strokeWidth={1} cornerRadius={2} />
          <Text text="J3Y" x={-3} y={12} width={30} align="center" fontSize={7} fontFamily="monospace" fill="#94a3b8" rotation={-90} />
        </Group>

        {/* ── LEFT COMPONENTS (TANTALUM CAPS & AMS1117-3.3 REGULATOR) ── */}
        {/* Yellow Tantalum Capacitor marked C106 */}
        <Group x={78} y={476}>
          <Rect width={20} height={36} fill="#eab308" stroke="#ca8a04" strokeWidth={1} cornerRadius={3} />
          <Rect x={0} y={0} width={20} height={6} fill="#cbd5e1" />
          <Rect x={0} y={30} width={20} height={6} fill="#cbd5e1" />
          <Text text="C106" x={-8} y={14} width={36} align="center" fontSize={7} fontFamily="monospace" fontStyle="bold" fill="#09090b" rotation={-90} />
        </Group>

        {/* Onboard LEDs Base & Silkscreen (PWR and D2 / GPIO 2) */}
        <Group x={112} y={476}>
          {/* PWR LED Base */}
          <Group x={0}>
            <Rect width={15} height={22} fill="#18181b" stroke="#3f3f46" strokeWidth={0.8} cornerRadius={1.5} />
            <Rect x={0} y={0} width={15} height={4} fill="#cbd5e1" />
            <Rect x={0} y={18} width={15} height={4} fill="#cbd5e1" />
            <Text text="PWR" x={-6} y={24} width={27} align="center" fontSize={7} fontFamily="monospace" fontStyle="bold" fill="#ffffff" />
          </Group>

          {/* D2 LED Base */}
          <Group x={26}>
            <Rect width={15} height={22} fill="#18181b" stroke="#3f3f46" strokeWidth={0.8} cornerRadius={1.5} />
            <Rect x={0} y={0} width={15} height={4} fill="#cbd5e1" />
            <Rect x={0} y={18} width={15} height={4} fill="#cbd5e1" />
            <Text text="D2" x={-6} y={24} width={27} align="center" fontSize={7} fontFamily="monospace" fontStyle="bold" fill="#ffffff" />
          </Group>
        </Group>

        {/* Second Tantalum / Inductor Component */}
        <Group x={78} y={528}>
          <Rect width={20} height={36} fill="#ca8a04" stroke="#a16207" strokeWidth={1} cornerRadius={3} />
          <Rect x={0} y={0} width={20} height={6} fill="#cbd5e1" />
          <Rect x={0} y={30} width={20} height={6} fill="#cbd5e1" />
        </Group>

        {/* AMS1117-3.3 SOT-223 Voltage Regulator */}
        <Group x={132} y={526}>
          {/* Top Heatsink Tab soldered to large PCB silver pad */}
          <Rect x={12} y={-14} width={42} height={16} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} cornerRadius={2} />
          {/* Molded Epoxy Body */}
          <Rect width={66} height={46} fill="#18181b" stroke="#27272a" strokeWidth={1} cornerRadius={3} />
          {/* Laser-engraved Text */}
          <Text
            text="AMS1117\n3.3\nH618PE"
            x={4}
            y={8}
            width={58}
            align="center"
            fontSize={8.5}
            fontFamily="monospace"
            fontStyle="bold"
            fill="#a1a1aa"
          />
          {/* 3 Curved Bottom Solder Leads */}
          <Rect x={8} y={44} width={10} height={16} fill="#cbd5e1" cornerRadius={1} />
          <Rect x={28} y={44} width={10} height={16} fill="#cbd5e1" cornerRadius={1} />
          <Rect x={48} y={44} width={10} height={16} fill="#cbd5e1" cornerRadius={1} />
        </Group>

        {/* MOSFET / Power Transistor below AMS1117 */}
        <Group x={95} y={605}>
          <Rect x={10} y={-10} width={48} height={12} fill="#cbd5e1" cornerRadius={2} />
          <Rect width={68} height={48} fill="#18181b" stroke="#27272a" strokeWidth={1} cornerRadius={3} />
          {/* 3 Leads */}
          <Rect x={10} y={46} width={10} height={14} fill="#cbd5e1" cornerRadius={1} />
          <Rect x={29} y={46} width={10} height={14} fill="#cbd5e1" cornerRadius={1} />
          <Rect x={48} y={46} width={10} height={14} fill="#cbd5e1" cornerRadius={1} />
        </Group>

        {/* ── CENTER SECTION: CP2102 USB-TO-UART BRIDGE IC (195, 576) ── */}
        <Group x={195} y={576}>
          {/* QFN-28 IC Body */}
          <Rect width={72} height={72} fill="#141416" stroke="#27272a" strokeWidth={1.5} cornerRadius={3} />
          {/* Pin 1 Orientation Dot */}
          <Circle x={10} y={10} radius={3.5} fill="#71717a" />
          {/* Laser Engraved Markings */}
          <Text
            text="SILABS\nCP2102\nFCP03X\nA433X"
            x={5}
            y={14}
            width={62}
            align="center"
            fontSize={8}
            fontFamily="monospace"
            fontStyle="bold"
            fill="#a1a1aa"
          />
          {/* Silver Contact Pins along 4 Sides (7 pins each) */}
          {Array.from({ length: 7 }).map((_, i) => (
            <React.Fragment key={`cp-pin-${i}`}>
              <Rect x={10 + i * 8} y={-4} width={4} height={5} fill="#cbd5e1" cornerRadius={0.5} />
              <Rect x={10 + i * 8} y={71} width={4} height={5} fill="#cbd5e1" cornerRadius={0.5} />
              <Rect x={-4} y={10 + i * 8} width={5} height={4} fill="#cbd5e1" cornerRadius={0.5} />
              <Rect x={71} y={10 + i * 8} width={5} height={4} fill="#cbd5e1" cornerRadius={0.5} />
            </React.Fragment>
          ))}
        </Group>

        {/* Small Crystal / Resonator below CP2102 */}
        <Group x={202} y={665}>
          <Rect width={58} height={20} fill="#18181b" stroke="#71717a" strokeWidth={1} cornerRadius={2} />
          <Rect x={0} y={0} width={8} height={20} fill="#cbd5e1" />
          <Rect x={50} y={0} width={8} height={20} fill="#cbd5e1" />
        </Group>

        {/* ── RIGHT SECTION: VERTICAL SMD STACK AT X=285 ── */}
        {/* [103] Resistor */}
        <Group x={285} y={508}>
          <Rect width={22} height={20} fill="#18181b" stroke="#cbd5e1" strokeWidth={1} cornerRadius={1} />
          <Text text="103" x={-1} y={4} width={24} align="center" fontSize={7} fontFamily="monospace" fill="#ffffff" />
        </Group>
        {/* [201] Resistor */}
        <Group x={285} y={534}>
          <Rect width={22} height={20} fill="#18181b" stroke="#cbd5e1" strokeWidth={1} cornerRadius={1} />
          <Text text="201" x={-1} y={4} width={24} align="center" fontSize={7} fontFamily="monospace" fill="#ffffff" />
        </Group>
        {/* 4 Stacked Amber Ceramic Capacitors */}
        {[560, 584, 608, 632].map((cy, i) => (
          <Group key={`cap-stack-${i}`} x={285} y={cy}>
            <Rect width={22} height={20} fill="#b45309" stroke="#cbd5e1" strokeWidth={1} cornerRadius={2} />
            <Rect x={0} y={0} width={4} height={20} fill="#cbd5e1" />
            <Rect x={18} y={0} width={4} height={20} fill="#cbd5e1" />
          </Group>
        ))}

        {/* ── BOTTOM CONTROLS (RS3 & BOOT SWITCHES + MICRO-USB PORT) ── */}
        {/* RS3 (Reset) Pushbutton on Left */}
        <Group x={98} y={702}>
          {/* Metallic Square Base with 4 Solder Tabs */}
          <Rect width={44} height={44} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={-4} y={6} width={5} height={10} fill="#94a3b8" />
          <Rect x={-4} y={28} width={5} height={10} fill="#94a3b8" />
          <Rect x={43} y={6} width={5} height={10} fill="#94a3b8" />
          <Rect x={43} y={28} width={5} height={10} fill="#94a3b8" />
          {/* Center Round Button Actuator */}
          <Circle x={22} y={22} radius={14} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <Circle x={22} y={22} radius={9} fill="#09090b" />
          {/* Silkscreen Label 'RS3' Rotated Vertically */}
          <Text
            text="RS3"
            x={48}
            y={22}
            fontSize={14}
            fontFamily="monospace"
            fontStyle="900"
            fill="#ffffff"
            rotation={-90}
          />
        </Group>

        {/* BOOT Pushbutton on Right */}
        <Group x={263} y={702}>
          {/* Metallic Square Base with 4 Solder Tabs */}
          <Rect width={44} height={44} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} cornerRadius={4} />
          <Rect x={-4} y={6} width={5} height={10} fill="#94a3b8" />
          <Rect x={-4} y={28} width={5} height={10} fill="#94a3b8" />
          <Rect x={43} y={6} width={5} height={10} fill="#94a3b8" />
          <Rect x={43} y={28} width={5} height={10} fill="#94a3b8" />
          {/* Center Round Button Actuator */}
          <Circle x={22} y={22} radius={14} fill="#1e293b" stroke="#475569" strokeWidth={2} />
          <Circle x={22} y={22} radius={9} fill="#09090b" />
          {/* Silkscreen Label 'BOOT' Rotated Vertically */}
          <Text
            text="BOOT"
            x={-18}
            y={34}
            fontSize={14}
            fontFamily="monospace"
            fontStyle="900"
            fill="#ffffff"
            rotation={-90}
          />
        </Group>

        {/* Micro-USB Port (Bottom-Center, Overhanging Edge) */}
        <Group x={160} y={700}>
          {/* Stamped Silver Shell */}
          <Rect
            width={85}
            height={58}
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth={1.5}
            cornerRadius={4}
            shadowColor="#000000"
            shadowBlur={10}
            shadowOpacity={0.5}
            shadowOffset={{ x: 0, y: 5 }}
          />
          {/* 2 Solder Latch Tabs on Top Shell */}
          <Rect x={18} y={32} width={12} height={16} fill="#94a3b8" stroke="#64748b" strokeWidth={1} cornerRadius={2} />
          <Rect x={55} y={32} width={12} height={16} fill="#94a3b8" stroke="#64748b" strokeWidth={1} cornerRadius={2} />
          {/* Micro-USB Receptacle Cavity */}
          <Rect x={12} y={48} width={61} height={16} fill="#09090b" cornerRadius={3} />
          {/* 5 Internal Gold Spring Contacts */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Rect key={`uc-${i}`} x={22 + i * 8} y={50} width={4} height={8} fill="#cca43b" cornerRadius={1} />
          ))}
          {/* Side Solder Mounting Legs */}
          <Rect x={-5} y={16} width={6} height={16} fill="#cbd5e1" cornerRadius={1} />
          <Rect x={84} y={16} width={6} height={16} fill="#cbd5e1" cornerRadius={1} />
        </Group>

        {/* ── THE 38 METALLIC TEARDROP SOLDER THROUGH-HOLE PADS ── */}
        {/* Left Column 19 Pads */}
        {Array.from({ length: 19 }).map((_, i) => {
          const cy = 75 + i * 33;
          return (
            <Group key={`pad-l-${i}`}>
              {/* Teardrop Metallic Pad Tapering Right */}
              <Rect x={17} y={cy - 7} width={22} height={14} cornerRadius={7} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} />
              {/* Shiny Silver Raised Solder Ring */}
              <Circle x={28} y={cy} radius={5.8} fill="#e2e8f0" stroke="#ffffff" strokeWidth={1.2} />
              {/* Dark Through-Hole */}
              <Circle x={28} y={cy} radius={3.6} fill="#09090b" />
            </Group>
          );
        })}

        {/* Right Column 19 Pads */}
        {Array.from({ length: 19 }).map((_, i) => {
          const cy = 75 + i * 33;
          return (
            <Group key={`pad-r-${i}`}>
              {/* Teardrop Metallic Pad Tapering Left */}
              <Rect x={366} y={cy - 7} width={22} height={14} cornerRadius={7} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} />
              {/* Shiny Silver Raised Solder Ring */}
              <Circle x={377} y={cy} radius={5.8} fill="#e2e8f0" stroke="#ffffff" strokeWidth={1.2} />
              {/* Dark Through-Hole */}
              <Circle x={377} y={cy} radius={3.6} fill="#09090b" />
            </Group>
          );
        })}

        {/* ── VERTICAL SILKSCREEN PIN LABELS (EXACTLY MATCHING THE IMAGE) ── */}
        {/* Left 19 Labels (Rotated -90 degrees) */}
        {[
          '3V3', 'EN', 'VP', 'VN', '34', '35', '32', '33', '25', '26',
          '27', '14', '12', 'GND', '13', 'SD2', 'SD3', 'CMD', '5V'
        ].map((lbl, i) => (
          <Text
            key={`lbl-l-${i}`}
            text={lbl}
            x={48}
            y={75 + i * 33 + 6}
            fontSize={12}
            fontFamily="monospace"
            fontStyle="900"
            fill="#ffffff"
            rotation={-90}
          />
        ))}

        {/* Right 19 Labels (Rotated -90 degrees) */}
        {[
          'GND', '23', '22', 'TXD', 'RXD', '21', 'GND', '19', '18', '5',
          '17', '16', '4', '0', '2', '15', 'SD1', 'SD0', 'CLK'
        ].map((lbl, i) => (
          <Text
            key={`lbl-r-${i}`}
            text={lbl}
            x={356}
            y={75 + i * 33 + 6}
            fontSize={12}
            fontFamily="monospace"
            fontStyle="900"
            fill="#ffffff"
            rotation={-90}
          />
        ))}
      </Group>

      {/* ── DYNAMIC ONBOARD LEDS (PWR & D2 - NOT CACHED) ── */}
      <Group scaleX={sx} scaleY={sy} listening={false}>
        {/* PWR LED Glow (Red) */}
        <Rect
          ref={pwrLedRef}
          x={114}
          y={481}
          width={11}
          height={12}
          fill="#450a0a"
          cornerRadius={1}
        />
        {/* D2 LED Glow (Blue - GPIO 2) */}
        <Rect
          ref={d2LedRef}
          x={140}
          y={481}
          width={11}
          height={12}
          fill="#1e293b"
          cornerRadius={1}
        />
      </Group>

      {/* ── DYNAMIC PIN CONTACT GLOWS (NOT CACHED) ── */}
      {pinList.map((pin) => {
        const isHovered = hoveredPin === pin.id;
        const isLeft = pin.position.x < 74;

        return (
          <Group
            key={pin.id}
            x={pin.position.x}
            y={pin.position.y}
            listening={false}
          >
            {/* Interactive Snap / Hover Circle with Arduino warm amber glow */}
            <Circle
              x={0}
              y={0}
              radius={isHovered ? 4.5 : 2.5}
              stroke={isHovered ? '#fbbf24' : 'transparent'}
              strokeWidth={isHovered ? 1.2 : 0}
              shadowColor={isHovered ? '#fbbf24' : 'transparent'}
              shadowBlur={isHovered ? 6 : 0}
            />

            {/* Inner Pin Contact Glow */}
            <Circle
              ref={(node) => {
                if (node) pinRefs.current[pin.id] = node;
              }}
              x={0}
              y={0}
              radius={1.2}
              fill="#09090b"
            />

            {/* Hover Tooltip Tag (Identical to Arduino Uno) */}
            {isHovered && (
              <Label x={isLeft ? 6 : -6} y={0} opacity={1}>
                <Tag
                  fill="#1f2937"
                  stroke="#4b5563"
                  strokeWidth={0.5}
                  cornerRadius={2}
                  pointerDirection={isLeft ? 'left' : 'right'}
                  pointerWidth={4}
                  pointerHeight={4}
                />
                <Text
                  text={`${pin.label} (${pin.type})`}
                  fill="#ffffff"
                  fontSize={8}
                  fontFamily="sans-serif"
                  padding={3}
                />
              </Label>
            )}
          </Group>
        );
      })}

      {/* ── INTERACTIVE WIRE SNAPPING HITBOXES ── */}
      {/* Left Column Overlay */}
      <Rect
        x={0}
        y={15}
        width={35}
        height={250}
        fill="rgba(0,0,0,0.001)"
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        onMouseDown={handleOverlayMouseDown}
      />
      {/* Right Column Overlay */}
      <Rect
        x={113}
        y={15}
        width={35}
        height={250}
        fill="rgba(0,0,0,0.001)"
        onMouseMove={handleOverlayMouseMove}
        onMouseLeave={handleOverlayMouseLeave}
        onMouseDown={handleOverlayMouseDown}
      />

      {/* Interactive Tactile Pushbuttons */}
      <Circle
        x={120 * sx}
        y={724 * sy}
        radius={18 * sx}
        fill="transparent"
        onClick={handleEnClick}
        onTap={handleEnClick}
      />
      <Circle
        x={285 * sx}
        y={724 * sy}
        radius={18 * sx}
        fill="transparent"
        onClick={handleBootClick}
        onTap={handleBootClick}
      />
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
