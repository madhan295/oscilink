import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SimulationStatus,
  ComponentState,
  SerialLine,
  CircuitError
} from '../types/simulation';

interface SimulationState {
  status: SimulationStatus;
  componentStates: Record<string, ComponentState>;
  serialOutput: SerialLine[];
  pinVoltages: Record<string, number>;
  circuitErrors: CircuitError[];
  runtimeWarnings: string[];
  errorMessage: string | null;
}

interface SimulationActions {
  setStatus: (status: SimulationStatus) => void;
  updateComponentState: (id: string, state: Partial<ComponentState>) => void;
  batchUpdateComponentStates: (states: Record<string, Partial<ComponentState>>) => void;
  addSerialLine: (line: SerialLine) => void;
  clearSerial: () => void;
  setPinVoltage: (pinId: string, voltage: number) => void;
  setCircuitErrors: (errors: CircuitError[]) => void;
  addRuntimeWarning: (warning: string) => void;
  clearRuntimeWarnings: () => void;
  setErrorMessage: (message: string | null) => void;
  resetSimulation: () => void;
}

type SimulationStore = SimulationState & SimulationActions;

export const useSimulationStore = create<SimulationStore>()(
  devtools(
    immer((set) => ({
      status: 'IDLE',
      componentStates: {},
      serialOutput: [],
      pinVoltages: {},
      circuitErrors: [],
      runtimeWarnings: [],
      errorMessage: null,

      setStatus: (status) => set((state) => { state.status = status; }),
      
      updateComponentState: (id, compState) => set((state) => {
        if (!state.componentStates[id]) {
          state.componentStates[id] = {} as ComponentState;
        }
        state.componentStates[id] = { ...state.componentStates[id], ...compState } as ComponentState;
      }),
      
      batchUpdateComponentStates: (states) => set((state) => {
        Object.keys(states).forEach((id) => {
          if (!state.componentStates[id]) {
            state.componentStates[id] = {} as ComponentState;
          }
          state.componentStates[id] = { ...state.componentStates[id], ...states[id] } as ComponentState;
        });
      }),
      
      addSerialLine: (line) => set((state) => { state.serialOutput.push(line); }),
      
      clearSerial: () => set((state) => { state.serialOutput = []; }),
      
      setPinVoltage: (pinId, voltage) => set((state) => { state.pinVoltages[pinId] = voltage; }),
      
      setCircuitErrors: (errors) => set((state) => { state.circuitErrors = errors; }),
      
      addRuntimeWarning: (warning) => set((state) => { state.runtimeWarnings.push(warning); }),
      
      clearRuntimeWarnings: () => set((state) => { state.runtimeWarnings = []; }),
      
      setErrorMessage: (message) => set((state) => { state.errorMessage = message; }),
      
      resetSimulation: () => set((state) => {
        state.componentStates = {};
        state.serialOutput = [];
        state.pinVoltages = {};
        state.runtimeWarnings = [];
        state.errorMessage = null;
      })
    })),
    { name: 'simulation-store', enabled: (import.meta as any).env ? (import.meta as any).env.DEV : true }
  )
);

// Expose store to window for debugging and testing
if (typeof window !== 'undefined') {
  (window as any).__simulationStore = useSimulationStore;
}
