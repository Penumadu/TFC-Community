import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand primary ──────────────────────────────────────────────
        primary: {
          DEFAULT: '#F5A623',
          dark: '#D4891A',
          light: '#FAC45A',
          50: '#FFF8EC',
          100: '#FEEECE',
          200: '#FDD99E',
          300: '#FBBD5E',
          400: '#F5A623',
          500: '#D4891A',
          600: '#B26D12',
          700: '#8D530D',
          800: '#6B3E0A',
          900: '#4A2B07',
        },
        // ── Brand secondary ────────────────────────────────────────────
        secondary: {
          DEFAULT: '#005A70',
          light: '#007A96',
          lighter: '#009DB8',
          50: '#E5F4F7',
          100: '#C2E5EC',
          200: '#82C8D8',
          300: '#3FAABD',
          400: '#007A96',
          500: '#005A70',
          600: '#004558',
          700: '#003140',
          800: '#001E28',
          900: '#000C10',
        },
        // ── Semantic surfaces ──────────────────────────────────────────
        bg: {
          DEFAULT: '#FAFAF7',
          warm: '#F7F5F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F3F4F6',
          elevated: '#FFFFFF',
        },
        // ── Text ────────────────────────────────────────────────────────
        text: {
          DEFAULT: '#1A1A1A',
          muted: '#6B6B6B',
          inverse: '#FFFFFF',
          accent: '#005A70',
        },
        // ── Feedback ────────────────────────────────────────────────────
        success: { DEFAULT: '#2E7D32', light: '#E8F5E9' },
        warning: { DEFAULT: '#F57C00', light: '#FFF3E0' },
        danger: { DEFAULT: '#C62828', light: '#FFEBEE' },
        info: { DEFAULT: '#1565C0', light: '#E3F2FD' },
        // ── Special ─────────────────────────────────────────────────────
        gold: '#FFD700',        // VSC verified badge
        trust: '#4CAF50',       // "Community Vouched" green
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
      },
      fontSize: {
        // Minimum body size 16px per accessibility requirement
        'body-sm': ['16px', { lineHeight: '1.6' }],
        'body':    ['17px', { lineHeight: '1.65' }],
        'body-lg': ['18px', { lineHeight: '1.7' }],  // Senior mode
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '28px',
        card: '16px',
      },
      boxShadow: {
        card:     '0 2px 8px rgba(0,0,0,0.08)',
        elevated: '0 8px 24px rgba(0,0,0,0.12)',
        glow:     '0 0 20px rgba(245,166,35,0.35)',
        'glow-teal': '0 0 20px rgba(0,90,112,0.3)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #F5A623 0%, #D4891A 100%)',
        'gradient-teal':    'linear-gradient(135deg, #007A96 0%, #005A70 100%)',
        'gradient-warm':    'linear-gradient(180deg, #FAFAF7 0%, #F7F5F0 100%)',
        'gradient-hero':    'linear-gradient(135deg, #005A70 0%, #003140 50%, #1A1A1A 100%)',
        'gradient-card':    'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,247,0.9) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,166,35,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245,166,35,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.3s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'pulse-gold':    'pulse-gold 2s infinite',
        shimmer:         'shimmer 1.5s infinite linear',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config
