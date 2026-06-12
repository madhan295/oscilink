import { Canvas } from './components/canvas/Canvas';
import { ComponentPalette } from './components/ui/ComponentPalette';
import { WireColorPicker } from './components/ui/WireColorPicker';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CodeEditor, CodeEditorRef } from './components/editor/CodeEditor';
import { BottomPanel } from './components/editor/BottomPanel';
import { Toaster } from 'react-hot-toast';
import { useState, useRef } from 'react';
import { Toolbar } from './components/ui/Toolbar';
import { SensorDistanceControl } from './components/ui/SensorDistanceControl';

function App() {
  useKeyboardShortcuts();

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const editorRef = useRef<CodeEditorRef>(null);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Toolbar 
        leftOpen={leftOpen} setLeftOpen={setLeftOpen} 
        rightOpen={rightOpen} setRightOpen={setRightOpen} 
        editorRef={editorRef}
      />

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
                <CodeEditor ref={editorRef} />
              </div>
              
              {/* Bottom Portion: Tabs (Problems & Serial Monitor) */}
              <div className="h-[250px] min-h-[200px] flex flex-col">
                <BottomPanel />
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      <SensorDistanceControl />
    </div>
  );
}

export default App;

