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
      // 32 exact pins based on true visual alignment with black header boxes
      const sx = 200 / 780;
      const sy = 140 / 540;
      
      const createPinVoltage = (pinId: string, label: string, pType: PinType, direction: PinDirection, pos: Point, voltage = 0): Pin => ({
        id: pinId,
        label,
        type: pType,
        direction,
        position: pos,
        connectedWireIds: [],
        voltage
      });

      const topY = 40 * sy;
      const bottomY = 500 * sy;

      // Group A: Top Left Digital (10 pins, Box: 225, 190)
      const gA_startX = 234;
      const gA_space = 172 / 9;
      const groupA = [
        { id: 'SCL', type: 'I2C_SCL', dir: 'bidirectional', label: 'SCL' },
        { id: 'SDA', type: 'I2C_SDA', dir: 'bidirectional', label: 'SDA' },
        { id: 'AREF', type: 'analog', dir: 'input', label: 'AREF' },
        { id: 'GND_TOP', type: 'ground', dir: 'output', label: 'GND' },
        { id: 'D13', type: 'digital', dir: 'bidirectional', label: '13' },
        { id: 'D12', type: 'digital', dir: 'bidirectional', label: '12' },
        { id: 'D11', type: 'PWM', dir: 'bidirectional', label: '~11' },
        { id: 'D10', type: 'PWM', dir: 'bidirectional', label: '~10' },
        { id: 'D9', type: 'PWM', dir: 'bidirectional', label: '~9' },
        { id: 'D8', type: 'digital', dir: 'bidirectional', label: '8' }
      ];
      groupA.forEach((p, i) => {
        pins[p.id] = createPinVoltage(p.id, p.label, p.type as PinType, p.dir as PinDirection, {
          x: (gA_startX + i * gA_space) * sx, y: topY
        });
      });

      // Group B: Top Right Digital (8 pins, Box: 424, 152)
      const gB_startX = 433;
      const gB_space = 134 / 7;
      const groupB = [
        { id: 'D7', type: 'digital', dir: 'bidirectional', label: '7' },
        { id: 'D6', type: 'PWM', dir: 'bidirectional', label: '~6' },
        { id: 'D5', type: 'PWM', dir: 'bidirectional', label: '~5' },
        { id: 'D4', type: 'digital', dir: 'bidirectional', label: '4' },
        { id: 'D3', type: 'PWM', dir: 'bidirectional', label: '~3' },
        { id: 'D2', type: 'digital', dir: 'bidirectional', label: '2' },
        { id: 'TX', type: 'digital', dir: 'bidirectional', label: 'TX→1' },
        { id: 'RX', type: 'digital', dir: 'bidirectional', label: 'RX←0' }
      ];
      groupB.forEach((p, i) => {
        pins[p.id] = createPinVoltage(p.id, p.label, p.type as PinType, p.dir as PinDirection, {
          x: (gB_startX + i * gB_space) * sx, y: topY
        });
      });

      // Group C: Bottom Power (8 pins mapped to holes 1-8 of the 8-hole header box at 296, 152)
      const gC_startX = 305; // Start at hole index 0
      const gC_space = 134 / 7;
      const groupC = [
        { id: 'NC_POWER', type: 'digital', dir: 'input', label: '' },
        { id: 'IOREF', type: 'power', dir: 'output', label: 'IOREF' },
        { id: 'RESET', type: 'digital', dir: 'input', label: 'RESET' },
        { id: '3V3', type: 'power', dir: 'output', label: '3.3V', v: 3.3 },
        { id: '5V', type: 'power', dir: 'output', label: '5V', v: 5 },
        { id: 'GND_1', type: 'ground', dir: 'output', label: 'GND' },
        { id: 'GND_2', type: 'ground', dir: 'output', label: 'GND' },
        { id: 'VIN', type: 'power', dir: 'input', label: 'Vin' }
      ];
      groupC.forEach((p, i) => {
        pins[p.id] = createPinVoltage(p.id, p.label, p.type as PinType, p.dir as PinDirection, {
          x: (gC_startX + i * gC_space) * sx, y: bottomY
        }, p.v || 0);
      });

      // Group D: Bottom Analog (6 pins, Box: 460, 116)
      const gD_startX = 469;
      const gD_space = 98 / 5;
      const groupD = [
        { id: 'A0', type: 'analog', dir: 'input', label: 'A0' },
        { id: 'A1', type: 'analog', dir: 'input', label: 'A1' },
        { id: 'A2', type: 'analog', dir: 'input', label: 'A2' },
        { id: 'A3', type: 'analog', dir: 'input', label: 'A3' },
        { id: 'A4', type: 'I2C_SDA', dir: 'input', label: 'A4' },
        { id: 'A5', type: 'I2C_SCL', dir: 'input', label: 'A5' }
      ];
      groupD.forEach((p, i) => {
        pins[p.id] = createPinVoltage(p.id, p.label, p.type as PinType, p.dir as PinDirection, {
          x: (gD_startX + i * gD_space) * sx, y: bottomY
        });
      });

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

    case 'POTENTIOMETER': {
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 4, y: 46 });
      pins['WIPER'] = createPin('WIPER', 'WIP', 'analog', 'output', { x: 18, y: 46 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 32, y: 46 });
      properties = { resistance: 10000 };
      break;
    }

    case 'SERVO_MOTOR': {
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 15, y: 40 });
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 25, y: 40 });
      pins['SIGNAL'] = createPin('SIGNAL', 'SIG', 'PWM', 'input', { x: 35, y: 40 });
      properties = { minPulse: 544, maxPulse: 2400, servoType: 'positional' };
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
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: -8, y: 0 });
      pins['TRIG'] = createPin('TRIG', 'TRIG', 'digital', 'bidirectional', { x: -3, y: 0 });
      pins['ECHO'] = createPin('ECHO', 'ECHO', 'digital', 'bidirectional', { x: 2, y: 0 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 7, y: 0 });
      properties = { maxRangeCm: 400 };
      break;
    }

    case 'TEMPERATURE_SENSOR': {
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: -14, y: 0 });
      pins['DATA'] = createPin('DATA', 'DAT', 'digital', 'bidirectional', { x: 0, y: 0 });
      pins['GND'] = createPin('GND', 'GND', 'ground', 'input', { x: 14, y: 0 });
      properties = { type: 'DHT11', simulatedTemp: 25.0, simulatedHumidity: 60 };
      break;
    }

    case 'RELAY': {
      // Top pins (Blue terminal block screws)
      pins['NC'] = createPin('NC', 'NC', 'digital', 'bidirectional', { x: -15, y: -40 });
      pins['COM'] = createPin('COM', 'C', 'digital', 'bidirectional', { x: 2.5, y: -40 });
      pins['NO'] = createPin('NO', 'NO', 'digital', 'bidirectional', { x: 20, y: -40 });

      // Bottom pins (Tips of the red headers)
      pins['IN'] = createPin('IN', 'S', 'digital', 'input', { x: 5, y: 62 });
      pins['VCC'] = createPin('VCC', 'VCC', 'power', 'input', { x: 15, y: 62 });
      pins['GND'] = createPin('GND', '-', 'ground', 'input', { x: 25, y: 62 });
      
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