import { useState, useEffect } from 'react';
import { Button } from './Button';
import { createPortal } from 'react-dom';
import { X, Cpu, Code2, Zap } from 'lucide-react';
import { deserializeProject } from '../../utils/projectSerializer';
import { exampleProjects } from '../../data/exampleProjects';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has visited before
    const hasVisited = localStorage.getItem('arduino-sim-welcomed');
    if (!hasVisited) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isOpen) return null;

  const markWelcomed = () => {
    localStorage.setItem('arduino-sim-welcomed', 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    markWelcomed();
    // Load the Blink example
    if (exampleProjects.length > 0) {
      deserializeProject(exampleProjects[0]);
    }
  };

  const handleStartTour = () => {
    markWelcomed();
    // Dispatch a global event to start the tour so GuidedTour can pick it up
    window.dispatchEvent(new CustomEvent('arduino-sim-start-tour'));
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-elevated p-8 rounded-xl shadow-2xl border border-border-default max-w-3xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors p-1"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
            <Cpu size={32} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary text-center">
            Welcome to Arduino Simulator
          </h2>
          <p className="text-text-secondary text-center mt-2 max-w-lg">
            Build, code, and simulate Arduino circuits entirely in your browser. 
            No hardware required!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-surface-hover border border-border-subtle flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-3">
              <Cpu size={20} />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">Build Circuits</h3>
            <p className="text-xs text-text-secondary">Drag and drop components onto the canvas and wire them up easily.</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-hover border border-border-subtle flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-3">
              <Code2 size={20} />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">Write Arduino Code</h3>
            <p className="text-xs text-text-secondary">Write C++ in our Monaco editor. Code is compiled instantly in the browser.</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-hover border border-border-subtle flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mb-3">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">See It Run</h3>
            <p className="text-xs text-text-secondary">Watch LEDs blink, motors spin, and sensors react in real-time simulation.</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t border-border-subtle pt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Skip to Workspace
          </Button>
          <Button variant="primary" size="lg" onClick={handleStartTour} className="px-8 shadow-md shadow-primary/20">
            Start Tutorial
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
