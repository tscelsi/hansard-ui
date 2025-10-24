import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "light-text": "#131016",
        "light-bg": "#E6E4D4",
        "dark-text": "#E6E4D4",
        "dark-bg": "#120E17",
        "dark-grey": "#39373A",
        "light-grey": "#7D797F",
        "link-blue": "#527AFF",
        ALP: "#6C242A",
        LP: "#1E1B56",
      },
    },
  },
  plugins: [],
} satisfies Config;
