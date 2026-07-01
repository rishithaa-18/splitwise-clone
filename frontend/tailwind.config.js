/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0F9D6E', dark: '#0B7C58', light: '#E6F6EF' },
        ink: '#1F2937',
        muted: '#6B7280',
        surface: '#F6F7F9',
        line: '#E7E9EC',
        danger: '#DC2626',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};