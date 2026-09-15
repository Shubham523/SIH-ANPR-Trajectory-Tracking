/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '2px',
      },
      boxShadow: {
        'hard': '2px 2px 0px rgba(0,0,0,1)',
        'hard-sm': '1px 1px 0px rgba(0,0,0,1)',
        'none': 'none',
      }
    },
  },
  plugins: [],
}
