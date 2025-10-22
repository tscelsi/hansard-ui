import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "light-text": "#131016",
        "light-bg": "#E6E4D4",
        "dark-text": "#E6E4D4",
        "dark-bg": "#120E17",
      }
    },
  },
  plugins: [],
} satisfies Config
