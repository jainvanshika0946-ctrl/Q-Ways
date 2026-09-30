/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          subtle: 'var(--color-bg-subtle)',
          overlay: 'var(--color-bg-overlay)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
          text: 'var(--color-accent-text)',
        },
        traffic: {
          low: 'var(--color-traffic-low)',
          moderate: 'var(--color-traffic-mod)',
          heavy: 'var(--color-traffic-heavy)',
          jammed: 'var(--color-traffic-jam)',
        },
        vehicle: {
          1: '#0F766E', // Deep Teal
          2: '#D97706', // Ochre Amber
          3: '#2563EB', // Sapphire Blue
          4: '#7C3AED', // Royal Violet
          5: '#DC2626', // Crimson
          6: '#059669', // Emerald
          7: '#DB2777', // Rose Pink
          8: '#EA580C', // Deep Orange
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
