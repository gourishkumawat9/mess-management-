import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe1e3",
          200: "#ffc8cc",
          500: "#ef4f5f",
          600: "#e23744",
          700: "#c41f2d",
          800: "#a01b27",
        },
        veg: "#3ab757",
        nonveg: "#e43b4f",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,28,28,0.06), 0 4px 16px rgba(28,28,28,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
