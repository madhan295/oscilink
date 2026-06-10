import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { CircuitComponent } from '../../types/components';

export const PropertiesPanel: React.FC<{ rightPanelOpen?: boolean }> = ({ rightPanelOpen }) => {
  const selectedComponentIds = useWorkspaceStore((state: any) => state.selectedComponentIds);
  const components = useWorkspaceStore((state: any) => state.components);
  const updateComponentProperties = useWorkspaceStore((state: any) => state.updateComponentProperties);

  const [localName, setLocalName] = useState('');
  const [localResistanceValue, setLocalResistanceValue] = useState('');
  const [resistanceUnit, setResistanceUnit] = useState(1);

  // Derive the selected component
  const selectedComponent = selectedComponentIds.length === 1 
    ? components.find((c: CircuitComponent) => c.id === selectedComponentIds[0]) 
    : null;

  const [lastComponentId, setLastComponentId] = useState<string | null>(null);
  const [ledColor, setLedColor] = useState('RED');

  useEffect(() => {
    if (selectedComponent) {
      // Only auto-format the unit when selecting a newly clicked component
      if (selectedComponent.id !== lastComponentId) {
        setLastComponentId(selectedComponent.id);
        setLocalName(String(selectedComponent.properties?.name || selectedComponent.id));
        
        if (selectedComponent.type === 'RESISTOR') {
          const rawRes = Number(selectedComponent.properties?.resistance || 220);
          if (rawRes >= 1e9) {
            setLocalResistanceValue(String(rawRes / 1e9));
            setResistanceUnit(1e9);
          } else if (rawRes >= 1e6) {
            setLocalResistanceValue(String(rawRes / 1e6));
            setResistanceUnit(1e6);
          } else if (rawRes >= 1e3) {
            setLocalResistanceValue(String(rawRes / 1e3));
            setResistanceUnit(1e3);
          } else if (rawRes >= 1) {
            setLocalResistanceValue(String(rawRes));
            setResistanceUnit(1);
          } else if (rawRes >= 1e-3) {
            setLocalResistanceValue(String(rawRes / 1e-3));
            setResistanceUnit(1e-3);
          } else if (rawRes >= 1e-6) {
            setLocalResistanceValue(String(rawRes / 1e-6));
            setResistanceUnit(1e-6);
          } else if (rawRes >= 1e-9) {
            setLocalResistanceValue(String(rawRes / 1e-9));
            setResistanceUnit(1e-9);
          } else if (rawRes >= 1e-12) {
            setLocalResistanceValue(String(rawRes / 1e-12));
            setResistanceUnit(1e-12);
          } else {
            setLocalResistanceValue(String(rawRes));
            setResistanceUnit(1);
          }
        } else if (selectedComponent.type === 'LED') {
          setLedColor(String(selectedComponent.properties?.color || 'RED').toUpperCase());
        }
      } else {
        // If the same component is selected, just ensure the local value syncs 
        // with the global value WITHOUT overriding the user's chosen unit!
        if (selectedComponent.type === 'RESISTOR') {
          const rawRes = Number(selectedComponent.properties?.resistance || 220);
          // Only update local input if it doesn't match the current raw resistance
          const expectedRaw = parseFloat(localResistanceValue) * resistanceUnit;
          if (!isNaN(expectedRaw) && Math.abs(expectedRaw - rawRes) > 1e-15) {
            setLocalResistanceValue(String(rawRes / resistanceUnit));
          }
        } else if (selectedComponent.type === 'LED') {
          setLedColor(String(selectedComponent.properties?.color || 'RED').toUpperCase());
        }
      }
    } else {
      setLastComponentId(null);
    }
  }, [selectedComponent, lastComponentId, localResistanceValue, resistanceUnit]);

  if (!selectedComponent) return null;

  // Only show for supported components
  if (selectedComponent.type !== 'RESISTOR' && selectedComponent.type !== 'LED') return null;

  const handleResistanceChange = (valStr: string, unit: number) => {
    setLocalResistanceValue(valStr);
    setResistanceUnit(unit);
    
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      updateComponentProperties(selectedComponent.id, {
        resistance: num * unit
      });
    }
  };

  const LED_COLORS = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'WHITE'];
  const colorHexMap: Record<string, string> = {
    RED: '#ef4444',
    GREEN: '#22c55e',
    BLUE: '#3b82f6',
    YELLOW: '#eab308',
    WHITE: '#ffffff'
  };

  return (
    <div 
      className="absolute top-4 z-50 bg-surface border border-border rounded-lg shadow-2xl w-64 overflow-hidden pointer-events-auto transition-all duration-300 ease-in-out"
      style={{ right: rightPanelOpen ? '466px' : '16px' }}
    >
      {/* Header */}
      <div className="bg-surface border-b border-border px-3 py-2.5 flex justify-between items-center">
        <span className="font-semibold text-sm text-text">
          {selectedComponent.type === 'RESISTOR' ? 'Resistor' : 'LED'} Properties
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Name Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Name</label>
          <input
            type="text"
            className="w-full bg-surface-hover border border-border rounded px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary transition-colors"
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
              updateComponentProperties(selectedComponent.id, { name: e.target.value });
            }}
            placeholder={selectedComponent.type === 'RESISTOR' ? 'e.g. R1' : 'e.g. LED1'}
          />
        </div>

        {/* Resistor Specific Fields */}
        {selectedComponent.type === 'RESISTOR' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Resistance</label>
            <div className="flex rounded border border-border overflow-hidden focus-within:border-primary transition-colors bg-surface-hover">
              <input
                type="number"
                className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 text-sm text-text outline-none border-r border-border"
                value={localResistanceValue}
                onChange={(e) => handleResistanceChange(e.target.value, resistanceUnit)}
                min="0"
                step="any"
              />
              <select 
                className="w-16 bg-transparent outline-none text-sm px-1 text-text cursor-pointer hover:bg-surface transition-colors"
                value={resistanceUnit}
                onChange={(e) => handleResistanceChange(localResistanceValue, Number(e.target.value))}
              >
                <option value={1e-12}>pΩ</option>
                <option value={1e-9}>nΩ</option>
                <option value={1e-6}>µΩ</option>
                <option value={1e-3}>mΩ</option>
                <option value={1}>Ω</option>
                <option value={1e3}>kΩ</option>
                <option value={1e6}>MΩ</option>
                <option value={1e9}>GΩ</option>
              </select>
            </div>
          </div>
        )}

        {/* LED Specific Fields */}
        {selectedComponent.type === 'LED' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Color</label>
            <div className="flex gap-2 mt-1">
              {LED_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setLedColor(color);
                    updateComponentProperties(selectedComponent.id, { color });
                  }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                    ledColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: colorHexMap[color], border: color === 'WHITE' ? '1px solid #404040' : 'none' }}
                  title={`${color} LED`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
