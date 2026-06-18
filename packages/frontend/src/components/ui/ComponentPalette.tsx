import React, { useState, useEffect } from 'react';
import {
  Search, ChevronRight, Cpu, Lightbulb,
  Waves, Activity, CircleDot, Speaker, Monitor,
  Thermometer, ToggleLeft, Box, LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { createComponent } from '../../utils/componentFactory';
import { ComponentType } from '../../types/components';

interface ComponentDef {
  type: ComponentType;
  name: string;
  description: string;
  icon: React.FC<any>;
  propertyLabel?: string;
  hasColorSelector?: boolean;
}

interface CategoryDef {
  name: string;
  components: ComponentDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    name: 'Microcontrollers',
    components: [
      { type: 'ARDUINO_UNO', name: 'Arduino Uno', description: 'ATmega328P based microcontroller board', icon: Cpu }
    ]
  },
  {
    name: 'Passive Components',
    components: [
      { type: 'LED', name: 'LED', description: 'Light Emitting Diode', icon: Lightbulb },
      { type: 'RESISTOR', name: 'Resistor', description: 'Current limiting resistor', icon: Activity },
      { type: 'PUSH_BUTTON', name: 'Push Button', description: 'Momentary tactile switch', icon: CircleDot },
      { type: 'POTENTIOMETER', name: 'Potentiometer', description: 'Variable resistor', icon: ToggleLeft }
    ]
  },
  {
    name: 'Output Devices',
    components: [
      { type: 'SERVO_MOTOR', name: 'Servo Motor', description: 'Standard 180° micro servo', icon: Box },
      { type: 'BUZZER', name: 'Buzzer', description: 'Piezoelectric buzzer', icon: Speaker },
      { type: 'LCD_16X2', name: 'LCD 16x2', description: 'Liquid crystal display', icon: Monitor }
    ]
  },
  {
    name: 'Sensors',
    components: [
      { type: 'ULTRASONIC_SENSOR', name: 'Ultrasonic Sensor HC-SR04', description: 'Distance sensor', icon: Waves },
      { type: 'TEMPERATURE_SENSOR', name: 'Temperature Sensor DHT11', description: 'Temp & humidity', icon: Thermometer }
    ]
  },
  {
    name: 'Other',
    components: [
      { type: 'RELAY', name: 'Relay', description: '5V SPDT relay module', icon: ToggleLeft },
      { type: 'BREADBOARD', name: 'Breadboard', description: 'Standard half-size breadboard', icon: LayoutGrid }
    ]
  }
];

export const ComponentPalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    type: ComponentType | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    name: string;
    icon: React.FC<any> | null;
  } | null>(null);

  const toggleCategory = (name: string) => {
    setCollapsedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleMouseDown = (e: React.MouseEvent, type: ComponentType, name: string, icon: React.FC<any>) => {
    e.preventDefault();
    setDragState({
      isDragging: false,
      type,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      name,
      icon
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (!dragState.isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
        setDragState(prev => prev ? { ...prev, isDragging: true, currentX: e.clientX, currentY: e.clientY } : null);
      } else if (dragState.isDragging) {
        setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragState.isDragging && dragState.type) {
        const canvasElement = document.querySelector('main');
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const isOverCanvas = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          );

          if (isOverCanvas) {
            const viewport = useWorkspaceStore.getState().viewport;
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const worldX = (screenX - viewport.x) / viewport.scale;
            const worldY = (screenY - viewport.y) / viewport.scale;

            try {
              const comp = createComponent(dragState.type, { x: worldX, y: worldY });
              comp.isNew = true;
              useWorkspaceStore.getState().addComponent(comp);
              useWorkspaceStore.getState().selectComponent(comp.id, false);
              toast.success(`Added ${dragState.name}`);
            } catch (err: any) {
              toast.error(err.message || 'Failed to add component');
            }
          }
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    components: cat.components.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.components.length > 0);

  // Check if cursor is over canvas for ghost opacity tint
  const isOverCanvas = dragState?.isDragging ? (() => {
    const canvasElement = document.querySelector('main');
    if (!canvasElement) return false;
    const rect = canvasElement.getBoundingClientRect();
    return (
      dragState.currentX >= rect.left &&
      dragState.currentX <= rect.right &&
      dragState.currentY >= rect.top &&
      dragState.currentY <= rect.bottom
    );
  })() : false;

  return (
    <>
      <div id="tour-component-palette" className="w-[280px] min-w-[280px] bg-surface border-r border-border flex flex-col h-full overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Components</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181818] border border-border rounded pl-9 pr-3 py-1.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Component List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {filteredCategories.length === 0 ? (
            <div className="text-center text-text-muted text-sm mt-8">
              No components found
            </div>
          ) : (
            filteredCategories.map(category => (
              <div key={category.name} className="mb-4">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1 mb-2 text-text-secondary hover:text-text transition-colors"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${!collapsedCategories[category.name] ? 'rotate-90' : ''}`}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>

                {!collapsedCategories[category.name] && (
                  <div className="flex flex-col gap-2 px-2">
                    {category.components.map(comp => (
                      <div
                        key={comp.type}
                        onMouseDown={(e) => handleMouseDown(e, comp.type, comp.name, comp.icon)}
                        className="flex items-start gap-3 p-3 bg-surface border border-border rounded cursor-grab active:cursor-grabbing hover:bg-surface-hover hover:border-primary/50 active:scale-[0.98] transition-all select-none"
                      >
                        <div className="bg-[#181818] p-2 rounded flex-shrink-0 text-text-secondary">
                          <comp.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-primary truncate">{comp.name}</h3>
                          <p className="text-xs text-text-muted truncate mt-0.5">{comp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drag Ghost Overlay */}
      {dragState?.isDragging && dragState.icon && (
        <div
          className="fixed pointer-events-none z-50 flex items-center gap-2 bg-surface border rounded px-3 py-2 shadow-2xl transition-opacity duration-150"
          style={{
            left: dragState.currentX - 10,
            top: dragState.currentY - 10,
            opacity: isOverCanvas ? 0.9 : 0.4,
            borderColor: isOverCanvas ? 'var(--color-primary, #10b981)' : '#ef4444',
            backgroundColor: isOverCanvas ? '' : 'rgba(239, 68, 68, 0.1)'
          }}
        >
          <dragState.icon size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary whitespace-nowrap">{dragState.name}</span>
        </div>
      )}
    </>
  );
};
