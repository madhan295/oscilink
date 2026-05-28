/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1e1e1e',
        'surface-hover': '#2d2d2d',
        primary: '#00979D', // Arduino Teal
        'primary-hover': '#008184',
        text: '#ffffff',
        'text-secondary': '#a0a0a0',
        border: '#333333',
        error: '#cf6679'
      }
    },
  },
  plugins: [],
}
