export const theme = {
  colors: {
    background: {
      canvas: '#0f0f11', // Darkest canvas background
      default: '#141417', // Main background
      surface: '#1c1c21', // Card surface
      elevated: '#25252b', // Elevated popups/menus
      hover: '#2d2d34', // Hover overlays
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
      muted: '#71717a',
      inverse: '#000000',
    },
    border: {
      default: '#27272a',
      focus: '#3b82f6',
      subtle: '#18181b',
    },
    accent: {
      blue: '#3b82f6',
      blueHover: '#2563eb',
      green: '#10b981',
      greenHover: '#059669',
      orange: '#f59e0b',
      orangeHover: '#d97706',
      red: '#ef4444',
      redHover: '#dc2626',
      purple: '#8b5cf6',
      purpleHover: '#7c3aed',
    },
    wire: {
      power: '#ef4444', // Red
      ground: '#10b981', // Green
      signal: '#f59e0b', // Orange
      default: '#3b82f6', // Blue
    },
    status: {
      idle: '#71717a',
      compiled: '#3b82f6',
      running: '#10b981',
      paused: '#f59e0b',
      error: '#ef4444',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
  },
  transitions: {
    fast: '100ms',
    normal: '200ms',
    slow: '350ms',
  }
};
