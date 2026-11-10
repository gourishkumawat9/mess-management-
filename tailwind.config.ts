import type { Config } from "tailwindcss";

// Palette: IIM Sambalpur maroon-red in place of the reference site's blue and
// dark blue. brand-600 is the main red, brand-900/950 replace the dark blue for
// deep sections, gold is the small accent, cream is the warm page background.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf3f4",
          100: "#fbe4e7",
          200: "#f5c4cb",
          300: "#ec95a2",
          400: "#de5b71",
          500: "#c8304a",
          600: "#a6192e",
          700: "#8a1426",
          800: "#6f1020",
          900: "#530c18",
          950: "#33060e",
        },
        gold: {
          100: "#fdf1d6",
          300: "#f6d27a",
          400: "#f1bd45",
          500: "#e0a21f",
        },
        cream: {
          50: "#fffcf7",
          100: "#fbf5ec",
          200: "#f4e9d8",
        },
        ink: "#22090e",
        veg: "#3ab757",
        nonveg: "#e43b4f",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(51,6,14,0.05), 0 8px 24px -8px rgba(51,6,14,0.12)",
        lift: "0 2px 4px rgba(51,6,14,0.06), 0 24px 48px -16px rgba(51,6,14,0.28)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        float: { "0%,100%": { transform: "translateY(0) rotate(var(--r,0deg))" }, "50%": { transform: "translateY(-10px) rotate(var(--r,0deg))" } },
        "page-in": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        float: "float 6s ease-in-out infinite",
        "page-in": "page-in .6s cubic-bezier(.22,1,.36,1) both",
        pop: "pop .35s ease-out",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(.22,1,.36,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
