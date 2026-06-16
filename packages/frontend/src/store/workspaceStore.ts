import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import {
  CircuitComponent,
  Wire,
  Point,
  PinRef,
  WireColor,
  ComponentProperties
} from '../types/components';
import { SerializedCircuitGraph } from '../types/simulation';
import { CircuitGraph } from '../simulation/engine/CircuitGraph';
import { getAbsolutePinPosition } from '../utils/geometry';
import { validateCircuit } from '../utils/circuitValidator';
import { useSimulationStore } from './simulationStore';
import toast from 'react-hot-toast';

interface WorkspaceSnapshot {
  components: CircuitComponent[];
  wires: Wire[];
}

interface WorkspaceState {
  components: CircuitComponent[];
  wires: Wire[];
  selectedComponentIds: string[];
  selectedWireIds: string[];
  viewport: { scale: number; x: number; y: number };
  isDrawingWire: boolean;
  wireDrawingFrom: PinRef | null;
  mousePosition: Point;
  history: WorkspaceSnapshot[];
  historyIndex: number;
  focusTrigger: { ids: string[]; timestamp: number } | null;
  panMode: boolean;
}

interface WorkspaceActions {
  addComponent: (component: CircuitComponent) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, position: Point) => void;
  updateComponentProperties: (id: string, properties: Partial<ComponentProperties>) => void;
  updateComponentRotation: (id: string, rotation: number) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: string) => void;
  updateWireColor: (id: string, color: WireColor) => void;
  selectComponent: (id: string, multiSelect: boolean) => void;
  selectWire: (id: string, multiSelect: boolean) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  setViewport: (viewport: { scale: number; x: number; y: number }) => void;
  startWireDrawing: (pin: PinRef) => void;
  finishWireDrawing: (target: PinRef, points: number[]) => void;
  cancelWireDrawing: () => void;
  setMousePosition: (pos: Point) => void;
  pushHistory: () => void;
  clearHistory: () => void;
  triggerFocus: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  loadProject: (components: CircuitComponent[], wires: Wire[], viewport: { scale: number; x: number; y: number }) => void;
  buildCircuitGraph: () => SerializedCircuitGraph;
  setPanMode: (mode: boolean) => void;
  validateCircuit: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;



