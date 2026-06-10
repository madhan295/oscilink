import {
  CPU,
  AVRIOPort,
  AVRTimer,
  AVRUSART,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config,
  avrInstruction
} from 'avr8js';

import { CircuitGraph, calculateLEDState, calculateBuzzerState, calculateServoState } from './engine/CircuitGraph';

class AVRRunner {
  cpu: CPU;
  timer0: AVRTimer;
  timer1: AVRTimer;
  timer2: AVRTimer;
  portB: AVRIOPort;
  portC: AVRIOPort;
  portD: AVRIOPort;
  usart: AVRUSART;

  constructor(flashData: Uint8Array) {
    const program = new Uint16Array(flashData.buffer);
    this.cpu = new CPU(program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.usart = new AVRUSART(this.cpu, usart0Config, 16000000);
  }
}

let avrRunner: AVRRunner | null = null;
let circuitGraph: CircuitGraph | null = null;
let simulationLoopTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let serialBuffer = "";
let pendingUpdates: Record<string, any> = {};

let lastHex: string | null = null;
let lastGraphData: any = null;
let lastTickTime = 0;

let lastPortB = 0;
let lastPortC = 0;
let lastPortD = 0;

function parseIntelHex(hexString: string): Uint8Array {
  const flash = new Uint8Array(32768);
  flash.fill(0xFF);
  const lines = hexString.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line[0] !== ':') {
      throw new Error(`Malformed hex at line ${i + 1}: Missing ':'`);
    }

    const byteCount = parseInt(line.substring(1, 3), 16);
    const address = parseInt(line.substring(3, 7), 16);
    const recordType = parseInt(line.substring(7, 9), 16);

    let checksum = 0;
    for (let j = 1; j < line.length - 2; j += 2) {
      checksum += parseInt(line.substring(j, j + 2), 16);
    }
    checksum = (~checksum + 1) & 0xFF;
    const fileChecksum = parseInt(line.substring(line.length - 2), 16);

    if (checksum !== fileChecksum) {
      throw new Error(`Checksum mismatch at line ${i + 1}`);
    }

    if (recordType === 0) {
      for (let j = 0; j < byteCount; j++) {
        const dataByte = parseInt(line.substring(9 + j * 2, 11 + j * 2), 16);
        if (address + j < flash.length) {
          flash[address + j] = dataByte;
        }
      }
    } else if (recordType === 1) {
      break;
    }
  }

  return flash;
}



function stopSimulation() {
  isRunning = false;
  if (simulationLoopTimer) {
    clearTimeout(simulationLoopTimer);
    simulationLoopTimer = null;
  }
  avrRunner = null;
  circuitGraph = null;
  pendingUpdates = {};
}


function simulationLoop() {
  if (!isRunning) return;

  const now = performance.now();
  const elapsed = now - lastTickTime;
  lastTickTime = now;

  let cyclesToRun = Math.floor(elapsed * 16000);

  if (cyclesToRun > 16000000) {
    cyclesToRun = 16000000;
  }

  if (avrRunner) {
    for (let i = 0; i < cyclesToRun; i++) {
      avrInstruction(avrRunner.cpu);
      avrRunner.cpu.tick();
    }
  }

  flushUpdates();
  simulationLoopTimer = setTimeout(simulationLoop, 16);
}

function queueComponentUpdate(componentId: string, state: any) {
  if (!pendingUpdates[componentId]) {
    pendingUpdates[componentId] = {};
  }
  Object.assign(pendingUpdates[componentId], state);
}

function flushUpdates() {
  if (Object.keys(pendingUpdates).length > 0) {
    postMessage({ type: 'BATCH_UPDATE', payload: { updates: pendingUpdates } });
    pendingUpdates = {};
  }
}

