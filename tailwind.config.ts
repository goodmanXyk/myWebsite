import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#ffffff",
        muted: "#8f8f8f",
        line: "rgba(255, 255, 255, 0.06)",
        brand: "#0285ff",
        "brand-dark": "#003f7a",
        canvas: "#131313",
        surface: "#161616",
        "surface-2": "#1c1c1c",
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
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
        soft: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.4)",
        glow: "0 0 0 1px rgba(255,255,255,.06), 0 8px 30px rgba(0,0,0,.5)",
        "brand-glow": "0 8px 30px rgba(2,133,255,.20)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
