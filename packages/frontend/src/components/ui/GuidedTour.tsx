import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Check } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSimulationStore } from '../../store/simulationStore';
import { Button } from './Button';

type Rect = { x: number; y: number; width: number; height: number; isCircle?: boolean };

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const components = useWorkspaceStore(state => state.components);
  const wires = useWorkspaceStore(state => state.wires);
  const viewport = useWorkspaceStore(state => state.viewport);
  const simulationStatus = useSimulationStore(state => state.status);

  // Initialize from event
  useEffect(() => {
    const handleStart = () => {
      setIsActive(true);
      setCurrentStep(1);
    };
    window.addEventListener('arduino-sim-start-tour', handleStart);
    return () => window.removeEventListener('arduino-sim-start-tour', handleStart);
  }, []);

  // Handle escape key and body class
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
        useWorkspaceStore.getState().clearSelection();
      }
    };
    
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('tour-active');
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('tour-active');
    };
  }, [isActive]);

  // Auto-advance logic
  useEffect(() => {
    if (!isActive) return;

    if (currentStep === 2) {
      if (components.some(c => c.type === 'ARDUINO_UNO')) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (components.some(c => c.type === 'LED')) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (wires.length >= 2) setCurrentStep(5);
    } else if (currentStep === 6) {
      if (simulationStatus === 'RUNNING') setCurrentStep(7);
    }
  }, [isActive, currentStep, components, wires, simulationStatus]);

  // Calculate target rect
  useEffect(() => {
    if (!isActive) return;

    const updateRect = () => {
      let el: HTMLElement | null = null;
      let newRect: Rect | null = null;

      switch (currentStep) {
        case 1:
          el = document.getElementById('tour-component-palette');
          if (el) {
            const r = el.getBoundingClientRect();
            newRect = { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 };
          }
          break;
        case 2:
        case 3:
          // Focus center of canvas or just no specific target
          newRect = null;
          break;
        case 4:
          // Target D13 pin of Uno
          const uno = components.find(c => c.type === 'ARDUINO_UNO');
          const canvasEl = document.querySelector('.konvajs-content');
          if (uno && canvasEl) {
            const canvasRect = canvasEl.getBoundingClientRect();
            const d13 = uno.pins['D13'];
            if (d13) {
              const absX = uno.position.x + d13.position.x;
              const absY = uno.position.y + d13.position.y;
              const screenX = canvasRect.left + viewport.x + absX * viewport.scale;
              const screenY = canvasRect.top + viewport.y + absY * viewport.scale;
              newRect = { x: screenX - 15, y: screenY - 15, width: 30, height: 30, isCircle: true };
            }
          }
          break;
        case 5:
          el = document.getElementById('tour-code-editor');
          if (el) {
            const r = el.getBoundingClientRect();
            newRect = { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 };
          }
          break;
        case 6:
          el = document.getElementById('tour-run-button');
          if (el) {
            const r = el.getBoundingClientRect();
            newRect = { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 };
          }
          break;
        case 7:
          newRect = null;
          break;
      }
      setTargetRect(newRect);
    };

    updateRect();
    // Update on resize or animation frames if needed, but for simplicity just run once
    const interval = setInterval(updateRect, 100);
    return () => clearInterval(interval);
  }, [isActive, currentStep, components, viewport]);

  if (!isActive) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* SVG Overlay Mask */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              targetRect.isCircle ? (
                <circle 
                  cx={targetRect.x + targetRect.width / 2} 
                  cy={targetRect.y + targetRect.height / 2} 
                  r={targetRect.width / 2} 
                  fill="black" 
                />
              ) : (
                <rect 
                  x={targetRect.x} 
                  y={targetRect.y} 
                  width={targetRect.width} 
                  height={targetRect.height} 
                  rx="8" 
                  fill="black" 
                />
              )
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" pointerEvents="none" />
      </svg>

      {/* Close Button */}
      <button 
        onClick={() => {
          setIsActive(false);
          useWorkspaceStore.getState().clearSelection();
        }}
        className="absolute top-4 right-4 text-white hover:text-gray-300 pointer-events-auto bg-black/20 p-2 rounded-full"
      >
        <X size={24} />
      </button>

      {/* Step Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {currentStep === 1 && targetRect && (
          <div 
            className="absolute pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default max-w-sm animate-in fade-in slide-in-from-left-4"
            style={{ left: targetRect.x + targetRect.width + 20, top: targetRect.y + 20 }}
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Component Palette</h3>
            <p className="text-text-secondary text-sm mb-4">
              Here you can find all available components. Drag them onto the canvas to start building.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Step 1 of 7</span>
              <Button variant="primary" onClick={() => setCurrentStep(2)}>
                Got it <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default text-center animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-text-primary mb-2">Drag an Arduino Uno</h3>
            <p className="text-text-secondary text-sm">
              Find the Arduino Uno in the palette and drag it onto the canvas.
            </p>
            {/* Ghost illustration */}
            <div className="mt-4 h-24 relative overflow-hidden flex items-center justify-center rounded border border-dashed border-border-subtle bg-surface">
              <div className="w-12 h-16 bg-green-900/40 rounded border border-green-500/50 absolute animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default text-center animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-text-primary mb-2">Drag an LED</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto">
              Now drag an LED component and drop it on the <strong>empty gray canvas area</strong> to the left of the Arduino. 
              <br/><br/>
              <span className="text-accent-orange font-medium">Be sure not to drop it directly on top of the Arduino!</span>
            </p>
            <div className="mt-4 h-24 relative overflow-hidden flex items-center justify-center rounded border border-dashed border-border-subtle bg-surface">
              <div className="w-6 h-6 bg-red-900/40 rounded-full border border-red-500/50 absolute animate-[pulse_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div 
            className="absolute pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default max-w-sm animate-in fade-in slide-in-from-bottom-4"
            style={{ 
              left: targetRect ? targetRect.x + 40 : '50%', 
              top: targetRect ? targetRect.y + 40 : '50%',
              transform: targetRect ? 'none' : 'translate(-50%, -50%)'
            }}
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Connect the Wires</h3>
            <p className="text-text-secondary text-sm">
              Click on the D13 pin of the Arduino (highlighted), then click on the Anode (+) pin of the LED to wire them together.
              <br/><br/>
              Then, connect the Arduino's GND pin to the LED's Cathode (-) pin to complete the circuit!
            </p>
            {/* Pulsing ring over D13 */}
            {targetRect && (
              <div 
                className="fixed rounded-full border-2 border-accent-cyan pointer-events-none animate-ping"
                style={{ 
                  left: targetRect.x - 5, 
                  top: targetRect.y - 5, 
                  width: targetRect.width + 10, 
                  height: targetRect.height + 10 
                }} 
              />
            )}
          </div>
        )}

        {currentStep === 5 && targetRect && (
          <div 
            className="absolute pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default max-w-sm animate-in fade-in slide-in-from-right-4"
            style={{ right: window.innerWidth - targetRect.x + 20, top: targetRect.y + 20 }}
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Write Arduino Code</h3>
            <p className="text-text-secondary text-sm mb-4">
              This is the Monaco Editor. You can write your standard C++ Arduino code here. It comes pre-loaded with a Blink example!
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Step 5 of 7</span>
              <Button variant="primary" onClick={() => setCurrentStep(6)}>
                I see it <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 6 && targetRect && (
          <div 
            className="absolute pointer-events-auto bg-elevated p-6 rounded-xl shadow-2xl border border-border-default max-w-sm animate-in fade-in slide-in-from-top-4"
            style={{ left: targetRect.x - 150, top: targetRect.y + targetRect.height + 20 }}
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Compile and Run</h3>
            <p className="text-text-secondary text-sm mb-4">
              Click the Run button to compile your code and start the real-time simulation. Watch the LED blink!
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Step 6 of 7</span>
              <Button variant="primary" onClick={() => setCurrentStep(7)}>
                Run it! <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
            {/* Glowing effect on run button is handled by SVG mask but we can add an extra glow */}
            <div 
              className="fixed rounded border border-primary pointer-events-none animate-pulse shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"
              style={{ left: targetRect.x, top: targetRect.y, width: targetRect.width, height: targetRect.height }} 
            />
          </div>
        )}

        {currentStep === 7 && (
          <div className="pointer-events-auto bg-elevated p-8 rounded-xl shadow-2xl border border-border-default text-center animate-in zoom-in-95 flex flex-col items-center">
            {/* Simple CSS Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2 h-2 rounded-sm opacity-70 animate-[fall_3s_linear_infinite]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10px`,
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Congratulations!</h3>
            <p className="text-text-secondary text-sm mb-8 max-w-sm">
              You've completed the tutorial and built your first simulated Arduino circuit.
            </p>
            <Button variant="primary" size="lg" onClick={() => {
              setIsActive(false);
              useWorkspaceStore.getState().clearSelection();
            }}>
              Explore on your own
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
