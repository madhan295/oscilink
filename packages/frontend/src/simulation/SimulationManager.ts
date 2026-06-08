import { useSimulationStore } from '../store/simulationStore';
import toast from 'react-hot-toast';

class SimulationManager {
  private static instance: SimulationManager;
  private worker: Worker | null = null;
  public initialized: boolean = false;

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
    this.worker = new Worker('/workers/simulation.worker.js', { type: 'module' });

    // ADD THIS LINE:
    (window as any).__simWorker = this.worker;

    this.worker.onmessage = (e: MessageEvent) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (e: ErrorEvent) => {
      const store = useSimulationStore.getState();
      if (store.setStatus) store.setStatus('ERROR');
      if (store.setErrorMessage) store.setErrorMessage(e.message);
      toast.error(`Worker error: ${e.message}`);
    };
  }

  private handleMessage(data: any) {
    const store = useSimulationStore.getState();
    const { type, ...payload } = data;

    switch (type) {
      case 'BATCH_UPDATE':
        if (store.batchUpdateComponentStates) {
          store.batchUpdateComponentStates(payload.updates);
        }
        break;
      case 'SERIAL_OUTPUT':
        if (store.addSerialLine) {
          store.addSerialLine(payload.text);
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
      case 'PIN_CHANGE':
        if (store.setPinVoltage) {
          store.setPinVoltage(payload.pinId, payload.voltage);
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
  }

  public reset() {
    this.worker?.postMessage({ type: 'RESET' });
  }

  public sendExternalInput(componentId: string, pinId: string, value: number | boolean) {
    this.worker?.postMessage({ type: 'EXTERNAL_INPUT', payload: { componentId, pinId, value } });
  }

  public sendSerialInput(text: string) {
    this.worker?.postMessage({ type: 'SERIAL_INPUT', payload: { text } });
  }
}

export const simulationManager = SimulationManager.getInstance();
