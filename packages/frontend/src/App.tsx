import { Canvas } from './components/canvas/Canvas';
import { ComponentPalette } from './components/ui/ComponentPalette';
import { WireColorPicker } from './components/ui/WireColorPicker';
import { UndoRedoButtons } from './components/ui/UndoRedoButtons';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CodeEditor } from './components/editor/CodeEditor';
import { SerialMonitor } from './components/editor/SerialMonitor';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';

function App() {
  useKeyboardShortcuts();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {/* Top Toolbar */}
      <header className="h-[52px] min-h-[52px] bg-surface border-b border-border flex items-center px-4 gap-4">
        <h1 className="text-lg font-semibold text-primary">Oscilink</h1>
        <div className="h-6 w-px bg-border mx-2" />
        <UndoRedoButtons />
        
        <div className="flex items-center ml-auto gap-2 text-text-secondary">
          <button 
            onClick={() => setLeftOpen(!leftOpen)} 
            className={`p-1.5 rounded transition-colors ${leftOpen ? 'bg-surface-hover text-primary' : 'hover:bg-surface-hover'}`}
            title="Toggle Left Panel"
          >
            <PanelLeft size={18} />
          </button>
          <button 
            onClick={() => setRightOpen(!rightOpen)} 
            className={`p-1.5 rounded transition-colors ${rightOpen ? 'bg-surface-hover text-primary' : 'hover:bg-surface-hover'}`}
            title="Toggle Right Panel"
          >
            <PanelRight size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Canvas permanently sits underneath, filling the WHOLE area */}
        <main className="absolute inset-0 bg-[#FFFAFA] flex flex-col z-0">
          <Canvas rightPanelOpen={rightOpen} />
          <WireColorPicker />
        </main>

        {/* Left Panel */}
        <div className={`absolute top-0 bottom-0 left-0 z-10 overflow-hidden transition-all duration-300 ease-in-out ${leftOpen ? 'w-[280px]' : 'w-0'}`}>
          <div className="w-[280px] h-full absolute top-0 right-0 shadow-[4px_0_24px_rgba(0,0,0,0.06)]">
            <ComponentPalette />
          </div>
        </div>

        {/* Right Panel (Code Editor + Properties/Inspector) */}
        <div className={`absolute top-0 bottom-0 right-0 z-10 overflow-hidden transition-all duration-300 ease-in-out ${rightOpen ? 'w-[450px]' : 'w-0'}`}>
          <div className="w-[450px] h-full absolute top-0 left-0 shadow-[-4px_0_24px_rgba(0,0,0,0.06)]">
            <aside className="w-[450px] h-full bg-surface border-l border-border flex flex-col">
              {/* Top Portion: Code Editor */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <CodeEditor />
              </div>
              
              {/* Bottom Portion: Serial Monitor */}
              <div className="h-[250px] min-h-[200px] flex flex-col">
                <SerialMonitor />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
