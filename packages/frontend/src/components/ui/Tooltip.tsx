import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  shortcut?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export function Tooltip({
  children,
  content,
  shortcut,
  position = 'top',
  delayMs = 400
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const updatePosition = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    const offset = 8; // distance from element

    // We estimate tooltip size since it's not rendered yet, 
    // or we can just use CSS transforms based on the rect center.
    switch (position) {
      case 'top':
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
    }
    
    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    updatePosition();
    timeoutRef.current = setTimeout(() => setIsVisible(true), delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getTransform = () => {
    switch (position) {
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translate(-50%, 0)';
      case 'left': return 'translate(-100%, -50%)';
      case 'right': return 'translate(0, -50%)';
    }
  };

  return (
    <>
      <div
        ref={wrapperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className={clsx(
            'fixed z-[100] px-3 py-1.5 bg-[#2C5E4A] text-white text-xs font-bold rounded-lg shadow-[0_4px_12px_rgba(44,94,74,0.2)] pointer-events-none animate-in fade-in zoom-in-95 duration-150',
            'flex items-center gap-2 whitespace-nowrap'
          )}
          style={{
            top: coords.top,
            left: coords.left,
            transform: getTransform()
          }}
        >
          <div className="flex items-center gap-1.5">
            <span>{content}</span>
            {shortcut && (
              <span className="text-[10px] text-[#B5C2BF] font-mono bg-[#1E4334] px-1.5 py-0.5 rounded ml-1 tracking-wider opacity-90">
                {shortcut}
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
