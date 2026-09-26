/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Outfit", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        // ── Tokens de marca: Slayed by Joana — Rosa refinado ──
        blush: {
          primary: "rgb(212 86 122)",   // #D4567A — identidad refinada (vs legacy #E56B9E)  | 222 95 125 anterior
          soft:    "rgb(242 208 221)",  // #F2D0DD
          pale:    "rgb(248 234 239)",  // #F8EAF0
          tint:    "rgb(251 241 245)",  // #FBF1F5
          deep:    "rgb(168 34 82)",    // #A82252
          hover:   "rgb(188 60 100)",   // #BC3C64
          bg:      "rgb(255 243 247)",  // #FFF3F7
        },
        onyx: {
          primary: "rgb(15 13 18)",     // #0F0D12 — negro premium más profundo
          soft:    "rgb(42 38 46)",     // #2A262E
          muted:   "rgb(110 105 115)",  // #6E6973
          border:  "rgb(215 210 218)",  // #D7D2DA
          hover:   "rgb(28 25 32)",     // #1C1920
        },
        cream: {
          warm: "rgb(253 248 243)",
          soft: "rgb(255 250 245)",
        },
        cocarde: {
          primary: "rgb(205 40 82)",
          soft:    "rgb(250 218 228)",
        },
        cool: {
          primary: "rgb(68 50 70)",
          soft:    "rgb(225 218 228)",
          border:  "rgb(200 193 205)",
        },
        white: {
          pure:  "rgb(255 255 255)",
          warm:  "rgb(253 248 243)",
        },

        // ── Mantener compatibilidad con sistema existente ──
        gold:       "rgb(var(--accent-rgb, 212 86 122) / <alpha-value>)",
        copper:     "rgb(var(--accent-rgb, 212 86 122) / <alpha-value>)",
        border:     "hsl(var(--border) / <alpha-value>)",
        input:      "hsl(var(--input) / <alpha-value>)",
        ring:       "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        primary: {
          DEFAULT:     "hsl(var(--primary) / <alpha-value>)",
          foreground:  "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:     "hsl(var(--secondary) / <alpha-value>)",
          foreground:  "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT:     "hsl(var(--destructive) / <alpha-value>)",
          foreground:  "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT:     "hsl(var(--muted) / <alpha-value>)",
          foreground:  "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT:     "hsl(var(--accent) / <alpha-value>)",
          foreground:  "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT:     "hsl(var(--popover) / <alpha-value>)",
          foreground:  "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT:     "hsl(var(--card) / <alpha-value>)",
          foreground:  "hsl(var(--card-foreground) / <alpha-value>)",
        },

        // ── Colores para uso en bg/border ──
        shadow: {
          subtle:      "0 1px 2px 0 rgba(15,13,18,0.04), 0 1px 3px 0 rgba(15,13,18,0.05)",
          card:        "0 2px 6px 0 rgba(15,13,18,0.04), 0 4px 12px -4px rgba(15,13,18,0.05)",
          "card-hover":"0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09)",
          glow:        "0 8px 32px -8px rgba(212,86,122,0.35)",
        },
      },
      boxShadow: {
        // ── Sombras premium refinadas ──
        "ds-sm":          "0 1px  2px  0 rgba(15,13,18,0.04),  0 1px  3px  0 rgba(15,13,18,0.05)",
        "ds-card":        "0 2px  6px  0 rgba(15,13,18,0.04),  0 4px 12px -4px rgba(15,13,18,0.05)",
        "ds-card-hover":  "0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09)",
        "ds-glow":        "0 8px 32px -8px rgba(212,86,122,0.35)",
        "ds-glow-soft":   "0 4px 20px -6px  rgba(212,86,122,0.18)",
        "ds-lg":          "0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09)",
        "ds-xl":          "0 16px 48px -10px rgba(15,13,18,0.15), 0 6px 16px -6px rgba(15,13,18,0.06)",
        "ds-elevated":    "0 4px 16px -4px rgba(15,13,18,0.05), 0 10px 32px -10px rgba(15,13,18,0.08)",
        "ds-popover":     "0 6px 18px -4px rgba(15,13,18,0.06), 0 2px 8px -4px rgba(15,13,18,0.04)",
        "ds-ring":        "0 0 0 3px rgba(212,86,122,0.16)",
        "ds-button":      "0 2px 4px -2px rgba(212,86,122,0.18), 0 4px 10px -4px rgba(212,86,122,0.10)",
        "ds-button-hover":"0 4px 10px -2px rgba(212,86,122,0.28), 0 8px 20px -6px rgba(212,86,122,0.14)",
        // Legacy
        goldGlow: "0 8px 32px -8px rgba(212,86,122,0.35)",
      },
      borderRadius: {
        "ds-sm":   "6px",
        "ds-md":   "10px",
        "ds-lg":   "14px",
        "ds-xl":   "18px",
        "ds-2xl":  "24px",
        "ds-pill": "9999px",
        "ds-circle":"50%",
        "ds-card": "18px",
        "ds-button":"10px",
        "ds-input": "8px",
        "ds-badge": "6px",
        "ds-modal": "24px",
        "ds-toast": "14px",
        "ds-chip":  "100px",
        "ds-tabs":  "12px",
      },
      spacing: {
        "ds-xs":  "4px",
        "ds-sm":  "8px",
        "ds-sm2": "10px",
        "ds-md":  "16px",
        "ds-md2": "20px",
        "ds-lg":  "24px",
        "ds-lg2": "32px",
        "ds-xl":  "40px",
        "ds-xl2": "48px",
        "ds-2xl": "64px",
        "ds-3xl": "96px",
        "ds-section": "120px",
        "ds-heading-lg": "clamp(2.5rem, 5vw, 4rem)",
        "ds-heading-md": "clamp(1.75rem, 3.5vw, 2.75rem)",
        "ds-heading-sm": "clamp(1.25rem, 2vw, 1.75rem)",
        "ds-paragraph":  "1rem",
        "ds-line":       "1.6",
      },
      keyframes: {
        "ds-fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "ds-scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "ds-marquee": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "ds-float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "ds-fade-in":  "ds-fade-in 0.4s ease-out both",
        "ds-scale-in": "ds-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ds-marquee":  "ds-marquee 28s linear infinite",
        "ds-float":    "ds-float-slow 6s ease-in-out infinite",
        shimmer:       "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
