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

  let colorClass = 'text-[#2C5E4A]';
  let isItalic = false;

  if (line.type === 'input') {
    colorClass = 'text-[#5B9DF6]';
  } else if (line.type === 'system') {
    colorClass = 'text-[#6A7B76]';
    isItalic = true;
  }

  return (
    <>
      {parts.map((part, index) => {
        // Don't render empty parts from trailing newlines unless it's the only part
        if (part === '' && index > 0 && index === parts.length - 1) return null;
        
        return (
          <div key={`${line.id}-${index}`} className={`${colorClass} ${isItalic ? 'italic' : ''} leading-relaxed whitespace-pre-wrap break-all font-medium`}>
            {showTimestamp && <span className="text-[#B5C2BF] mr-2 select-none">{timePrefix}</span>}
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-[#E5EBE8] bg-[#F3F4F3] text-[13px]">
        <div className="flex items-center gap-2">
          <select 
            value={baudRate} 
            onChange={(e) => setBaudRate(Number(e.target.value))}
            className="bg-white text-[#2C5E4A] border border-black/5 shadow-sm rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-[#82b49b] font-medium"
          >
            {BAUD_RATES.map(rate => (
              <option key={rate} value={rate}>{rate} baud</option>
            ))}
          </select>

          <select 
            value={lineEnding} 
            onChange={(e) => setLineEnding(e.target.value)}
            className="bg-white text-[#2C5E4A] border border-black/5 shadow-sm rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-[#82b49b] font-medium"
          >
            {LINE_ENDINGS.map(le => (
              <option key={le.label} value={le.value}>{le.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#2C5E4A]/70 hover:text-[#2C5E4A] transition-colors font-medium">
            <input 
              type="checkbox" 
              checked={showTimestamps} 
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="accent-[#2C5E4A]"
            />
            <Clock size={14} />
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[#2C5E4A]/70 hover:text-[#2C5E4A] transition-colors font-medium">
            <input 
              type="checkbox" 
              checked={autoscroll} 
              onChange={(e) => setAutoscroll(e.target.checked)}
              className="accent-[#2C5E4A]"
            />
            <ArrowDown size={14} />
          </label>

          <div className="w-px h-4 bg-[#E5EBE8] mx-0.5" />

          <button 
            onClick={clearSerial}
            className="text-[#B5C2BF] hover:bg-[#FCEAEB] hover:text-[#FF8A8A] transition-colors p-1.5 rounded-md"
            title="Clear output"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto bg-white text-[#2C5E4A] p-4 font-mono text-[13px] custom-scrollbar"
      >
        {renderedLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#6A7B76] opacity-60">
            <Terminal size={32} className="mb-3 text-[#B5C2BF]" />
            <p className="font-medium">Serial output will appear here when the simulation runs</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full justify-end gap-0.5">
            {linesCleared > 0 && (
              <div className="text-[#B5C2BF] italic mb-3 text-center text-[12px] font-sans">
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
      <div className="flex items-center p-3 bg-white border-t border-[#E5EBE8]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message to send..."
          className="flex-1 bg-[#F3F4F3] text-[#2C5E4A] font-mono text-[13px] font-medium rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#82b49b] placeholder-[#B5C2BF]"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue}
          className={`ml-3 p-2 rounded-lg transition-colors ${!inputValue ? 'text-[#B5C2BF] cursor-not-allowed' : 'text-[#2C5E4A] bg-[#d2e8d6]/50 hover:bg-[#d2e8d6]'}`}
          title="Send"
        >
          <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
        </button>
      </div>
    </div>
  );
};
