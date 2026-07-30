import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d0d0d",
        muted: "#6b6b6b",
        line: "#e5e5e5",
        brand: "#10a37f",
        "brand-dark": "#0e8e6e",
        canvas: "#fafafa",
      },
      borderRadius: {
        card: "12px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-pop": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .15s ease-out",
        "modal-pop": "modal-pop .18s cubic-bezier(.16,1,.3,1)",
        "toast-in": "toast-in .2s cubic-bezier(.16,1,.3,1)",
        "slide-up": "slide-up .2s ease-out",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(13,13,13,.04), 0 4px 16px rgba(13,13,13,.06)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
