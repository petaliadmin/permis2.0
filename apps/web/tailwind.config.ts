import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-baloo)', 'var(--font-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        baloo: ['var(--font-baloo)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Brand navy — sampled directly from the PERMIS 2.0 logo (#00173D), hue ~218°.
        primary: {
          DEFAULT: '#003EA8',
          50: '#F0F5FF',
          100: '#D6E5FF',
          200: '#A3C5FF',
          300: '#5C98FF',
          400: '#146AFF',
          500: '#004FD6',
          600: '#003EA8',
          700: '#002F80',
          800: '#00235E',
          900: '#001842',
          950: '#00102B',
        },
        // Quiz — violet.
        violet: {
          DEFAULT: '#7C3AED',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Examens — orange, sampled directly from the PERMIS 2.0 logo (#FF630E), hue ~21°.
        orange: {
          DEFAULT: '#FF620E',
          50: '#FFF2EB',
          100: '#FFDECC',
          200: '#FFBD99',
          300: '#FF975E',
          400: '#FF752B',
          500: '#FF620E',
          600: '#E65000',
          700: '#B84000',
          800: '#8F3200',
          900: '#662400',
        },
        // Success / bonnes réponses — green.
        success: {
          DEFAULT: '#16A34A',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // XP / rewards — warm gold.
        xp: {
          DEFAULT: '#F59E0B',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Road-code semantics.
        caution: { DEFAULT: '#F59E0B', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        info: { DEFAULT: '#003EA8', 400: '#146AFF', 500: '#004FD6', 600: '#003EA8' },
        // Light surfaces.
        surface: {
          DEFAULT: '#F5F7FA',
          1: '#ffffff',
          2: '#f1f5f9',
          3: '#e2e8f0',
          4: '#cbd5e1',
        },
        // Dark navy used only on immersive feedback/exam-result screens.
        ink: {
          DEFAULT: '#0F172A',
          800: '#111827',
          900: '#0f172a',
          950: '#0b1120',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Kept for shared UI components (backdrops, secondary button ink).
        dark: {
          DEFAULT: '#0f172a',
          50: '#f8fafc',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0b1120',
        },
        secondary: {
          DEFAULT: '#7C3AED',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '14px',
        md: '14px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '34px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.08)',
        card: '0 1px 3px rgba(15,23,42,0.05), 0 8px 24px -12px rgba(15,23,42,0.12)',
        'card-lg': '0 4px 8px rgba(15,23,42,0.06), 0 18px 40px -16px rgba(15,23,42,0.18)',
        clay: '0 1px 3px rgba(15,23,42,0.05), 0 10px 28px -14px rgba(15,23,42,0.16)',
        'clay-lg': '0 6px 14px rgba(15,23,42,0.07), 0 24px 48px -20px rgba(15,23,42,0.22)',
        nav: '0 -1px 3px rgba(15,23,42,0.04), 0 -8px 24px -12px rgba(15,23,42,0.10)',
        glow: '0 8px 24px -8px rgba(0,62,168,0.45)',
        'glow-violet': '0 8px 24px -8px rgba(124,58,237,0.45)',
        'glow-orange': '0 8px 24px -8px rgba(255,98,14,0.45)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #003EA8 0%, #002F80 100%)',
        'gradient-violet': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FF620E 0%, #E65000 100%)',
        'gradient-success': 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        'gradient-ink': 'linear-gradient(160deg, #1E293B 0%, #0F172A 60%, #0B1120 100%)',
        'gradient-hero': 'linear-gradient(160deg, #003EA8 0%, #002F80 55%, #001842 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(6deg)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 3s ease-in-out infinite',
        pop: 'pop 0.5s cubic-bezier(0.22,1,0.36,1) both',
        wiggle: 'wiggle 0.5s ease-in-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
