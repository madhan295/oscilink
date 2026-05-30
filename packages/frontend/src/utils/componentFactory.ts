import { v4 as uuidv4 } from 'uuid';
import {
  CircuitComponent,
  ComponentType,
  Point,
  Pin,
  PinType,
  PinDirection
} from '../types/components';

export function createComponent(type: ComponentType, position: Point): CircuitComponent {
  const id = uuidv4();
  let pins: Record<string, Pin> = {};
  let properties: Record<string, any> = {};

  const createPin = (pinId: string, label: string, pType: PinType, direction: PinDirection, pos: Point): Pin => ({
    id: pinId,
    label,
    type: pType,
    direction,
    position: pos,
    connectedWireIds: [],
    voltage: 0
  });

  switch (type) {
    case 'ARDUINO_UNO': {
      // Scale: 200x140
      const leftYSpacing = 140 / 7;
      pins['RESET'] = createPin('RESET', 'RESET', 'power', 'output', { x: 0, y: leftYSpacing * 1 });
      pins['3V3'] = createPin('3V3', '3.3V', 'power', 'output', { x: 0, y: leftYSpacing * 2 });
      pins['5V'] = createPin('5V', '5V', 'power', 'output', { x: 0, y: leftYSpacing * 3 });
      pins['GND_1'] = createPin('GND_1', 'GND', 'ground', 'output', { x: 0, y: leftYSpacing * 4 });
      pins['GND_2'] = createPin('GND_2', 'GND', 'ground', 'output', { x: 0, y: leftYSpacing * 5 });
      pins['VIN'] = createPin('VIN', 'VIN', 'power', 'output', { x: 0, y: leftYSpacing * 6 });

      const rightYSpacing = 140 / 7;
      pins['A0'] = createPin('A0', 'A0', 'analog', 'input', { x: 200, y: rightYSpacing * 1 });
      pins['A1'] = createPin('A1', 'A1', 'analog', 'input', { x: 200, y: rightYSpacing * 2 });
      pins['A2'] = createPin('A2', 'A2', 'analog', 'input', { x: 200, y: rightYSpacing * 3 });
      pins['A3'] = createPin('A3', 'A3', 'analog', 'input', { x: 200, y: rightYSpacing * 4 });
      pins['A4'] = createPin('A4', 'A4', 'I2C_SDA', 'input', { x: 200, y: rightYSpacing * 5 });
      pins['A5'] = createPin('A5', 'A5', 'I2C_SCL', 'input', { x: 200, y: rightYSpacing * 6 });

      const bottomXSpacing = 200 / 15;
      for (let i = 0; i <= 13; i++) {
        const pType: PinType = [3, 5, 6, 9, 10, 11].includes(i) ? 'PWM' : 'digital';
        pins[`D${i}`] = createPin(`D${i}`, `D${i}`, pType, 'bidirectional', { x: bottomXSpacing * (i + 1), y: 140 });
      }
      break;
    }

    case 'LED': {
      pins['ANODE'] = createPin('ANODE', '+', 'digital', 'bidirectional', { x: 10, y: 40 });
      pins['CATHODE'] = createPin('CATHODE', '-', 'digital', 'bidirectional', { x: 30, y: 40 });
      properties = { color: 'RED', forwardVoltage: 2.0 };
      break;
    }

    case 'RESISTOR': {
      pins['PIN_1'] = createPin('PIN_1', '1', 'digital', 'bidirectional', { x: 0, y: 10 });
      pins['PIN_2'] = createPin('PIN_2', '2', 'digital', 'bidirectional', { x: 60, y: 10 });
      properties = { resistance: 220, tolerance: 0.05, wattage: 0.25 };
      break;
    }

    case 'PUSH_BUTTON': {
      pins['PIN_IN'] = createPin('PIN_IN', 'IN', 'digital', 'bidirectional', { x: 0, y: 20 });
      pins['PIN_OUT'] = createPin('PIN_OUT', 'OUT', 'digital', 'bidirectional', { x: 40, y: 20 });
      properties = { pullup: false };
      break;
    }

    case 'POTENTIOMETER': {
      pins['VCC_PIN'] = createPin('VCC_PIN', 'VCC', 'power', 'input', { x: 10, y: 40 });
      pins['WIPER'] = createPin('WIPER', 'OUT', 'analog', 'output', { x: 25, y: 40 });
      pins['GND_PIN'] = createPin('GND_PIN', 'GND', 'ground', 'input', { x: 40, y: 40 });
      properties = { value: 512, resistance: 10000 };
      break;
    }

    case 'SERVO_MOTOR': {
      pins['SIGNAL'] = createPin('SIGNAL', 'SIG', 'PWM', 'input', { x: 10, y: 50 });
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 25, y: 50 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 40, y: 50 });
      properties = { minPulse: 544, maxPulse: 2400 };
      break;
    }

    case 'BUZZER': {
      pins['POSITIVE'] = createPin('POSITIVE', '+', 'digital', 'input', { x: 10, y: 40 });
      pins['NEGATIVE'] = createPin('NEGATIVE', '-', 'ground', 'input', { x: 30, y: 40 });
      properties = { frequency: 440, passive: false };
      break;
    }

    case 'LCD_16X2': {
      const spacing = 12;
      const startX = 10;
      const y = 0; // top

      const lcdPins = [
        { id: 'VSS', label: 'VSS', type: 'ground' as PinType, dir: 'input' as PinDirection },
        { id: 'VDD', label: 'VDD', type: 'power' as PinType, dir: 'input' as PinDirection },
        { id: 'V0', label: 'V0', type: 'analog' as PinType, dir: 'input' as PinDirection },
        { id: 'RS', label: 'RS', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'RW', label: 'RW', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'E', label: 'E', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'D4', label: 'D4', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'D5', label: 'D5', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'D6', label: 'D6', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'D7', label: 'D7', type: 'digital' as PinType, dir: 'output' as PinDirection },
        { id: 'A', label: 'A', type: 'power' as PinType, dir: 'input' as PinDirection },
        { id: 'K', label: 'K', type: 'ground' as PinType, dir: 'input' as PinDirection },
      ];

      lcdPins.forEach((p, idx) => {
        pins[p.id] = createPin(p.id, p.label, p.type, p.dir, { x: startX + idx * spacing, y });
      });
      properties = { columns: 16, rows: 2 };
      break;
    }

    case 'ULTRASONIC_SENSOR': {
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 10, y: 40 });
      pins['TRIG'] = createPin('TRIG', 'TRIG', 'digital', 'output', { x: 25, y: 40 });
      pins['ECHO'] = createPin('ECHO', 'ECHO', 'digital', 'input', { x: 40, y: 40 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 55, y: 40 });
      properties = { maxRangeCm: 400 };
      break;
    }

    case 'TEMPERATURE_SENSOR': {
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 10, y: 40 });
      pins['DATA'] = createPin('DATA', 'DAT', 'digital', 'bidirectional', { x: 25, y: 40 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 40, y: 40 });
      properties = { type: 'DHT11' };
      break;
    }

    case 'RELAY': {
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 0, y: 10 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 0, y: 30 });
      pins['IN'] = createPin('IN', 'IN', 'digital', 'input', { x: 0, y: 50 });

      pins['NO'] = createPin('NO', 'NO', 'digital', 'bidirectional', { x: 60, y: 10 });
      pins['NC'] = createPin('NC', 'NC', 'digital', 'bidirectional', { x: 60, y: 50 });
      pins['COM'] = createPin('COM', 'COM', 'digital', 'bidirectional', { x: 60, y: 30 });
      properties = { triggerVoltage: 5 };
      break;
    }

    case 'BREADBOARD': {
      pins['TOP_POS'] = createPin('TOP_POS', '+', 'power', 'bidirectional', { x: 10, y: 0 });
      pins['TOP_NEG'] = createPin('TOP_NEG', '-', 'ground', 'bidirectional', { x: 10, y: 15 });
      pins['BOTTOM_POS'] = createPin('BOTTOM_POS', '+', 'power', 'bidirectional', { x: 10, y: 105 });
      pins['BOTTOM_NEG'] = createPin('BOTTOM_NEG', '-', 'ground', 'bidirectional', { x: 10, y: 120 });
      properties = { rows: 10, columns: 30 };
      break;
    }

    default:
      throw new Error(`Unknown component type: ${type}`);
  }

  return {
    id,
    type,
    position,
    rotation: 0,
    pins,
    properties,
    zIndex: 0
  };
}

// @ts-ignore - temporary test exposure, remove after testing
if (typeof window !== 'undefined') (window as any).testFactory = createComponent;