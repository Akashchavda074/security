import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        cardForeground: "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        mutedForeground: "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        primaryForeground: "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        accentForeground: "hsl(var(--accent-foreground))",
        danger: "hsl(var(--danger))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(2,8,23,0.35)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0)), radial-gradient(circle at top left, rgba(39,174,96,0.18), transparent 36%), radial-gradient(circle at top right, rgba(250,204,21,0.14), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
