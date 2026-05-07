/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'primary-color': 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        'secondary-color': 'var(--secondary-color)',
        'secondary-hover': 'var(--secondary-hover)',
        'accent-color': 'var(--accent-color)',
        'danger-color': 'var(--danger-color)',
        'warning-color': 'var(--warning-color)',
        'bg-color': 'var(--bg-color)',
        'surface-color': 'var(--surface-color)',
        'surface-hover': 'var(--surface-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
      }
    },
  },
  plugins: [],
}
