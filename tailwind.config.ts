import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb) / <alpha-value>)",
        accentPrimary: "rgb(var(--accent-rgb) / <alpha-value>)",
        textPrimary: "rgb(var(--text-rgb) / <alpha-value>)",
        textMuted: "var(--text-muted)",
        borderSubtle: "var(--border-subtle)",
        family: {
          50: "#f6f8f6",
          100: "#eaf1ea",
          200: "#d6e4d7",
          300: "#b5ceb7",
          400: "#8cb290",
          500: "#6a956f",
          600: "#517855",
          700: "#415f45",
          800: "#374d39",
          900: "#2d3e30",
          950: "#18231a",
        },
        warm: {
          50: "#faf8f5",
          100: "#f4f0e9",
          200: "#e9e2d5",
          300: "#d9ccb9",
          400: "#c4b097",
          500: "#b2987b",
          600: "#9f8266",
          700: "#806651",
          800: "#685344",
          900: "#554438",
          950: "#2d231c",
        },
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Cairo", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