function handlePinChange(pinName: string, voltage: number) {
  // Always notify UI for Arduino visual pins
  postMessage({ type: 'PIN_CHANGE', payload: { componentId: 'arduino-uno', pinId: pinName, voltage } });

  if (circuitGraph) {
    // 1. Find the real Arduino ID in the graph
    let arduinoId = null;
    for (const [id, comp] of circuitGraph.components.entries()) {
      if (comp.type === 'ARDUINO_UNO') { arduinoId = id; break; }
    }

    if (arduinoId) {
      const nodeId = `${arduinoId}.${pinName}`;
      // 2. Propagate
      circuitGraph.propagateVoltage(nodeId, voltage);

      // 3. Update all components that might have changed
      for (const [id, comp] of circuitGraph.components.entries()) {
        if (comp.type === 'LED') {
          const state = calculateLEDState(comp, circuitGraph);
          queueComponentUpdate(id, state);
        } else if (comp.type === 'BUZZER') {
          const state = calculateBuzzerState(comp, circuitGraph);
          queueComponentUpdate(id, state);
        } else if (comp.type === 'SERVO') {
          // We might need to handle servo differently if it relies on PWM history, but for now:
          // We'll leave Servo out of this loop or handle it if needed.
        }
      }
    }
  }
}

function handlePWMChange(pinName: string, dutyCycle: number) {
  handlePinChange(pinName, dutyCycle * 5.0);

  if (circuitGraph) {
    let arduinoId = null;
    for (const [id, comp] of circuitGraph.components.entries()) {
      if (comp.type === 'ARDUINO_UNO') { arduinoId = id; break; }
    }
    if (arduinoId) {
      for (const [id, comp] of circuitGraph.components.entries()) {
        if (comp.type === 'SERVO') {
          // Check if this servo is attached to this pin
          if (circuitGraph.findPath(`${arduinoId}.${pinName}`, `${id}.pwm`)) {
            const state = calculateServoState(dutyCycle);
            queueComponentUpdate(id, state);
          }
        }
      }
    }
  }
}

export function setAnalogInputVoltage(channel: number, voltage: number) {
  if (!avrRunner) return;
  // ADMUX is at 0x7C
  const admux = avrRunner.cpu.data[0x7C];
  const selectedChannel = admux & 0x0F;
  if (selectedChannel === channel) {
    const counts = Math.round((voltage / 5.0) * 1023);
    // ADCL is at 0x78, ADCH is at 0x79
    avrRunner.cpu.data[0x78] = counts & 0xFF;
    avrRunner.cpu.data[0x79] = (counts >> 8) & 0x03;
  }
}

