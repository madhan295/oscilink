import { Canvas } from './components/canvas/Canvas';
import { ComponentPalette } from './components/ui/ComponentPalette';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {/* Top Toolbar */}
      <header className="h-[52px] min-h-[52px] bg-surface border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold text-primary">Arduino Simulator</h1>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <ComponentPalette />

        {/* Center Panel (Canvas/Editor) */}
        <main className="flex-1 bg-[#181818] relative flex flex-col">
          <Canvas />
        </main>

        {/* Right Panel (Properties/Inspector) */}
        <aside className="w-[360px] min-w-[360px] bg-surface border-l border-border p-4 flex flex-col">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Properties</h2>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded">
            <span className="text-text-secondary">Inspector Panel</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
