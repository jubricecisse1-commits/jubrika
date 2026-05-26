import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identité visuelle JUBRIKA
        jubrika: {
          noir: "#000000",
          blanc: "#FFFFFF",
          or: "#C9960C",
          "or-clair": "#E5B820",
          "or-sombre": "#A07A0A",
          "gris-fonce": "#111111",
          "gris-moyen": "#222222",
          "gris-clair": "#333333",
          "gris-texte": "#888888",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-jubrika": "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
        "gradient-or": "linear-gradient(135deg, #C9960C 0%, #E5B820 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-or": "pulseOr 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseOr: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