function initializeSimulation(hex: string, graphData: any) {
  try {
    const flashData = parseIntelHex(hex);

    avrRunner = new AVRRunner(flashData);

    // Reset previous port states
    lastPortB = 0;
    lastPortC = 0;
    lastPortD = 0;

    // Build circuit graph from topology data
    circuitGraph = new CircuitGraph();
    if (graphData) {
      circuitGraph.loadSerialized(graphData);

      // Seed initial ground and power pins for any arduinos
      for (const [nodeId, node] of circuitGraph.nodes.entries()) {
        const comp = circuitGraph.components.get(node.componentId);
        if (comp && comp.type === 'ARDUINO_UNO') {
          if (node.pinType === 'power') {
            const v = nodeId.includes('3V3') ? 3.3 : 5.0;
            circuitGraph.propagateVoltage(nodeId, v);
          } else if (node.pinType === 'ground') {
            circuitGraph.propagateVoltage(nodeId, 0.0);
          }
        }
      }
    }

    // PORT LISTENERS
    avrRunner.portB.addListener((value: number) => {
      for (let bit = 0; bit < 6; bit++) {
        const isHigh = (value & (1 << bit)) !== 0;
        const wasHigh = (lastPortB & (1 << bit)) !== 0;
        if (isHigh !== wasHigh) {
          let pinName = '';
          if (bit === 0) pinName = 'D8';
          else if (bit === 1) pinName = 'D9';
          else if (bit === 2) pinName = 'D10';
          else if (bit === 3) pinName = 'D11';
          else if (bit === 4) pinName = 'D12';
          else if (bit === 5) pinName = 'D13';
          if (pinName) handlePinChange(pinName, isHigh ? 5.0 : 0.0);
        }
      }
      lastPortB = value;
    });

    avrRunner.portC.addListener((value: number) => {
      for (let bit = 0; bit < 6; bit++) {
        const isHigh = (value & (1 << bit)) !== 0;
        const wasHigh = (lastPortC & (1 << bit)) !== 0;
        if (isHigh !== wasHigh) {
          let pinName = 'A' + bit;
          handlePinChange(pinName, isHigh ? 5.0 : 0.0);
        }
      }
      lastPortC = value;
    });

    avrRunner.portD.addListener((value: number) => {
      for (let bit = 0; bit < 8; bit++) {
        const isHigh = (value & (1 << bit)) !== 0;
        const wasHigh = (lastPortD & (1 << bit)) !== 0;
        if (isHigh !== wasHigh) {
          let pinName = 'D' + bit;
          handlePinChange(pinName, isHigh ? 5.0 : 0.0);
        }
      }
      lastPortD = value;
    });

    // SERIAL UART SETUP
    avrRunner.usart.onByteTransmit = (value: number) => {
      serialBuffer += String.fromCharCode(value);
      if (value === 10 || serialBuffer.length >= 128) {
        postMessage({ type: 'SERIAL_OUTPUT', payload: { text: serialBuffer } });
        serialBuffer = '';
      }
    };

    // PWM DETECTION
    // OCR1AL (0x8A), OCR1AH (0x8B) -> D9
    avrRunner.cpu.writeHooks[0x8A] = (value: number) => { handlePWMChange('D9', value / 255.0); return false; };
    // OCR1BL (0x88), OCR1BH (0x89) -> D10
    avrRunner.cpu.writeHooks[0x88] = (value: number) => { handlePWMChange('D10', value / 255.0); return false; };
    // OCR2A (0xB3) -> D11
    avrRunner.cpu.writeHooks[0xB3] = (value: number) => { handlePWMChange('D11', value / 255.0); return false; };
    // OCR2B (0xB4) -> D3
    avrRunner.cpu.writeHooks[0xB4] = (value: number) => { handlePWMChange('D3', value / 255.0); return false; };

    lastHex = hex;
    lastGraphData = graphData;

    postMessage({ type: 'STATUS', value: 'READY' });
  } catch (error: any) {
    postMessage({ type: 'ERROR', error: error ? (error.message || String(error)) : 'Unknown error' });
  }
}

self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'INITIALIZE':
      initializeSimulation(payload.hex, payload.graphData);
      break;

    case 'START':
      if (simulationLoopTimer) clearTimeout(simulationLoopTimer);
      isRunning = true;
      lastTickTime = performance.now();
      simulationLoop();
      postMessage({ type: 'STATUS', value: 'RUNNING' });
      break;

    case 'PAUSE':
      isRunning = false;
      if (simulationLoopTimer) {
        clearTimeout(simulationLoopTimer);
        simulationLoopTimer = null;
      }
      postMessage({ type: 'STATUS', value: 'PAUSED' });
      break;

    case 'STOP':
      stopSimulation();
      postMessage({ type: 'STATUS', value: 'IDLE' });
      break;

    case 'RESET':
      stopSimulation();
      if (lastHex && lastGraphData) {
        initializeSimulation(lastHex, lastGraphData);
      }
      break;

    case 'EXTERNAL_INPUT':
      if (circuitGraph) {
        // circuitGraph.updateExternalInput(payload.componentId, payload.pinId, payload.value);
        // circuitGraph.repropagate();
      }
      // Handle ADC input
      if (payload.pinId && payload.pinId.startsWith('A')) {
        const channel = parseInt(payload.pinId.substring(1), 10);
        if (!isNaN(channel)) {
          setAnalogInputVoltage(channel, payload.value);
        }
      }
      break;

    case 'SERIAL_INPUT':
      if (avrRunner) {
        for (let i = 0; i < payload.text.length; i++) {
          avrRunner.usart.writeByte(payload.text.charCodeAt(i));
        }
      }
      break;
  }
};
