import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // DhiviHR vibrant green palette (matches catalogue theme)
        brand: {
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A6F4C5",
          300: "#6CE9A6",
          400: "#32D583",
          500: "#22C55E", // primary
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          soft: "#64748B",
        },
        accent: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#22C55E",
        background: "#FFFFFF",
        foreground: "#0F172A",
        card: { DEFAULT: "#FFFFFF", foreground: "#0F172A" },
        muted: { DEFAULT: "#F8FAFC", foreground: "#64748B" },
        destructive: { DEFAULT: "#B3261E", foreground: "#FFFFFF" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 6px 20px -10px rgba(15, 23, 42, 0.15)",
        card: "0 10px 30px -12px rgba(15, 23, 42, 0.18)",
        glow: "0 10px 30px -10px rgba(34, 197, 94, 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "blob-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "blob-float": "blob-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
