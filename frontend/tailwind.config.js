/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    // gradients / rings / shadows used in Featured card & tiles
    'aspect-[21/9]', 'aspect-[16/9]',
    'bg-[radial-gradient(1000px_400px_at_50%_-10%,rgba(92,120,255,.25),transparent_60%)]',
    'bg-[radial-gradient(1200px_520px_at_15%_-10%,rgba(92,120,255,.22),transparent_60%),radial-gradient(900px_420px_at_90%_0%,rgba(28,189,136,.18),transparent_55%)]',
    'shadow-[inset_0_-60px_120px_rgba(0,0,0,.35)]'
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      borderRadius: {
        lg: "0.85rem",
        xl: "1.15rem",
        "2xl": "1.35rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glow: "0 0 120px rgba(92,120,255,.16)",
        jungle: "0 0 120px rgba(28,189,136,.12)",
        card: "0 14px 44px rgba(0,0,0,.45)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

