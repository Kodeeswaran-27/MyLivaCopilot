/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          light: 'var(--primary-light)',
        },
        ambient: {
          1: 'var(--ambient-shape-1)',
          2: 'var(--ambient-shape-2)',
          3: 'var(--ambient-shape-3)',
        },
        themeText: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          light: 'var(--text-light)',
        },
        card: {
          DEFAULT: 'var(--card-bg)',
          light: 'var(--card-bg-light)',
        },
        border: 'var(--border-color)',
        dark: {
          DEFAULT: 'var(--bg-dark)',
          darker: 'var(--bg-darker)',
        },
      },
      backgroundImage: {
        'main-gradient': 'var(--bg-gradient)',
        'hex-border': 'var(--premium-hex-border)',
        'glow-effect': 'var(--glow-effect)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
