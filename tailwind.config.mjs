/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: '#0F0F0F',
        foreground: '#FAFAFA',
        card: {
          DEFAULT: '#1C1C1C',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#252525',
          foreground: '#9CA3AF',
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#A855F7',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        border: '#333333',
        input: '#252525',
        ring: '#3B82F6',
        genre: {
          edm: '#3B82F6',
          techno: '#06B6D4',
          rock: '#EF4444',
          metal: '#9CA3AF',
          else: '#A855F7',
        },
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        full: '9999px',
      },
      fontFamily: {
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
