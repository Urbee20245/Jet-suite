/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./InternalApp.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./tools/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        'brand-dark': '#0F172A',
        'brand-darker': '#020617',
        'brand-light': '#F1F5F9',
        'brand-card': '#FFFFFF',
        'brand-text': '#0F172A',
        'brand-text-muted': '#64748B',
        'brand-border': '#E2E8F0',
        'accent-blue': '#3B82F6',
        'accent-purple': '#8B5CF6',
        'accent-pink': '#EC4899',
        'accent-cyan': '#06B6D4',
        'pomelli-dark': '#1C1C17',
        'pomelli-card': '#2E2E2A',
        'pomelli-text': '#E3E3E3',
        'pomelli-text-muted': '#A0A093',
        'pomelli-accent': '#D4ED31',
        'pomelli-accent-dark': '#2E2E2A'
      }
    }
  },
  plugins: [],
}
