/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg-default)',
        canvas: 'var(--color-bg-canvas)',
        surface: 'var(--color-bg-surface)',
        elevated: 'var(--color-bg-elevated)',
        'surface-hover': 'var(--color-bg-hover)',
        
        primary: 'var(--color-accent-blue)',
        'primary-hover': 'var(--color-accent-blue-hover)',
        
        text: {
          DEFAULT: 'var(--color-text-primary)',
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        
        border: {
          DEFAULT: 'var(--color-border-default)',
          focus: 'var(--color-border-focus)',
          subtle: 'var(--color-border-subtle)',
        },

        accent: {
          blue: 'var(--color-accent-blue)',
          green: 'var(--color-accent-green)',
          orange: 'var(--color-accent-orange)',
          red: 'var(--color-accent-red)',
          purple: 'var(--color-accent-purple)',
        },

        status: {
          idle: 'var(--color-status-idle)',
          compiled: 'var(--color-status-compiled)',
          running: 'var(--color-status-running)',
          paused: 'var(--color-status-paused)',
          error: 'var(--color-status-error)',
        },

        error: 'var(--color-accent-red)'
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '100ms',
        normal: '200ms',
        slow: '350ms',
      }
    },
  },
  plugins: [],
}
