import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}', './shared/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eroot: {
          stage: '#0f172a',
          stageDeep: '#1e1b4b',
          primary: '#4f46e5',
          primaryHover: '#4338ca',
          validation: '#7c3aed',
          tileRed: '#dc2626',
          tileBlue: '#2563eb',
          tileYellow: '#eab308',
          tileGreen: '#16a34a',
          tileTeal: '#0d9488',
          tilePurple: '#9333ea',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

