import { useSimulationStore } from '../store/simulationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import toast from 'react-hot-toast';

class SimulationManager {
  private static instance: SimulationManager;
  private worker: Worker | null = null;
  public initialized: boolean = false;
  private shownWarnings: Set<string> = new Set();
  
  private pendingUpdates: Record<string, any> = {};
  private pendingPinVoltages: Record<string, number> = {};
  private rafId: number | null = null;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): SimulationManager {
    if (!SimulationManager.instance) {
      SimulationManager.instance = new SimulationManager();
    }
    return SimulationManager.instance;
  }

  private initWorker() {
    this.worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });

    // ADD THIS LINE:
    (window as any).__simWorker = this.worker;

    window.addEventListener('EXTERNAL_INPUT', ((e: CustomEvent) => {
      const detail = e.detail;
      
      // If we got a raw button press event without a pinId
      if (detail.state !== undefined && !detail.pinId) {
        const components = useWorkspaceStore.getState().components;
        const component = components.find(c => c.id === detail.componentId);
        
        if (component && component.type === 'PUSH_BUTTON') {
          // Send 0 for pressed (LOW), 1 for released (HIGH)
          const value = detail.state === 'pressed' ? 0 : 1;
          // Use PIN_1A as the default input side of the button
          const pinId = 'PIN_1A'; 
          this.sendExternalInput(detail.componentId, pinId, value);
          return;
        }
      }
      
      // Otherwise, forward as normal
      this.worker?.postMessage({ type: 'EXTERNAL_INPUT', payload: detail });
    }) as EventListener);

    this.worker.onmessage = (e: MessageEvent) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (e: ErrorEvent) => {
      console.error('FULL WORKER ERROR:', e);
      const store = useSimulationStore.getState();
      if (store.setStatus) store.setStatus('ERROR');

      let errMsg = 'Unknown Worker Error';
      if (e.message) errMsg = e.message;
      else if (e.error && e.error.message) errMsg = e.error.message;

      if (store.setErrorMessage) store.setErrorMessage(errMsg);
      toast.error(`Worker crash: ${errMsg}`);
    };
  }

  private handleMessage(eventData: any) {
    const type = eventData.type;
    
    // Ignore messages (except STATUS) if simulation is stopped to prevent race conditions
    if (!this.initialized && type !== 'STATUS') return;

    const store = useSimulationStore.getState();
    // Extract payload carefully regardless of whether it's nested or not
    const payload = eventData.payload || eventData;

    switch (type) {
      case 'PIN_CHANGE':
        if (typeof store.setPinVoltage === 'function') {
          let compId = payload.componentId;
          if (compId === 'arduino-uno' || compId === 'esp32') {
            const mcu = useWorkspaceStore.getState().components.find(
              c => (compId === 'esp32' ? c.type === 'ESP32_DEVKIT' : c.type === 'ARDUINO_UNO') ||
                   c.type === 'ESP32_DEVKIT' || c.type === 'ARDUINO_UNO'
            );
            if (mcu) compId = mcu.id;
          }
          this.pendingPinVoltages[`${compId}-${payload.pinId}`] = payload.voltage;
          this.scheduleFlush();
        }
        break;

      case 'BATCH_UPDATE':
        if (payload.updates) {
          // Merge updates deeply
          for (const [compId, update] of Object.entries(payload.updates)) {
            this.pendingUpdates[compId] = { ...this.pendingUpdates[compId], ...(update as object) };
          }
          this.scheduleFlush();
        }
        break;
      case 'SERIAL_OUTPUT':
        if (store.addSerialLine && payload.text) {
          store.addSerialLine({
            id: crypto.randomUUID(),
            text: payload.text,
            timestamp: Date.now(),
            type: 'output'
          });
        }
        break;

      case 'STATUS':
        if (store.setStatus) {
          store.setStatus(payload.value);
        }
        break;

      case 'ERROR':
        if (store.setStatus) store.setStatus('ERROR');
        if (store.setErrorMessage) store.setErrorMessage(payload.error);
        toast.error(`Simulation Error: ${payload.error}`);
        break;

      case 'WARNING':
        if (!this.shownWarnings.has(payload.text)) {
          this.shownWarnings.add(payload.text);
          if (store.addRuntimeWarning) {
            store.addRuntimeWarning(payload.text);
          }
          toast(`Runtime Warning: ${payload.text}`, {
            icon: '⚠️',
            style: { border: '1px solid #f59e0b', padding: '16px', color: '#fcd34d' }
          });
        }
        break;

      case 'ULTRASONIC_ECHO':
        // Store the simulated distance so the UI can display it
        if (store.updateComponentState) {
          store.updateComponentState(payload.sensorId, {
            distanceCm: payload.distanceCm,
            durationUs: payload.durationUs,
            isActive: true
          });
        }
        break;
    }
  }

  private scheduleFlush() {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.flushUpdates());
    }
  }

  private flushUpdates() {
    this.rafId = null;
    const store = useSimulationStore.getState();
    
    // Batch component states
    if (Object.keys(this.pendingUpdates).length > 0 && store.batchUpdateComponentStates) {
      store.batchUpdateComponentStates(this.pendingUpdates);
      this.pendingUpdates = {};
    }
    
    // Batch pin voltages
    if (Object.keys(this.pendingPinVoltages).length > 0 && typeof store.setPinVoltage === 'function') {
      for (const [pinKey, voltage] of Object.entries(this.pendingPinVoltages)) {
        store.setPinVoltage(pinKey, voltage);
      }
      this.pendingPinVoltages = {};
    }
  }

  public initialize(hex: string, serializedGraph: any, code?: string) {
    const components = useWorkspaceStore.getState().components;
    const hasEsp32 = components.some(c => c.type === 'ESP32_DEVKIT');
    const boardType = hasEsp32 ? 'ESP32_DEVKIT' : 'ARDUINO_UNO';

    this.worker?.postMessage({
      type: 'INITIALIZE',
      payload: {
        hex,
        graphData: serializedGraph,
        code: code || '',
        boardType
      }
    });
    this.initialized = true;
  }

  public start() {
    this.worker?.postMessage({ type: 'START' });
  }

  public pause() {
    this.worker?.postMessage({ type: 'PAUSE' });
  }

  public stop() {
    this.worker?.postMessage({ type: 'STOP' });
    this.initialized = false;
    this.shownWarnings.clear();
    this.pendingUpdates = {};
    this.pendingPinVoltages = {};
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    useSimulationStore.getState().resetSimulation();
  }

  public reset() {
    this.worker?.postMessage({ type: 'RESET' });
    this.shownWarnings.clear();
  }

  public sendExternalInput(componentId: string, pinId: string, value: number | boolean) {
    this.worker?.postMessage({ type: 'EXTERNAL_INPUT', payload: { componentId, pinId, value } });
  }

  public sendSerialInput(text: string) {
    this.worker?.postMessage({ type: 'SERIAL_INPUT', payload: { text } });
  }

  public updateComponentProperties(componentId: string, properties: any) {
    this.worker?.postMessage({ type: 'UPDATE_PROPERTIES', payload: { componentId, properties } });
  }

  public setSimulatedDistance(distanceCm: number) {
    this.worker?.postMessage({
      type: 'SET_SENSOR_DISTANCE',
      payload: { distanceCm }
    });
  }

  public setSensorValues(temperature: number, humidity: number) {
    this.worker?.postMessage({
      type: 'SET_SENSOR_VALUES',
      payload: { temperature, humidity }
    });
  }

  public destroy() {
    this.stop();
    this.worker?.terminate();
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}

export const simulationManager = SimulationManager.getInstance();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    simulationManager.destroy();
  });
}
