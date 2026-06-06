import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Terminal, Trash2, Clock, ArrowDown, Send } from 'lucide-react';
import { SerialLine } from '../../types/simulation';

const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400];
const LINE_ENDINGS = [
  { label: 'None', value: '' },
  { label: 'Newline', value: '\n' },
  { label: 'Carriage Return', value: '\r' },
  { label: 'Both NL & CR', value: '\r\n' },
];

const MAX_LINES = 500;

// Format timestamp
const formatTime = (ts: number) => {
  const date = new Date(ts);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

// Subcomponent for rendering a single line
const SerialLineItem = React.memo(({ line, showTimestamp }: { line: SerialLine; showTimestamp: boolean }) => {
  const parts = line.text.split('\n');
  const timePrefix = showTimestamp ? `[${formatTime(line.timestamp)}] ` : '';

  let colorClass = 'text-green-400';
  let isItalic = false;

  if (line.type === 'input') {
    colorClass = 'text-cyan-400';
  } else if (line.type === 'system') {
    colorClass = 'text-gray-400';
    isItalic = true;
  }

  return (
    <>
      {parts.map((part, index) => {
        // Don't render empty parts from trailing newlines unless it's the only part
        if (part === '' && index > 0 && index === parts.length - 1) return null;
        
        return (
          <div key={`${line.id}-${index}`} className={`${colorClass} ${isItalic ? 'italic' : ''} leading-relaxed whitespace-pre-wrap break-all`}>
            {showTimestamp && <span className="text-gray-500 mr-2 select-none">{timePrefix}</span>}
            {part}
          </div>
        );
      })}
    </>
  );
});

export const SerialMonitor: React.FC = () => {
  const [renderedLines, setRenderedLines] = useState<SerialLine[]>([]);
  const [autoscroll, setAutoscroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [lineEnding, setLineEnding] = useState<string>('\n');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [inputValue, setInputValue] = useState('');

  const outputRef = useRef<HTMLDivElement>(null);

  const clearSerial = useSimulationStore((state) => state.clearSerial);
  const addSerialLine = useSimulationStore((state) => state.addSerialLine);

  // Debounced subscription to serial output
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let lastOutput = useSimulationStore.getState().serialOutput;
    
    const unsubscribe = useSimulationStore.subscribe((state) => {
      if (state.serialOutput !== lastOutput) {
        lastOutput = state.serialOutput;
        if (!timeout) {
          timeout = setTimeout(() => {
            setRenderedLines(lastOutput);
            timeout = null;
          }, 100);
        }
      }
    });
    
    // Initial load
    setRenderedLines(lastOutput);
    
    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Autoscroll effect
  useEffect(() => {
    if (autoscroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [renderedLines, autoscroll]);

  const handleSend = () => {
    if (!inputValue) return;

    const textToSend = inputValue + lineEnding;
    
    // Add locally to store
    addSerialLine({
      id: crypto.randomUUID(),
      text: textToSend,
      timestamp: Date.now(),
      type: 'input'
    });

    // TODO: Post a SERIAL_INPUT message to the simulation worker via SimulationManager
    window.dispatchEvent(new CustomEvent('SERIAL_INPUT', { detail: textToSend }));

    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Slice array for performance
  const linesToRender = renderedLines.slice(-MAX_LINES);
  const linesCleared = renderedLines.length - linesToRender.length;

  return (
    <div className="flex flex-col h-full bg-surface border-t border-border">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface text-sm">
        <div className="flex items-center gap-2 text-text-secondary font-medium">
          <Terminal size={16} />
          <span>Serial Monitor</span>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={baudRate} 
            onChange={(e) => setBaudRate(Number(e.target.value))}
            className="bg-background text-text border border-border rounded px-2 py-1 text-xs outline-none"
          >
            {BAUD_RATES.map(rate => (
              <option key={rate} value={rate}>{rate} baud</option>
            ))}
          </select>

          <select 
            value={lineEnding} 
            onChange={(e) => setLineEnding(e.target.value)}
            className="bg-background text-text border border-border rounded px-2 py-1 text-xs outline-none"
          >
            {LINE_ENDINGS.map(le => (
              <option key={le.label} value={le.value}>{le.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-1 cursor-pointer text-xs text-text-secondary hover:text-text transition-colors">
            <input 
              type="checkbox" 
              checked={showTimestamps} 
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="accent-primary"
            />
            <Clock size={14} className="ml-0.5" />
          </label>

          <label className="flex items-center gap-1 cursor-pointer text-xs text-text-secondary hover:text-text transition-colors">
            <input 
              type="checkbox" 
              checked={autoscroll} 
              onChange={(e) => setAutoscroll(e.target.checked)}
              className="accent-primary"
            />
            <ArrowDown size={14} className="ml-0.5" />
          </label>

          <div className="w-px h-4 bg-border mx-1" />

          <button 
            onClick={clearSerial}
            className="text-text-muted hover:text-error transition-colors p-1 rounded"
            title="Clear output"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto bg-[#1E1E1E] text-text p-2 font-mono text-[12px]"
      >
        {renderedLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
            <Terminal size={32} className="mb-2" />
            <p>Serial output will appear here when the simulation runs</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full justify-end">
            {linesCleared > 0 && (
              <div className="text-gray-500 italic mb-2 text-center text-[11px]">
                --- {linesCleared} older lines cleared to conserve memory ---
              </div>
            )}
            {linesToRender.map((line) => (
              <SerialLineItem key={line.id} line={line} showTimestamp={showTimestamps} />
            ))}
          </div>
        )}
      </div>

      {/* Input Row */}
      <div className="flex items-center p-2 bg-[#1E1E1E] border-t border-[#333]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message to send..."
          className="flex-1 bg-[#2D2D2D] text-text font-mono text-[12px] rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/50 placeholder-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue}
          className={`ml-2 p-1.5 rounded transition-colors ${!inputValue ? 'text-gray-600 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`}
          title="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
