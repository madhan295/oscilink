import { useSimulationStore } from '../store/simulationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import toast from 'react-hot-toast';

class SimulationManager {
  private static instance: SimulationManager;
  private worker: Worker | null = null;
  public initialized: boolean = false;
  private shownWarnings: Set<string> = new Set();

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
      this.worker?.postMessage({ type: 'EXTERNAL_INPUT', payload: e.detail });
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
    const store = useSimulationStore.getState();
    const type = eventData.type;
    // Extract payload carefully regardless of whether it's nested or not
    const payload = eventData.payload || eventData;

    switch (type) {
      case 'PIN_CHANGE':
        if (store.setPinVoltage) {
          let compId = payload.componentId;
          if (compId === 'arduino-uno') {
            const arduino = useWorkspaceStore.getState().components.find(c => c.type === 'ARDUINO_UNO');
            if (arduino) compId = arduino.id;
          }
          store.setPinVoltage(`${compId}-${payload.pinId}`, payload.voltage);
        }
        break;

      case 'BATCH_UPDATE':
        if (store.batchUpdateComponentStates && payload.updates) {
          store.batchUpdateComponentStates(payload.updates);
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
      case 'PIN_CHANGE':
        if (store.setPinVoltage) {
          let compId = payload.componentId;
          if (compId === 'arduino-uno') {
            const arduino = useWorkspaceStore.getState().components.find(c => c.type === 'ARDUINO_UNO');
            if (arduino) compId = arduino.id;
          }
          store.setPinVoltage(`${compId}-${payload.pinId}`, payload.voltage);
        }
        break;
    }
  }

  public initialize(hex: string, serializedGraph: any) {
    this.worker?.postMessage({ type: 'INITIALIZE', payload: { hex, graphData: serializedGraph } });
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
  }
}

export const simulationManager = SimulationManager.getInstance();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    simulationManager.destroy();
  });
}
