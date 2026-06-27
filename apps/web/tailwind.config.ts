import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Scan the shared UI package so its Tailwind classes are not purged.
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          DEFAULT: '#FACC15',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        danger: {
          DEFAULT: '#DC2626',
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        dark: {
          DEFAULT: '#111827',
          50: '#f9fafb',
          800: '#1f2937',
          900: '#111827',
          950: '#0b1120',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(16 24 40 / 0.08), 0 4px 16px -4px rgb(16 24 40 / 0.06)',
        card: '0 1px 3px rgb(16 24 40 / 0.06), 0 8px 24px -8px rgb(16 24 40 / 0.10)',
        glow: '0 0 0 1px rgb(22 163 74 / 0.10), 0 8px 24px -6px rgb(22 163 74 / 0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-in-fast': 'fade-in-fast 0.25s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #16A34A 0%, #22c55e 100%)',
        'gradient-hero': 'linear-gradient(135deg, #14532d 0%, #16A34A 55%, #22c55e 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
