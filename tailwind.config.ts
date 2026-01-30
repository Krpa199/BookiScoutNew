import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ocean/Summer Color Palette - inspired by Croatian Adriatic Sea
        ocean: {
          50: '#f0f9ff',   // Lightest sky blue
          100: '#e0f2fe',  // Very light blue
          200: '#b9e6fe',  // Light turquoise
          300: '#7dd3fc',  // Bright cyan
          400: '#38bdf8',  // Vibrant turquoise
          500: '#0ea5e9',  // Ocean blue
          600: '#0284c7',  // Deep ocean
          700: '#0369a1',  // Dark ocean
          800: '#075985',  // Very dark blue
          900: '#0c4a6e',  // Deepest ocean
        },
        sand: {
          50: '#fefce8',   // Lightest sand
          100: '#fef9c3',  // Very light sand
          200: '#fef08a',  // Light yellow sand
          300: '#fde047',  // Bright sand
          400: '#facc15',  // Golden sand
          500: '#eab308',  // Deep gold
          600: '#ca8a04',  // Amber
          700: '#a16207',  // Dark amber
          800: '#854d0e',  // Very dark amber
          900: '#713f12',  // Deepest amber
        },
        coral: {
          50: '#fff1f2',   // Lightest coral
          100: '#ffe4e6',  // Very light coral
          200: '#fecdd3',  // Light coral
          300: '#fda4af',  // Soft coral
          400: '#fb7185',  // Bright coral
          500: '#f43f5e',  // Vibrant coral
          600: '#e11d48',  // Deep coral
          700: '#be123c',  // Dark coral
          800: '#9f1239',  // Very dark coral
          900: '#881337',  // Deepest coral
        },
        seafoam: {
          50: '#ecfdf5',   // Lightest seafoam
          100: '#d1fae5',  // Very light seafoam
          200: '#a7f3d0',  // Light seafoam
          300: '#6ee7b7',  // Bright seafoam
          400: '#34d399',  // Vibrant seafoam
          500: '#10b981',  // Deep seafoam
          600: '#059669',  // Dark seafoam
          700: '#047857',  // Very dark seafoam
          800: '#065f46',  // Deepest seafoam
          900: '#064e3b',  // Darkest seafoam
        },
        // Primary brand colors
        primary: {
          DEFAULT: '#0ea5e9', // Ocean 500
          light: '#38bdf8',    // Ocean 400
          dark: '#0369a1',     // Ocean 700
        },
        accent: {
          DEFAULT: '#f43f5e', // Coral 500
          light: '#fb7185',    // Coral 400
          dark: '#e11d48',     // Coral 600
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(14, 165, 233, 0.1), 0 4px 16px -4px rgba(14, 165, 233, 0.08)',
        'medium': '0 4px 16px -4px rgba(14, 165, 233, 0.12), 0 8px 24px -6px rgba(14, 165, 233, 0.1)',
        'large': '0 8px 32px -8px rgba(14, 165, 233, 0.15), 0 12px 48px -12px rgba(14, 165, 233, 0.12)',
        'ocean': '0 8px 32px -8px rgba(14, 165, 233, 0.25)',
        'coral': '0 8px 32px -8px rgba(244, 63, 94, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(-25%)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'gradient-ocean': 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)',
        'gradient-summer': 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
