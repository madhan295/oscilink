let avrRunner = null;
let circuitGraph = null;
let simulationLoopTimer = null;
let isRunning = false;
let serialBuffer = "";
let pendingUpdates = {};

let lastHex = null;
let lastGraphData = null;
let lastTickTime = 0;

function parseIntelHex(hexString) {
  const flash = new Uint8Array(32768);
  flash.fill(0xFF); // Unprogrammed flash is typically 0xFF
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

    if (recordType === 0) { // Data
      for (let j = 0; j < byteCount; j++) {
        const dataByte = parseInt(line.substring(9 + j * 2, 11 + j * 2), 16);
        if (address + j < flash.length) {
          flash[address + j] = dataByte;
        }
      }
    } else if (recordType === 1) { // EOF
      break;
    }
  }

  return flash;
}

function queueComponentUpdate(componentId, state) {
  pendingUpdates[componentId] = { ...pendingUpdates[componentId], ...state };
}

function flushUpdates() {
  if (Object.keys(pendingUpdates).length > 0) {
    postMessage({ type: 'BATCH_UPDATE', updates: pendingUpdates });
    pendingUpdates = {};
  }
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

  // 16MHz clock * 10% = 1.6MHz = 1,600,000 cycles / second
  // elapsed is in ms, so cycles = elapsed * 1600
  let cyclesToRun = Math.floor(elapsed * 1600);

  // Cap at 5000 cycles per tick to prevent tab freezing
  if (cyclesToRun > 5000) {
    cyclesToRun = 5000;
  }

  if (avrRunner) {
    // avrRunner.execute(cyclesToRun); // Implemented in next prompt
  }

  // Process any pending state updates
  flushUpdates();

  simulationLoopTimer = setTimeout(simulationLoop, 16);
}

function initializeSimulation(hex, graphData) {
  try {
    const flashData = parseIntelHex(hex);

    // TODO: Create AVR runner (Implemented in next prompt)
    // avrRunner = new AvrRunner(flashData);

    // TODO: Build circuit graph from topology data
    // circuitGraph = buildGraph(graphData);

    // TODO: Set up GPIO listeners
    // TODO: Set up serial UART listener

    lastHex = hex;
    lastGraphData = graphData;

    postMessage({ type: 'STATUS', value: 'READY' });
  } catch (error) {
    postMessage({ type: 'ERROR', error: error.message });
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
      // Receive componentId, pinId, value
      if (circuitGraph) {
        // Update the circuit graph for this external change
        // circuitGraph.updateExternalInput(payload.componentId, payload.pinId, payload.value);
        // Repropagate signals from the changed point
        // circuitGraph.repropagate();
      }
      break;

    case 'SERIAL_INPUT':
      // Receive text string
      if (avrRunner) {
        // Write each character byte to the AVR UART receive buffer
        for (let i = 0; i < payload.text.length; i++) {
          // avrRunner.writeUart(payload.text.charCodeAt(i));
        }
      }
      break;
  }
};


