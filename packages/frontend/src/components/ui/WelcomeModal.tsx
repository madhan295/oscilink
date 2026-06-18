import { useState, useEffect } from 'react';
import { Button } from './Button';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has visited before
    const hasVisited = localStorage.getItem('arduino-sim-has-visited');
    if (!hasVisited) {
      setIsOpen(true);
    }
    
    // Add escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !hasVisited) {
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const handleSkip = () => {
    localStorage.setItem('arduino-sim-has-visited', 'true');
    localStorage.setItem('arduino-sim-tour-completed', 'true');
    setIsOpen(false);
  };

  const handleStartTour = () => {
    localStorage.setItem('arduino-sim-has-visited', 'true');
    setIsOpen(false);
    // TODO: Implement the actual tour logic here when a tour library is installed
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-elevated p-8 rounded-xl shadow-2xl border border-border-default max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors p-1"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-text-primary mb-4 pr-6">
          Welcome to Arduino Simulator
        </h2>
        
        <p className="text-text-secondary leading-relaxed mb-8">
          This is an interactive browser-based simulator for Arduino circuits. 
          You can drag and drop components, connect wires, write C++ code, and test your 
          circuits completely in the browser!
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={handleSkip}>
            Skip / Get Started
          </Button>
          <Button variant="primary" onClick={handleStartTour}>
            Start Tour
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
