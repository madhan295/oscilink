import { simulationManager } from '../simulation/SimulationManager';
import { useSimulationStore } from '../store/simulationStore';

export function useSimulation() {
  const status = useSimulationStore((state) => state.status);
  const errorMessage = useSimulationStore((state) => state.errorMessage);

  const initialize = (hex: string, serializedGraph: any, code?: string) => {
    simulationManager.initialize(hex, serializedGraph, code);
  };

  const start = () => {
    simulationManager.start();
  };

  const pause = () => {
    simulationManager.pause();
  };

  const stop = () => {
    simulationManager.stop();
  };

  const reset = () => {
    simulationManager.reset();
  };

  const sendExternalInput = (componentId: string, pinId: string, value: number | boolean) => {
    simulationManager.sendExternalInput(componentId, pinId, value);
  };

  const sendSerialInput = (text: string) => {
    simulationManager.sendSerialInput(text);
  };

  return {
    status,
    errorMessage,
    initialize,
    start,
    pause,
    stop,
    reset,
    sendExternalInput,
    sendSerialInput
  };
}
