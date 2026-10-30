/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Seven Sins palette: warm near-black ground, one blood red, bone text.
        background: '#0E0B0B',
        foreground: '#F2EEEE',
        card: {
          DEFAULT: '#1C1515',
          foreground: '#F2EEEE',
        },
        muted: {
          DEFAULT: '#261C1C',
          foreground: '#C7BDBD',
        },
        primary: {
          DEFAULT: '#D91A1A',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#FF5C5C',
          foreground: '#140D0D',
        },
        accent: {
          DEFAULT: '#E8DCDC',
          foreground: '#140D0D',
        },
        destructive: {
          DEFAULT: '#FF5C5C',
          foreground: '#140D0D',
        },
        ink: '#140D0D',
        border: '#3A2C2C',
        // Control edge, >= 3:1 against card and field (WCAG 1.4.11).
        input: '#857070',
        // Control fill, lighter than every surface a control sits on.
        field: '#241A1A',
        ring: '#FF5C5C',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        full: '9999px',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
