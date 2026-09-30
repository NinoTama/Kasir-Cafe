import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f6f1e4",
        paper: "#fffdf8",
        ink: "#241c16",
        pine: { DEFAULT: "#2c4a3b", dark: "#1c3229" },
        brick: { DEFAULT: "#a8402c", dark: "#8a3222" },
        gold: "#c69a3d",
        line: "#ded2b6",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