export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    immer((set, get) => ({
      components: [],
      wires: [],
      selectedComponentIds: [],
      selectedWireIds: [],
      viewport: { scale: 1, x: 0, y: 0 },
      isDrawingWire: false,
      wireDrawingFrom: null,
      mousePosition: { x: 0, y: 0 },
      history: [{ components: [], wires: [] }],
      historyIndex: 0,
      focusTrigger: null,
      panMode: false,

      pushHistory: () => {
        set((state) => {
          const snapshot = {
            components: JSON.parse(JSON.stringify(state.components)),
            wires: JSON.parse(JSON.stringify(state.wires))
          };
          
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }
          
          state.history.push(snapshot);
          
          if (state.history.length > 50) {
            state.history.shift();
          } else {
            state.historyIndex++;
          }
        });
      },

      clearHistory: () => set({
        history: [],
        historyIndex: -1
      }),

      triggerFocus: (ids: string[]) => set({
        focusTrigger: { ids, timestamp: Date.now() }
      }),

      addComponent: (component) => {
        set((state) => {
          state.components.push(component);
        });
        get().pushHistory();
      },

      removeComponent: (id) => {
        set((state) => {
          state.components = state.components.filter(c => c.id !== id);
          state.wires = state.wires.filter(w => w.from.componentId !== id && w.to.componentId !== id);
        });
        get().pushHistory();
      },

      updateComponentPosition: (id, position) => {
        set((state) => {
          const comp = state.components.find(c => c.id === id);
          if (comp) {
            comp.position = position;
            
            state.wires.forEach(wire => {
              if (wire.from.componentId === id) {
                const pin = comp.pins[wire.from.pinId];
                if (pin) {
                  const absPos = getAbsolutePinPosition(comp, pin);
                  wire.points[0] = absPos.x;
                  wire.points[1] = absPos.y;
                }
              }
              if (wire.to.componentId === id) {
                const pin = comp.pins[wire.to.pinId];
                if (pin) {
                  const len = wire.points.length;
                  const absPos = getAbsolutePinPosition(comp, pin);
                  wire.points[len - 2] = absPos.x;
                  wire.points[len - 1] = absPos.y;
                }
              }
            });
          }
        });
      },

      updateComponentProperties: (id, properties) => {
        set((state) => {
          const comp = state.components.find(c => c.id === id);
          if (comp) {
            const filtered = Object.fromEntries(
              Object.entries(properties).filter(([, v]) => v !== undefined)
            ) as ComponentProperties;
            comp.properties = { ...comp.properties, ...filtered };
          }
        });
      },

      updateComponentRotation: (id, rotation) => {
        set((state) => {
          const comp = state.components.find(c => c.id === id);
          if (comp) comp.rotation = rotation;
        });
      },

      addWire: (wire) => {
        set((state) => {
          const fromComp = state.components.find(c => c.id === wire.from.componentId);
          const toComp = state.components.find(c => c.id === wire.to.componentId);
          

          if (fromComp?.pins[wire.from.pinId]) {
            fromComp.pins[wire.from.pinId].connectedWireIds.push(wire.id);
          }
          if (toComp?.pins[wire.to.pinId]) {
            toComp.pins[wire.to.pinId].connectedWireIds.push(wire.id);
          }
          
          state.wires.push(wire);
        });
        get().pushHistory();
      },

      removeWire: (id) => {
        set((state) => {
          const wire = state.wires.find(w => w.id === id);
          if (wire) {
            const fromComp = state.components.find(c => c.id === wire.from.componentId);
            const toComp = state.components.find(c => c.id === wire.to.componentId);
            
            if (fromComp?.pins[wire.from.pinId]) {
              fromComp.pins[wire.from.pinId].connectedWireIds = fromComp.pins[wire.from.pinId].connectedWireIds.filter(wid => wid !== id);
            }
            if (toComp?.pins[wire.to.pinId]) {
              toComp.pins[wire.to.pinId].connectedWireIds = toComp.pins[wire.to.pinId].connectedWireIds.filter(wid => wid !== id);
            }
          }
          state.wires = state.wires.filter(w => w.id !== id);
        });
        get().pushHistory();
      },

      updateWireColor: (id, color) => {
        set((state) => {
          const wire = state.wires.find(w => w.id === id);
          if (wire) {
            wire.color = color;
          }
        });
        get().pushHistory();
      },

      selectComponent: (id, multiSelect) => {
        set((state) => {
          if (!multiSelect) {
            state.selectedComponentIds = [];
            state.selectedWireIds = [];
          }
          if (!state.selectedComponentIds.includes(id)) {
            state.selectedComponentIds.push(id);
          }
        });
      },

      selectWire: (id, multiSelect) => {
        set((state) => {
          if (!multiSelect) {
            state.selectedComponentIds = [];
            state.selectedWireIds = [];
          }
          if (!state.selectedWireIds.includes(id)) {
            state.selectedWireIds.push(id);
          }
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedComponentIds = [];
          state.selectedWireIds = [];
        });
      },

      deleteSelected: () => {
        set((state) => {
          for (const id of state.selectedWireIds) {
            const wire = state.wires.find(w => w.id === id);
            if (wire) {
               const fromComp = state.components.find(c => c.id === wire.from.componentId);
               const toComp = state.components.find(c => c.id === wire.to.componentId);
               if (fromComp?.pins[wire.from.pinId]) {
                 fromComp.pins[wire.from.pinId].connectedWireIds = fromComp.pins[wire.from.pinId].connectedWireIds.filter(wid => wid !== id);
               }
               if (toComp?.pins[wire.to.pinId]) {
                 toComp.pins[wire.to.pinId].connectedWireIds = toComp.pins[wire.to.pinId].connectedWireIds.filter(wid => wid !== id);
               }
            }
          }
          state.wires = state.wires.filter(w => !state.selectedWireIds.includes(w.id));
          
          state.components = state.components.filter(c => !state.selectedComponentIds.includes(c.id));
          state.wires = state.wires.filter(w => !state.selectedComponentIds.includes(w.from.componentId) && !state.selectedComponentIds.includes(w.to.componentId));
          
          state.selectedComponentIds = [];
          state.selectedWireIds = [];
        });
        get().pushHistory();
      },

      setViewport: (viewport) => set((state) => { state.viewport = viewport; }),

      duplicateSelected: () => {
        set((state) => {
          const newIds: string[] = [];
          const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
          if (selected.length > 0) {
            state.selectedComponentIds = [];
            state.selectedWireIds = [];
            selected.forEach(comp => {
              const newComp = JSON.parse(JSON.stringify(comp));
              newComp.id = uuidv4();
              newComp.position.x += 24;
              newComp.position.y += 24;
              Object.values(newComp.pins).forEach((pin: any) => {
                pin.connectedWireIds = [];
              });
              state.components.push(newComp);
              newIds.push(newComp.id);
            });
            state.selectedComponentIds = newIds;
          }
        });
        get().pushHistory();
      },

      bringForward: () => {
        set((state) => {
          const indices = state.selectedComponentIds
            .map(id => state.components.findIndex(c => c.id === id))
            .filter(idx => idx !== -1)
            .sort((a, b) => b - a);

          for (const idx of indices) {
            if (idx < state.components.length - 1) {
              const temp = state.components[idx];
              state.components[idx] = state.components[idx + 1];
              state.components[idx + 1] = temp;
            }
          }
        });
        get().pushHistory();
      },

      sendBackward: () => {
        set((state) => {
          const indices = state.selectedComponentIds
            .map(id => state.components.findIndex(c => c.id === id))
            .filter(idx => idx !== -1)
            .sort((a, b) => a - b);

          for (const idx of indices) {
            if (idx > 0) {
              const temp = state.components[idx];
              state.components[idx] = state.components[idx - 1];
              state.components[idx - 1] = temp;
            }
          }
        });
        get().pushHistory();
      },

      startWireDrawing: (pin) => set((state) => {
        state.isDrawingWire = true;
        state.wireDrawingFrom = pin;
      }),

      finishWireDrawing: (target, points) => {
        const state = get();
        if (!state.wireDrawingFrom) return;
        

        const newWire: Wire = {
          id: uuidv4(),
          from: state.wireDrawingFrom,
          to: target,
          points,
          color: 'blue',
          isSelected: false,
          isError: false
        };
        
        get().addWire(newWire);
        get().cancelWireDrawing();
      },

      cancelWireDrawing: () => set((state) => {
        state.isDrawingWire = false;
        state.wireDrawingFrom = null;
      }),

      setMousePosition: (pos) => set((state) => {
        state.mousePosition = pos;
      }),

      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const snapshot = state.history[state.historyIndex];
          state.components = JSON.parse(JSON.stringify(snapshot.components));
          state.wires = JSON.parse(JSON.stringify(snapshot.wires));
        }
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const snapshot = state.history[state.historyIndex];
          state.components = JSON.parse(JSON.stringify(snapshot.components));
          state.wires = JSON.parse(JSON.stringify(snapshot.wires));
        }
      }),

      loadProject: (components, wires, viewport) => set((state) => {
        state.components = components;
        state.wires = wires;
        state.viewport = viewport;
        state.history = [];
        state.historyIndex = -1;
        state.selectedComponentIds = [];
        state.selectedWireIds = [];
      }),

      buildCircuitGraph: () => {
        const state = get();
        const graph = new CircuitGraph();
        
        const mappedComponents = state.components.map(comp => ({
          id: comp.id,
          type: comp.type,
          properties: comp.properties,
          pins: Object.values(comp.pins).map(pin => ({
            id: pin.id,
            type: pin.type,
            direction: pin.direction
          }))
        }));

        const mappedWires = state.wires.map(w => ({
          id: w.id,
          fromComponentId: w.from.componentId,
          fromPinId: w.from.pinId,
          toComponentId: w.to.componentId,
          toPinId: w.to.pinId
        }));
        
        graph.buildFromCircuitState(mappedComponents as any, mappedWires);
        return graph.serialize();
      },

      setPanMode: (mode) => set((state) => {
        state.panMode = mode;
      }),

      validateCircuit: () => {
        const state = get();
        const graph = new CircuitGraph();
        
        const mappedComponents = state.components.map(comp => ({
          id: comp.id,
          type: comp.type,
          properties: comp.properties,
          pins: Object.values(comp.pins).map(pin => ({
            id: pin.id,
            type: pin.type,
            direction: pin.direction
          }))
        }));

        const mappedWires = state.wires.map(w => ({
          id: w.id,
          fromComponentId: w.from.componentId,
          fromPinId: w.from.pinId,
          toComponentId: w.to.componentId,
          toPinId: w.to.pinId
        }));
        
        graph.buildFromCircuitState(mappedComponents as any, mappedWires);
        const oldErrors = useSimulationStore.getState().circuitErrors;
        const errors = validateCircuit(state.components, state.wires, graph);
        console.log('[Validator] Executed all rules. Errors found:', errors);
        
        const isRunning = useSimulationStore.getState().status === 'RUNNING';
        
        // Find newly introduced errors by matching the message
        const oldMessages = new Set(oldErrors.map(e => e.message));
        const newErrors = errors.filter(e => !oldMessages.has(e.message));
        
        if (isRunning) {
          newErrors.forEach(err => {
            if (err.severity === 'error') {
              toast.error(err.message, { id: err.message, duration: 5000 });
            } else if (err.severity === 'warning') {
              toast(err.message, { id: err.message, icon: '⚠️', duration: 4000 });
            } else {
              toast(err.message, { id: err.message, icon: 'ℹ️', duration: 3000 });
            }
          });
        }

        useSimulationStore.getState().setCircuitErrors(errors);
      }
    })),
    { name: 'workspace-store', enabled: (import.meta as any).env ? (import.meta as any).env.DEV : true }
  )
);

let validationDebounceTimer: ReturnType<typeof setTimeout>;

useWorkspaceStore.subscribe((state, prevState) => {
  if (state.wires !== prevState.wires || state.components.length !== prevState.components.length) {
    clearTimeout(validationDebounceTimer);
    validationDebounceTimer = setTimeout(() => {
      useWorkspaceStore.getState().validateCircuit();
    }, 400);
  }
});

// Trigger toasts for existing errors when simulation starts
useSimulationStore.subscribe((state, prevState) => {
  if (state.status === 'RUNNING' && prevState.status !== 'RUNNING') {
    state.circuitErrors.forEach(err => {
      if (err.severity === 'error') {
        toast.error(err.message, { id: err.message, duration: 5000 });
      } else if (err.severity === 'warning') {
        toast(err.message, { id: err.message, icon: '⚠️', duration: 4000 });
      } else {
        toast(err.message, { id: err.message, icon: 'ℹ️', duration: 3000 });
      }
    });
  }
});

// --- TEMPORARY DEBUG CODE ---
if (typeof window !== 'undefined') {
  (window as any).__workspaceStore = useWorkspaceStore;
}
// -----------------------------
