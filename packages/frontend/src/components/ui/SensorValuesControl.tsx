import React, { useState, useEffect } from 'react';
import { Thermometer } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSimulationStore } from '../../store/simulationStore';
import { simulationManager } from '../../simulation/SimulationManager';

export const SensorValuesControl: React.FC = () => {
  const selectedComponentIds = useWorkspaceStore(state => state.selectedComponentIds);
  const components = useWorkspaceStore(state => state.components);
  const simulationStatus = useSimulationStore(state => state.status);
  
  const [temperature, setTemperature] = useState(25.0);
  const [humidity, setHumidity] = useState(60);

  // Check if a TEMPERATURE_SENSOR is selected
  const selectedSensor = components.find(
    c => selectedComponentIds.includes(c.id) && c.type === 'TEMPERATURE_SENSOR'
  );

  useEffect(() => {
    if (simulationStatus === 'RUNNING') {
      simulationManager.setSensorValues(temperature, humidity);
    }
  }, [temperature, humidity, simulationStatus]);

  if (!selectedSensor) return null;

  return (
    <div className="absolute top-20 left-4 z-40 bg-surface border border-border rounded-lg shadow-xl w-72 pointer-events-auto">
      <div className="p-3 border-b border-border bg-surface-hover rounded-t-lg flex items-center gap-2">
        <Thermometer size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-text">DHT11 Sensor</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {simulationStatus !== 'RUNNING' ? (
          <div className="text-sm text-text-muted text-center py-2">
            Start simulation to use sensor controls
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Temperature</span>
                <span className="text-text font-medium">{temperature.toFixed(1)}°C</span>
              </div>
              <input 
                type="range" 
                min="-10" 
                max="80" 
                step="0.5" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Humidity</span>
                <span className="text-text font-medium">{humidity.toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="1" 
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
