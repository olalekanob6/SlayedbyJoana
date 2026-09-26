/**
 * Slayed by Joana — Design System (refined v2)
 * -------------------------------------------------------
 * Sistema visual premium de belleza femenina elegante.
 * Identidad: negro + rosa refinado + premium editorial.
 * Eleva a nivel "marca de belleza profesional".
 *
 * Uso:
 *   import { css, brand, spacing, typography, shadows } from './design-system'
 *
 *   // Inyectar CSS en el documento
 *   css.inject()
 *
 *   // Usar en inline styles
 *   <div style={{ padding: spacing.md, color: brand.text.primary }} />
 *
 *   // Leer un token individual
 *   brand.primary.rgb  // [212, 86, 122]
 *   brand.colors.blush.primary  // "rgb(212 86 122)"
 */

// ─────────────────────────────────────────────────
// 1. COLOR PALETTE — Rosa refinado, negro premium
// ─────────────────────────────────────────────────

/**
 * Refinamiento del rosa #E56B9E (legacy) → #D4567A (editorial beauty brand).
 * Mantiene la identidad pero menos saturable, más maduro.
 */
const colors = {
  /** Blush — Rosa identidad (escala de 7 tonos) */
  blush: {
    primary: "rgb(212 86 122)",   // #D4567A — identidad, CTAs, hover principal (refinado vs legacy #E56B9E)
    hover:   "rgb(188 60 100)",   // #BC3C64 — hover elementos interactivos
    deep:    "rgb(168 34 82)",    // #A82252 — estado activo, accents profundos
    soft:    "rgb(242 208 221)",  // #F2D0DD — fondos sutiles, bordes suaves
    pale:    "rgb(248 234 239)",  // #F8EAF0 — alternancia, hover ligero
    tint:    "rgb(251 241 245)",  // #FBF1F5 — bg casi-blanco con sugerencia rosa
    bg:      "rgb(255 243 247)",  // #FFF3F7 — fondo página (off-white rosa puro)
  },

  /** Onyx — Negro/charcoal premium (no puro #000) */
  onyx: {
    primary: "rgb(15 13 18)",     // #0F0D12 — texto primario, fondos dark
    soft:    "rgb(42 38 46)",     // #2A262E — texto secundario
    muted:   "rgb(110 105 115)",  // #6E6973 — texto discreto, etiquetas
    border:  "rgb(215 210 218)",  // #D7D2DA — bordes sutiles
    hover:   "rgb(28 25 32)",     // #1C1920 — hover dark
  },

  /** Blancos — Pure + warm variants */
  white: {
    pure:    "rgb(255 255 255)",  // #FFFFFF — white puro (cards premium)
    warm:    "rgb(253 248 243)",  // #FDF8F3 — tint caliente alternativo
  },

  /** Cocarde — Rosa chillón reservado (logos, badges hero, CTAs de impacto) */
  cocarde: {
    primary: "rgb(205 40 82)",    // #CD2852 — acento fuerte, uso esporádico
    soft:    "rgb(250 218 228)",  // #FAD6E4 — bg suave cocarde
  },

  /** Cool — Complemento atmosférico (evita saturación rosa) */
  cool: {
    primary: "rgb(68 50 70)",     // #443246 — plum suave, equilibrio térmico
    soft:    "rgb(225 218 228)",  // #E1DAE4 — fondos cool
    border:  "rgb(200 193 205)",  // #C8C1CD — borde cool, divider por defecto
  },

  /** Legacy — Acento dorado (compatibilidad con estilos existentes) */
  legacy: {
    primary: "rgb(229 107 158)",  // #E56B9E — accent legacy / gold glow
    soft:    "rgb(249 201 221)",  // #F9C9DD — bg suave legacy
    hover:   "rgb(209 77 129)",   // #D14D81 — hover legacy
  },
};

/** Tuplas RGB para box-shadow, glows, gradients */
const _rgb = (c) => c.replace("rgb(", "").replace(")", "").split(" ").map(Number);

const brandRgb = {
  blush:  { primary: _rgb(colors.blush.primary), hover: _rgb(colors.blush.hover), deep: _rgb(colors.blush.deep) },
  onyx:   { primary: _rgb(colors.onyx.primary),  soft: _rgb(colors.onyx.soft) },
  white:  { pure: _rgb(colors.white.pure) },
  cocarde:{ primary: _rgb(colors.cocarde.primary) },
  legacy: { primary: _rgb(colors.legacy.primary) },
};

/**
 * Obtener color por token.compound, ej: brand.color("blush.primary") → "rgb(212 86 122)"
 */
const brand = {
  name: "Slayed by Joana",
  tagline: "Elegancia con carácter",
  colors,
  rgb: brandRgb,
  color: (token) => {
    const [group, key] = token.split(".");
    return colors[group]?.[key] ?? colors.onyx.primary;
  },
};

// ─────────────────────────────────────────────────
// 2. TYPOGRAPHY — Playfair Display + Outfit
// ─────────────────────────────────────────────────

const typography = {
  font: {
    display: "\"Playfair Display\", Georgia, serif",
    body:    "\"Outfit\", system-ui, sans-serif",
  },

  /** Jerarquía de display (Playfair Display) */
  display: {
    h1: { fontSize: "clamp(2.75rem, 6.5vw, 4.5rem)", lineHeight: 1.05, letterSpacing: "-0.025em", weight: 700 },
    h2: { fontSize: "clamp(2rem, 4vw, 3.25rem)",    lineHeight: 1.1,  letterSpacing: "-0.02em",  weight: 600 },
    h3: { fontSize: "clamp(1.5rem, 2.8vw, 2.25rem)",lineHeight: 1.15, letterSpacing: "-0.015em", weight: 600 },
    h4: { fontSize: "1.375rem",                     lineHeight: 1.2,  letterSpacing: "-0.01em",  weight: 600 },
  },

  /** Jerarquía de cuerpo (Outfit) */
  body: {
    base:   { fontSize: "1rem",        lineHeight: 1.6,  weight: 400 },
    sm:     { fontSize: "0.875rem",    lineHeight: 1.55, weight: 400 },
    xs:     { fontSize: "0.75rem",     lineHeight: 1.5,  weight: 400 },
    label:  { fontSize: "0.75rem",     lineHeight: 1.4,  weight: 500 },
    caption:{ fontSize: "0.65rem",     lineHeight: 1.4,  weight: 400 },
    micro:  { fontSize: "0.6rem",      lineHeight: 1.4,  weight: 500 },
  },

  /** Tipos preconfigurados para componentes comunes */
  preset: {
    eyebrow:         { fontFamily: typography.font.display, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", weight: 500 },
    heroTag:         { fontFamily: typography.font.display, fontSize: "0.8rem",  letterSpacing: "0.04em", weight: 400, fontStyle: "italic" },
    navLink:         { fontFamily: typography.font.body,    fontSize: "0.8rem",  fontWeight: 500 },
    priceValue:      { fontFamily: typography.font.display, fontSize: "1rem",    fontWeight: 600 },
    testimonial:     { fontFamily: typography.font.body,    fontSize: "0.95rem", lineHeight: 1.65, fontWeight: 400, fontStyle: "italic" },
    testimonialAttr: { fontFamily: typography.font.body,    fontSize: "0.7rem",  lineHeight: 1.4,  fontWeight: 500 },
    formLabel:       { fontFamily: typography.font.body,    fontSize: "0.75rem", fontWeight: 500 },
    badge:           { fontFamily: typography.font.body,    fontSize: "0.6rem",  fontWeight: 600 },
    footerLink:      { fontFamily: typography.font.body,    fontSize: "0.8rem",  fontWeight: 400 },
  },
};

// ─────────────────────────────────────────────────
// 3. SPACING — base 4px
// ─────────────────────────────────────────────────

const spacing = {
  xs:    "4px",
  sm:    "8px",
  sm2:   "10px",
  md:    "16px",
  md2:   "20px",
  lg:    "24px",
  lg2:   "32px",
  xl:    "40px",
  xl2:   "48px",
  "2xl": "64px",
  "3xl": "96px",
  section: "120px",
  page:    "calc(100vh - 72px)",
};

// ─────────────────────────────────────────────────
// 4. BORDER RADIUS
// ─────────────────────────────────────────────────

const radius = {
  sm:     "6px",
  md:     "10px",     // inputs
  lg:     "14px",     // botones pequeños
  xl:     "18px",     // cards
  "2xl":  "24px",     // modales
  pill:   "9999px",
  circle: "50%",
  button: "10px",
  input:  "8px",
  card:   "18px",
  badge:  "6px",
  modal:  "24px",
  toast:  "14px",
  chip:   "100px",
  tabs:   "12px",
};

// ─────────────────────────────────────────────────
// 5. SHADOWS — premium, suaves, atmosféricos
// ─────────────────────────────────────────────────

/**
 * Sombras refinadas: menos "pesadas", más definidas.
 * Uso esporádico de glow rosa para hero/logo.
 */
const shadows = {
  /** Subtle — inputs, iconos, elementos ligeros */
  subtle: "0 1px 2px 0 rgba(15,13,18,0.04), 0 1px 3px 0 rgba(15,13,18,0.05)",

  /** Card — producto estándar */
  card: "0 2px 6px 0 rgba(15,13,18,0.04), 0 4px 12px -4px rgba(15,13,18,0.05)",

  /** Card hover — elevación sutil */
  "card-hover": "0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09)",

  /** Button — primario */
  button: "0 2px 4px -2px rgba(212,86,122,0.18), 0 4px 10px -4px rgba(212,86,122,0.10)",

  /** Button hover */
  "button-hover": "0 4px 10px -2px rgba(212,86,122,0.28), 0 8px 20px -6px rgba(212,86,122,0.14)",

  /** Input focus ring */
  ring: "0 0 0 3px rgba(212,86,122,0.16)",

  /** Modal backdrop */
  backdrop: "0 8px 32px -8px rgba(15,13,18,0.15)",

  /** Modal elevated */
  modal: "0 16px 48px -10px rgba(15,13,18,0.15), 0 6px 16px -6px rgba(15,13,18,0.06)",

  /** Glow — luz difusa rosa (hero, logos, esporádico) */
  glow: "0 8px 32px -8px rgba(212,86,122,0.35)",

  /** Glow suave — texturas atmosféricas */
  "glow-soft": "0 4px 20px -6px rgba(212,86,122,0.18)",

  /** Elevated card — pricing, testimonials destacados */
  elevated: "0 4px 16px -4px rgba(15,13,18,0.05), 0 10px 32px -10px rgba(15,13,18,0.08)",

  /** Dropdown / popover */
  popover: "0 6px 18px -4px rgba(15,13,18,0.06), 0 2px 8px -4px rgba(15,13,18,0.04)",
};

// ─────────────────────────────────────────────────
// 6. GRADIENTS
// ─────────────────────────────────────────────────

const gradients = {
  blushHero: "linear-gradient(135deg, rgb(212 86 122) 0%, rgb(168 34 82) 100%)",
  blushSoft: "linear-gradient(135deg, rgb(251 241 245) 0%, rgb(242 208 221) 100%)",
  blushText: "linear-gradient(120deg, rgb(212 86 122) 0%, rgb(242 208 221) 45%, rgb(188 60 100) 100%)",
  creamWarm: "linear-gradient(180deg, rgb(253 248 243) 0%, rgb(255 250 245) 100%)",
  glass:     "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
  onyxGlass: "linear-gradient(135deg, rgba(15,13,18,0.85) 0%, rgba(15,13,18,0.55) 100%)",
};

// ─────────────────────────────────────────────────
// 7. OPACITY SCALE
// ─────────────────────────────────────────────────

const opacity = {
  "5":  "0.05", "10": "0.10", "15": "0.15", "20": "0.20",
  "30": "0.30", "40": "0.40", "50": "0.50", "60": "0.60",
  "70": "0.70", "75": "0.75", "80": "0.80", "90": "0.90",
};

// ─────────────────────────────────────────────────
// 8. Z-INDEX SCALE
// ─────────────────────────────────────────────────

const zIndex = {
  base:            0,
  dropdown:        100,
  sticky:          200,
  overlay:         300,
  modalBackdrop:   400,
  modal:           401,
  popover:         500,
  tooltip:         600,
  toast:           700,
  notification:    800,
};

// ─────────────────────────────────────────────────
// 9. TRANSITIONS
// ─────────────────────────────────────────────────

const transitions = {
  fast:   "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base:   "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow:   "400ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
};

// ─────────────────────────────────────────────────
// 10. COMPONENT DESIGN TOKENS
// ─────────────────────────────────────────────────

const components = {
  /** Botones */
  button: {
    height: "44px",
    fontSize: "0.875rem",
    fontFamily: typography.font.body,
    fontWeight: 600,
    letterSpacing: "0.01em",
    radius: radius.button,
    paddingHorizontal: "22px",

    primary: {
      bg: colors.blush.primary,
      bgHover: colors.blush.hover,
      bgActive: colors.blush.deep,
      text: "#ffffff",
      textHover: "#ffffff",
      shadow: shadows.button,
      shadowHover: shadows["button-hover"],
    },
    secondary: {
      bg: "transparent",
      bgHover: colors.blush.tint,
      bgActive: colors.blush.pale,
      text: colors.blush.primary,
      border: colors.blush.soft,
      borderHover: colors.blush.primary,
      textActive: colors.onyx.primary,
    },
    ghost: {
      bg: "transparent",
      bgHover: colors.blush.tint,
      bgActive: colors.blush.pale,
      text: colors.onyx.soft,
      textHover: colors.blush.primary,
    },
    danger: {
      bg: colors.cocarde.primary,
      bgHover: "rgb(168 20 60)",
      text: "#ffffff",
    },
    disabled: {
      bg: colors.onyx.muted,
      bgHover: colors.onyx.muted,
      text: "rgba(255,255,255,0.4)",
    },
  },

  /** Inputs */
  input: {
    height: "48px",
    fontSize: "0.9rem",
    fontFamily: typography.font.body,
    fontWeight: 400,
    radius: radius.input,
    bg: colors.white.pure,
    bgFocused: colors.white.pure,
    border: colors.onyx.border,
    borderHover: colors.blush.soft,
    borderFocused: colors.blush.primary,
    text: colors.onyx.primary,
    textPlaceholder: "rgba(15,13,18,0.30)",
    ring: shadows.ring,
    shadow: shadows.subtle,
  },

  /** Cards */
  card: {
    bg: colors.white.pure,
    border: colors.cool.border,
    radius: radius.card,
    shadow: shadows.card,
    shadowHover: shadows["card-hover"],
    padding: "24px",
    borderWidth: "1px",
    headerBg: colors.blush.tint,
    bodyBg: colors.white.pure,
    footerBg: "transparent",
  },

  /** Badges */
  badge: {
    radius: radius.badge,
    fontSize: typography.preset.badge.fontSize,
    fontWeight: typography.preset.badge.fontWeight,
    fontFamily: typography.font.body,
    available: { bg: "rgba(212,86,122,0.10)", text: colors.blush.deep, border: "rgba(212,86,122,0.15)" },
    full:      { bg: "rgba(15,13,18,0.06)",  text: colors.onyx.soft,  border: "rgba(15,13,18,0.08)" },
    closed:    { bg: "rgba(15,13,18,0.03)",  text: colors.onyx.muted, border: "rgba(15,13,18,0.05)" },
    featured:  { bg: colors.blush.primary,    text: "#ffffff",          border: "none" },
    new:       { bg: colors.white.warm,       text: colors.onyx.primary, border: "rgba(253,248,243,0.5)" },
    error:     { bg: "rgba(170,30,50,0.10)", text: "rgb(168,20,50)",  border: "rgba(170,30,50,0.15)" },
  },

  divider: {
    color: colors.cool.border,
    opacity: 0.4,
    style: "solid",
  },

  chip: {
    height: "26px",
    fontSize: "0.7rem",
    fontWeight: 600,
    fontFamily: typography.font.body,
    radius: radius.chip,
    bg: colors.blush.tint,
    bgSelected: colors.blush.soft,
    text: colors.onyx.primary,
    textSelected: "#ffffff",
    border: colors.blush.soft,
    borderSelected: "none",
    gap: "5px",
  },

  progress: {
    height: "5px",
    radius: "9999px",
    trackBg: "rgba(15,13,18,0.05)",
    trackBgMuted: "rgba(15,13,18,0.03)",
    fill: colors.blush.primary,
    fillSuccess: "rgb(68 150 95)",
    fillWarning: "rgb(195 135 35)",
    labelSize: "0.65rem",
    labelColor: colors.onyx.muted,
  },
};

// ─────────────────────────────────────────────────
// FULL CSS — clases utilitarias + componentes
// ─────────────────────────────────────────────────

const css = `
/* ============================================================
   Slayed by Joana — DESIGN SYSTEM CSS (v2 refined)
   ============================================================ */

/* ─── BASE ──────────────────────────────────────────── */
@layer base {
  /* Scrollbar premium femenino */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--ds-bg-page, #fff); }
  ::-webkit-scrollbar-thumb {
    background: var(--ds-border-subtle, #d7d2da);
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--ds-blush-soft, #f2d0dd); }

  /* Selection elegante */
  ::selection {
    background: var(--ds-blush-primary, #d4567a);
    color: #ffffff;
  }

  html { scroll-behavior: smooth; }
}

/* ─── VARIABLES CSS ─────────────────────────────────── */
@layer base {
  :root {
    /* ── Fuentes ── */
    --ds-font-display: "Playfair Display", Georgia, serif;
    --ds-font-body:    "Outfit", system-ui, sans-serif;

    /* ── Blush — Rosa identidad refinado ── */
    --ds-blush-primary:  rgb(212 86 122);   /* #D4567A — identidad, CTAs */
    --ds-blush-hover:    rgb(188 60 100);   /* #BC3C64 — hover interactivos */
    --ds-blush-deep:     rgb(168 34 82);    /* #A82252 — estado activo */
    --ds-blush-soft:     rgb(242 208 221);  /* #F2D0DD — fondos sutiles */
    --ds-blush-pale:     rgb(248 234 239);  /* #F8EAF0 — alternancia */
    --ds-blush-tint:     rgb(251 241 245);  /* #FBF1F5 — bg casi-blanco */
    --ds-blush-bg:       rgb(255 243 247);  /* #FFF3F7 — fondo página */

    /* ── Onyx — Negro premium ── */
    --ds-onyx-primary:   rgb(15 13 18);     /* #0F0D12 */
    --ds-onyx-soft:      rgb(42 38 46);     /* #2A262E */
    --ds-onyx-muted:     rgb(110 105 115);  /* #6E6973 */
    --ds-onyx-border:    rgb(215 210 218);  /* #D7D2DA */
    --ds-onyx-hover:     rgb(28 25 32);     /* #1C1920 */

    /* ── Blancos ── */
    --ds-white-pure:     rgb(255 255 255);  /* #FFFFFF */
    --ds-white-warm:     rgb(253 248 243);  /* #FDF8F3 */

    /* ── Cocarde — uso reservado ── */
    --ds-cocarde-primary: rgb(205 40 82);   /* #CD2852 */
    --ds-cocarde-soft:    rgb(250 218 228); /* #FAD6E4 */

    /* ── Cool — complemento ── */
    --ds-cool-primary:   rgb(68 50 70);     /* #443246 */
    --ds-cool-soft:      rgb(225 218 228);  /* #E1DAE4 */
    --ds-cool-border:    rgb(200 193 205);  /* #C8C1CD */

    /* ── Legacy — compatibilidad ── */
    --ds-legacy-primary: rgb(229 107 158);  /* #E56B9E */
    --ds-legacy-soft:    rgb(249 201 221);  /* #F9C9DD */
    --ds-legacy-hover:   rgb(209 77 129);   /* #D14D81 */

    /* ── Fondos ── */
    --ds-bg-page:         var(--ds-blush-bg);
    --ds-bg-elevated:     var(--ds-white-pure);
    --ds-bg-muted:        var(--ds-white-warm);
    --ds-bg-accent:       var(--ds-blush-tint);
    --ds-bg-ghost:        transparent;
    --ds-bg-inset:        var(--ds-white-warm);
    --ds-bg-glass:        rgba(255,255,255,0.72);
    --ds-bg-glass-border: rgba(255,255,255,0.35);

    /* ── Texto ── */
    --ds-text-primary:    var(--ds-onyx-primary);
    --ds-text-secondary:  var(--ds-onyx-soft);
    --ds-text-muted:      var(--ds-onyx-muted);
    --ds-text-inverse:    var(--ds-white-pure);
    --ds-text-accent:     var(--ds-blush-deep);
    --ds-text-ghost:      var(--ds-onyx-soft);

    /* ── Bordes ── */
    --ds-border-subtle:   var(--ds-onyx-border);
    --ds-border-default:  var(--ds-cool-border);
    --ds-border-blush:    var(--ds-blush-soft);
    --ds-border-strong:   var(--ds-blush-primary);
    --ds-border-onion:    transparent;

    /* ── Sombras ── */
    --ds-shadow-sm:         0 1px  2px  0 rgba(15,13,18,0.04),  0 1px  3px  0 rgba(15,13,18,0.05);
    --ds-shadow-md:         0 2px  6px  0 rgba(15,13,18,0.04),  0 4px 12px -4px rgba(15,13,18,0.05);
    --ds-shadow-lg:         0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09);
    --ds-shadow-xl:         0 16px 48px -10px rgba(15,13,18,0.15), 0 6px 16px -6px rgba(15,13,18,0.06);
    --ds-shadow-glow:       0 8px 32px -8px rgba(212,86,122,0.35);
    --ds-shadow-glow-soft:  0 4px 20px -6px rgba(212,86,122,0.18);
    --ds-shadow-elevated:   0 4px 16px -4px rgba(15,13,18,0.05), 0 10px 32px -10px rgba(15,13,18,0.08);
    --ds-shadow-popover:    0 6px 18px -4px rgba(15,13,18,0.06), 0 2px 8px -4px rgba(15,13,18,0.04);
    --ds-shadow-button:     0 2px 4px -2px rgba(212,86,122,0.18), 0 4px 10px -4px rgba(212,86,122,0.10);
    --ds-shadow-button-hover: 0 4px 10px -2px rgba(212,86,122,0.28), 0 8px 20px -6px rgba(212,86,122,0.14);
    --ds-shadow-card-hover:  0 6px 14px -4px rgba(15,13,18,0.06), 0 10px 28px -8px rgba(15,13,18,0.09);
    --ds-ring-color:        rgba(212, 86, 122, 0.16);
    --ds-ring-width:        3px;

    /* ── Animaciones ── */
    --ds-anim-fade-in:     0.4s ease-out;
    --ds-anim-slide-up:    0.5s cubic-bezier(0.16, 1, 0.3, 1);
    --ds-anim-scale-in:    0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* ─── BOTONES ─────────────────────────────────────── */
@layer components {
  .ds-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 22px;
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1;
    border-radius: 10px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: all var(--ds-transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));
    position: relative;
    user-select: none;
    white-space: nowrap;
    text-decoration: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  .ds-btn:active { transform: scale(0.97); }
  .ds-btn:disabled,
  .ds-btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  .ds-btn:focus-visible {
    outline: 2px solid var(--ds-blush-primary);
    outline-offset: 3px;
  }

  /* Primario */
  .ds-btn-primary {
    background: var(--ds-blush-primary);
    border-color: var(--ds-blush-primary);
    color: var(--ds-text-inverse);
    box-shadow: var(--ds-shadow-button);
  }
  .ds-btn-primary:hover {
    background: var(--ds-blush-hover);
    border-color: var(--ds-blush-hover);
    box-shadow: var(--ds-shadow-button-hover);
    transform: translateY(-1px);
  }
  .ds-btn-primary:active {
    background: var(--ds-blush-deep);
    border-color: var(--ds-blush-deep);
    transform: translateY(0) scale(0.97);
  }

  /* Secundario */
  .ds-btn-secondary {
    background: transparent;
    border-color: var(--ds-blush-soft);
    color: var(--ds-blush-primary);
    box-shadow: none;
  }
  .ds-btn-secondary:hover {
    background: var(--ds-blush-tint);
    border-color: var(--ds-blush-primary);
    color: var(--ds-onyx-primary);
    box-shadow: var(--ds-shadow-md);
  }
  .ds-btn-secondary:active {
    background: var(--ds-blush-pale);
    border-color: var(--ds-blush-primary);
    color: var(--ds-onyx-primary);
    transform: translateY(0) scale(0.97);
  }

  /* Ghost */
  .ds-btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--ds-text-secondary);
    box-shadow: none;
  }
  .ds-btn-ghost:hover {
    background: var(--ds-blush-tint);
    color: var(--ds-blush-primary);
  }
  .ds-btn-ghost:active {
    background: var(--ds-blush-pale);
    color: var(--ds-blush-primary);
    transform: translateY(0) scale(0.97);
  }

  /* Danger */
  .ds-btn-danger {
    background: var(--ds-cocarde-primary);
    border-color: var(--ds-cocarde-primary);
    color: var(--ds-text-inverse);
    box-shadow: var(--ds-shadow-button);
  }
  .ds-btn-danger:hover {
    background: rgb(168 20 60);
    border-color: rgb(168 20 60);
    box-shadow: var(--ds-shadow-button-hover);
    transform: translateY(-1px);
  }

  /* Tamaños */
  .ds-btn-sm  { height: 34px; padding: 0 14px; font-size: 0.75rem; border-radius: 8px; }
  .ds-btn-lg  { height: 52px; padding: 0 32px; font-size: 0.95rem; border-radius: 12px; }
  .ds-btn-block { width: 100%; }

  /* Loading */
  .ds-btn-loading { pointer-events: none; opacity: 0.7; }
  .ds-btn-loading .ds-btn-label { visibility: hidden; }
  .ds-btn-loading::after {
    content: "";
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ds-spin 0.7s linear infinite;
  }
  @keyframes ds-spin { to { transform: rotate(360deg); } }
}

/* ─── INPUTS ─────────────────────────────────────── */
@layer components {
  .ds-input-wrap { display: flex; flex-direction: column; gap: 6px; }

  .ds-input-label {
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--ds-text-secondary);
    letter-spacing: 0.02em;
  }

  .ds-input {
    display: block;
    width: 100%;
    height: 48px;
    padding: 0 14px;
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.9rem;
    font-weight: 400;
    color: var(--ds-text-primary);
    background: var(--ds-bg-elevated, #ffffff);
    border: 1.5px solid var(--ds-border-subtle);
    border-radius: 8px;
    box-shadow: var(--ds-shadow-sm);
    transition: all 0.2s ease;
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  .ds-input::placeholder { color: rgba(15,13,18,0.30); font-weight: 400; }
  .ds-input:hover { border-color: var(--ds-blush-soft); }
  .ds-input:focus {
    border-color: var(--ds-blush-primary);
    box-shadow: var(--ds-ring-color);
  }
  .ds-input:disabled {
    background: var(--ds-bg-muted, #fdf8f3);
    color: var(--ds-text-muted);
    cursor: not-allowed;
    border-color: var(--ds-border-subtle);
    opacity: 0.7;
  }
  .ds-input-error { border-color: rgba(168,30,50,0.35); }
  .ds-input-error:focus {
    box-shadow: 0 0 0 3px rgba(168,30,50,0.12);
    border-color: rgba(168,30,50,0.45);
  }
  .ds-input-hint { font-size: 0.7rem; color: var(--ds-text-muted); margin-top: 2px; }
  .ds-input-error-hint { font-size: 0.7rem; color: rgba(168,20,50,0.85); margin-top: 2px; }

  /* Select */
  .ds-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232A262E' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .ds-select:focus {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4567A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  }

  /* Checkbox / Radio */
  .ds-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  .ds-checkbox input[type="checkbox"],
  .ds-checkbox input[type="radio"] { display: none; }
  .ds-checkbox .ds-checkbox-box {
    width: 18px; height: 18px;
    border: 1.5px solid var(--ds-border-subtle);
    border-radius: 5px;
    background: var(--ds-bg-elevated, #ffffff);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  .ds-checkbox input[type="checkbox"]:checked + .ds-checkbox-box {
    background: var(--ds-blush-primary);
    border-color: var(--ds-blush-primary);
  }
  .ds-checkbox input[type="checkbox"]:checked + .ds-checkbox-box::after {
    content: "";
    display: block;
    width: 5px; height: 9px;
    border: 2px solid #ffffff;
    border-top: none;
    border-right: none;
    transform: rotate(-45deg) translate(1px, -1px);
  }
  .ds-checkbox input[type="checkbox"]:focus-visible + .ds-checkbox-box {
    outline: 2px solid var(--ds-blush-primary);
    outline-offset: 2px;
  }
  .ds-checkbox-disk { border-radius: 50%; }
  .ds-checkbox input[type="radio"]:checked + .ds-checkbox-box::after {
    content: "";
    width: 7px; height: 7px;
    background: #ffffff;
    border-radius: 50%;
  }
}

/* ─── CARDS ─────────────────────────────────────── */
@layer components {
  .ds-card {
    background: var(--ds-bg-elevated, #ffffff);
    border: 1px solid var(--ds-border-default, #c8c1cd);
    border-radius: 18px;
    box-shadow: var(--ds-shadow-md);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  .ds-card-hoverable:hover {
    box-shadow: var(--ds-shadow-lg);
    transform: translateY(-2px);
    border-color: var(--ds-blush-soft);
  }
  .ds-card-header {
    padding: 18px 24px 0;
    background: var(--ds-blush-tint);
    border-bottom: 1px solid var(--ds-border-subtle);
  }
  .ds-card-body { padding: 20px 24px; }
  .ds-card-footer {
    padding: 14px 24px;
    border-top: 1px solid var(--ds-border-subtle);
    background: transparent;
  }
  .ds-card-flat { border-width: 0; box-shadow: none; }

  /* Ratios */
  .ds-card-ratio { aspect-ratio: var(--ds-card-ratio, 3/4); display: block; }
  .ds-card-ratio-square   { --ds-card-ratio: 1/1; }
  .ds-card-ratio-portrait { --ds-card-ratio: 3/4; }
  .ds-card-ratio-landscape { --ds-card-ratio: 16/9; }

  /* Imagen dentro de card */
  .ds-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
}

/* ─── BADGES ─────────────────────────────────────── */
@layer components {
  .ds-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 8px;
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1;
    border-radius: 6px;
    white-space: nowrap;
  }

  /* Estados de disponibilidad */
  .ds-badge-available {
    background: rgba(212,86,122,0.10);
    color: var(--ds-blush-deep);
    border: 1px solid rgba(212,86,122,0.15);
  }
  .ds-badge-full {
    background: rgba(15,13,18,0.06);
    color: var(--ds-text-secondary);
    border: 1px solid rgba(15,13,18,0.08);
  }
  .ds-badge-closed {
    background: rgba(15,13,18,0.03);
    color: var(--ds-text-muted);
    border: 1px solid rgba(15,13,18,0.05);
  }

  /* Highlight */
  .ds-badge-featured {
    background: var(--ds-blush-primary);
    color: #ffffff;
    border: none;
  }
  .ds-badge-new {
    background: var(--ds-white-warm);
    color: var(--ds-text-primary);
    border: 1px solid rgba(253,248,243,0.5);
  }
  .ds-badge-error {
    background: rgba(168,30,50,0.10);
    color: rgb(168,20,50);
    border: 1px solid rgba(168,30,50,0.15);
  }

  .ds-badge-pill { border-radius: 9999px; }
  .ds-badge svg { width: 10px; height: 10px; flex-shrink: 0; }
}

/* ─── DIVIDER ─────────────────────────────────────── */
@layer components {
  .ds-divider {
    display: block;
    height: 1px;
    background: var(--ds-cool-border, #c8c1cd);
    opacity: 0.4;
    border: none;
    margin: 0;
  }
  .ds-divider-label {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--ds-text-muted);
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .ds-divider-label::before,
  .ds-divider-label::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--ds-cool-border, #c8c1cd);
    opacity: 0.4;
  }
}

/* ─── MODAL / DIALOG ─────────────────────────────── */
@layer components {
  /* Backdrop — glass blur premium */
  .ds-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15,13,18,0.28);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    z-index: 100;
    animation: ds-modal-in 0.2s ease-out;
  }
  @keyframes ds-modal-in { from { opacity: 0; } to { opacity: 1; } }

  /* Contenedor */
  .ds-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(420px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    background: var(--ds-bg-elevated, #ffffff);
    border-radius: 24px;
    border: 1px solid var(--ds-border-default, #c8c1cd);
    box-shadow: var(--ds-shadow-xl);
    z-index: 101;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: ds-modal-content-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes ds-modal-content-in {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  /* Línea decorativa superior */
  .ds-modal::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      var(--ds-blush-soft) 30%,
      var(--ds-blush-primary) 50%,
      var(--ds-blush-soft) 70%,
      transparent
    );
    opacity: 0.5;
  }

  /* Header */
  .ds-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 20px 24px 0;
  }
  .ds-modal-title {
    font-family: var(--ds-font-display, "Playfair Display", serif);
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--ds-text-primary);
    line-height: 1.2;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .ds-modal-subtitle {
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.8rem;
    color: var(--ds-text-secondary);
    margin-top: 3px;
    line-height: 1.4;
  }

  /* Handle cosmético */
  .ds-modal-handle {
    display: block;
    width: 28px;
    height: 3px;
    border-radius: 3px;
    background: var(--ds-border-subtle);
    margin: 0 auto 14px;
  }

  /* Body */
  .ds-modal-body {
    padding: 14px 24px;
    overflow-y: auto;
    flex: 1;
  }

  /* Footer */
  .ds-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 24px 20px;
    border-top: 1px solid var(--ds-border-subtle);
    background: var(--ds-blush-tint);
  }

  /* Close */
  .ds-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    color: var(--ds-text-muted);
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  .ds-modal-close:hover { background: var(--ds-blush-tint); color: var(--ds-blush-primary); }
  .ds-modal-close svg { width: 16px; height: 16px; }

  .ds-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
  }
}

/* ─── TOAST / ALERTAS ────────────────────────────── */
@layer components {
  .ds-toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: var(--ds-bg-elevated, #ffffff);
    border: 1px solid var(--ds-border-default, #c8c1cd);
    border-radius: 14px;
    box-shadow: var(--ds-shadow-lg);
    min-width: 280px;
    max-width: 380px;
  }
  .ds-toast-success { border-left: 3px solid var(--ds-blush-primary); }
  .ds-toast-error   { border-left: 3px solid rgb(168,20,50); }
  .ds-toast-info    { border-left: 3px solid var(--ds-blush-soft); }
  .ds-toast-warning { border-left: 3px solid rgb(195,135,35); }

  .ds-toast-icon { flex-shrink: 0; margin-top: 1px; }
  .ds-toast-content { flex: 1; }
  .ds-toast-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ds-text-primary);
    margin-bottom: 1px;
  }
  .ds-toast-message {
    font-size: 0.75rem;
    color: var(--ds-text-secondary);
    line-height: 1.4;
  }
  .ds-toast-close {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--ds-text-muted);
    padding: 0;
    display: flex;
    align-items: center;
  }
  .ds-toast-close:hover { color: var(--ds-text-primary); }
}

/* ─── AVATAR ─────────────────────────────────────── */
@layer components {
  .ds-avatar {
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid var(--ds-bg-elevated, #ffffff);
    box-shadow: var(--ds-shadow-sm);
  }
  .ds-avatar-sm  { width: 28px; height: 28px; }
  .ds-avatar-md  { width: 36px; height: 36px; }
  .ds-avatar-lg  { width: 48px; height: 48px; }
  .ds-avatar-xl  { width: 64px; height: 64px; }
  .ds-avatar-group { display: flex; }
  .ds-avatar-group .ds-avatar { margin-left: -7px; border: 2px solid var(--ds-bg-elevated, #ffffff); }
  .ds-avatar-group .ds-avatar:first-child { margin-left: 0; }
  .ds-avatar-name { font-size: 0.7rem; font-weight: 500; color: var(--ds-text-secondary); }
}

/* ─── SKELETON LOADER ───────────────────────────── */
@layer components {
  .ds-skeleton {
    background: linear-gradient(
      90deg,
      var(--ds-white-warm) 25%,
      var(--ds-blush-tint) 50%,
      var(--ds-white-warm) 75%
    );
    background-size: 200% 100%;
    animation: ds-skeleton-shimmer 1.8s ease-in-out infinite;
    border-radius: inherit;
  }
  @keyframes ds-skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .ds-skeleton-text  { height: 12px; border-radius: 3px; margin-bottom: 6px; }
  .ds-skeleton-title { height: 20px; border-radius: 5px; width: 55%; margin-bottom: 10px; }
  .ds-skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
  .ds-skeleton-card  { border-radius: 18px; padding: 20px; }
}

/* ─── NAV / TABS ────────────────────────────────── */
@layer components {
  .ds-nav {
    display: flex;
    gap: 3px;
    background: var(--ds-blush-tint);
    padding: 3px;
    border-radius: 12px;
    border: 1px solid var(--ds-border-subtle);
  }
  .ds-nav-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 9px;
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--ds-text-secondary);
    cursor: pointer;
    border: none;
    background: transparent;
    white-space: nowrap;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  .ds-nav-item:hover { color: var(--ds-text-primary); background: rgba(255,255,255,0.5); }
  .ds-nav-item-active {
    background: var(--ds-bg-elevated, #ffffff);
    color: var(--ds-blush-primary);
    box-shadow: var(--ds-shadow-sm);
    font-weight: 600;
  }
}

/* ─── PAGINATION ────────────────────────────────── */
@layer components {
  .ds-pagination { display: flex; align-items: center; gap: 3px; }
  .ds-pagination-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1.5px solid var(--ds-border-subtle);
    background: var(--ds-bg-elevated, #ffffff);
    color: var(--ds-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
  }
  .ds-pagination-btn:hover { border-color: var(--ds-blush-soft); color: var(--ds-blush-primary); }
  .ds-pagination-btn-active {
    background: var(--ds-blush-primary);
    border-color: var(--ds-blush-primary);
    color: #ffffff;
  }
  .ds-pagination-btn-disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
}

/* ─── CHIP ───────────────────────────────────────── */
@layer components {
  .ds-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 12px;
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ds-text-primary);
    background: var(--ds-blush-tint);
    border: 1px solid var(--ds-blush-soft);
    border-radius: 100px;
    cursor: pointer;
    transition: all var(--ds-transition-fast, 150ms cubic-bezier(0.4, 0, 0.2, 1));
    white-space: nowrap;
    user-select: none;
  }
  .ds-chip:hover { background: var(--ds-blush-soft); border-color: var(--ds-blush-primary); }
  .ds-chip-selected {
    background: var(--ds-blush-primary);
    border-color: transparent;
    color: var(--ds-text-inverse);
  }
  .ds-chip-selected:hover { background: var(--ds-blush-hover); border-color: transparent; color: var(--ds-text-inverse); }
  .ds-chip svg { width: 12px; height: 12px; flex-shrink: 0; }
  .ds-chip-dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px; height: 14px;
    border: none; background: transparent;
    border-radius: 50%; cursor: pointer;
    color: inherit; opacity: 0.5;
    transition: opacity 0.15s ease; margin-left: 1px;
  }
  .ds-chip-dismiss:hover { opacity: 1; }
}

/* ─── PROGRESS ──────────────────────────────────── */
@layer components {
  .ds-progress-wrap { display: flex; flex-direction: column; gap: 5px; }
  .ds-progress-label {
    font-family: var(--ds-font-body, "Outfit", sans-serif);
    font-size: 0.65rem; font-weight: 500;
    color: var(--ds-text-muted);
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .ds-progress-track {
    width: 100%; height: 5px;
    background: rgba(15,13,18,0.05);
    border-radius: 9999px; overflow: hidden;
  }
  .ds-progress-fill {
    height: 100%; border-radius: 9999px;
    background: var(--ds-blush-primary);
    transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ds-progress-fill-success { background: rgb(68 150 95); }
  .ds-progress-fill-warning { background: rgb(195 135 35); }
  .ds-progress-animated::after {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
    animation: ds-progress-shimmer 1.8s ease-in-out infinite;
    border-radius: inherit;
  }
  @keyframes ds-progress-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .ds-progress-value {
    position: absolute; right: 0; top: calc(100% + 5px);
    font-size: 0.65rem; font-weight: 500; color: var(--ds-text-muted);
  }
}

/* ─── UTILITIES ─────────────────────────────────── */
@layer utilities {
  .ds-font-display { font-family: var(--ds-font-display, "Playfair Display", Georgia, serif) !important; }
  .ds-font-body    { font-family: var(--ds-font-body, "Outfit", system-ui, sans-serif) !important; }

  .ds-text-primary   { color: var(--ds-text-primary) !important; }
  .ds-text-secondary { color: var(--ds-text-secondary) !important; }
  .ds-text-muted     { color: var(--ds-text-muted) !important; }
  .ds-text-accent    { color: var(--ds-text-accent) !important; }
  .ds-text-ghost     { color: var(--ds-text-ghost) !important; }
  .ds-text-inverse   { color: var(--ds-text-inverse) !important; }

  .ds-bg-page       { background-color: var(--ds-bg-page) !important; }
  .ds-bg-elevated   { background-color: var(--ds-bg-elevated) !important; }
  .ds-bg-muted      { background-color: var(--ds-bg-muted) !important; }
  .ds-bg-accent     { background-color: var(--ds-bg-accent) !important; }
  .ds-bg-blush      { background-color: var(--ds-blush-primary) !important; }
  .ds-bg-blush-soft { background-color: var(--ds-blush-soft) !important; }
  .ds-bg-blush-tint { background-color: var(--ds-blush-tint) !important; }
  .ds-bg-cream      { background-color: var(--ds-white-warm) !important; }
  .ds-bg-onyx       { background-color: var(--ds-onyx-primary) !important; }
  .ds-bg-white      { background-color: var(--ds-white-pure) !important; }

  .ds-border-subtle  { border-color: var(--ds-border-subtle) !important; }
  .ds-border-default { border-color: var(--ds-border-default) !important; }
  .ds-border-blush   { border-color: var(--ds-blush-soft) !important; }
  .ds-border-none    { border-color: transparent !important; }

  .ds-shadow-sm   { box-shadow: var(--ds-shadow-sm) !important; }
  .ds-shadow-md   { box-shadow: var(--ds-shadow-md) !important; }
  .ds-shadow-lg   { box-shadow: var(--ds-shadow-lg) !important; }
  .ds-shadow-xl   { box-shadow: var(--ds-shadow-xl) !important; }
  .ds-shadow-glow { box-shadow: var(--ds-shadow-glow) !important; }
  .ds-shadow-none { box-shadow: none !important; }

  .ds-glass {
    background: var(--ds-bg-glass, rgba(255,255,255,0.72));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--ds-bg-glass-border, rgba(255,255,255,0.35));
  }

  .ds-radius-sm    { border-radius: 6px !important; }
  .ds-radius-md    { border-radius: 10px !important; }
  .ds-radius-lg    { border-radius: 14px !important; }
  .ds-radius-xl    { border-radius: 18px !important; }
  .ds-radius-pill  { border-radius: 9999px !important; }
  .ds-radius-circle{ border-radius: 50% !important; }

  .ds-click-outside {
    position: fixed;
    inset: 0;
    z-index: 99;
    display: none;
  }
}

/* ─── COMPATibilidad LEGACY ─────────────────────── */
/*
  Estas clases mantienen compatibilidad con estilos existentes
  que referenciaban --accent-rgb, --border-soft, etc.
  No borrar: los componentes pueden estar usando estas variables.
*/
@layer base {
  /* Variables legacy — mapeadas a tokens nuevos */
  --accent-rgb:      212 86 122;   /* mapea a --ds-blush-primary */
  --accent-hover:    rgb(188 60 100);
  --border-soft:     var(--ds-blush-soft);
  --surface-soft:    var(--ds-white-warm);
  --foreground-strong: var(--ds-onyx-primary);
  --page-bg:         var(--ds-bg-page);
}

/* Gold glow — nombres legacy preservados */
.gold-glow {
  box-shadow: 0 8px 32px -8px rgba(212,86,122,0.35);
}

.text-gold-gradient {
  background: var(--ds-grad-blush-text, linear-gradient(120deg,
    rgb(212 86 122) 0%,
    rgb(242 208 221) 45%,
    rgb(188 60 100) 100%));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-grid-bg {
  background-image:
    radial-gradient(ellipse 80% 55% at 70% 10%, rgba(212,86,122,0.10), transparent),
    radial-gradient(ellipse 55% 45% at 10% 90%, var(--ds-bg-muted));
}

/* Animaciones */
@keyframes ds-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.ds-animate-marquee { animation: ds-marquee 28s linear infinite; }

@keyframes ds-float-slow {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
.ds-animate-float-slow { animation: ds-float-slow 6s ease-in-out infinite; }

@keyframes ds-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ds-animate-fade-in { animation: ds-fade-in 0.4s ease-out both; }

@keyframes ds-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.ds-animate-scale-in { animation: ds-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* ─── PRINT ─────────────────────────────────────── */
@media print {
  .ds-modal-backdrop,
  .ds-modal-overlay { display: none !important; }
  .ds-btn,
  .ds-nav { display: none !important; }
}
`;

// ─────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────

/** Inyecta el CSS del sistema de diseño en el <head> */
const injectStyles = (() => {
  let styleEl = null;
  return function inject() {
    if (styleEl && styleEl.parentNode) return;
    styleEl = document.createElement("style");
    styleEl.id = "ds-system-v2";
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  };
})();

/** Remueve el style tag inyectado */
const ejectStyles = (() => {
  return function eject() {
    const el = document.getElementById("ds-system-v2");
    if (el) el.remove();
  };
})();

/** Obtiene el CSS como string */
const getCssString = () => css;

/** Clases de utilidad por categoría */
const cssClasses = {
  text: {
    primary: "ds-text-primary",
    secondary: "ds-text-secondary",
    muted: "ds-text-muted",
    accent: "ds-text-accent",
    ghost: "ds-text-ghost",
    inverse: "ds-text-inverse",
  },
  bg: {
    page: "ds-bg-page",
    elevated: "ds-bg-elevated",
    muted: "ds-bg-muted",
    accent: "ds-bg-accent",
    blush: "ds-bg-blush",
    blushSoft: "ds-bg-blush-soft",
    blushTint: "ds-bg-blush-tint",
    cream: "ds-bg-cream",
    onyx: "ds-bg-onyx",
    white: "ds-bg-white",
  },
  border: {
    subtle: "ds-border-subtle",
    default: "ds-border-default",
    blush: "ds-border-blush",
    none: "ds-border-none",
  },
  shadow: {
    sm: "ds-shadow-sm",
    md: "ds-shadow-md",
    lg: "ds-shadow-lg",
    xl: "ds-shadow-xl",
    glow: "ds-shadow-glow",
    none: "ds-shadow-none",
  },
  radius: {
    sm: "ds-radius-sm",
    md: "ds-radius-md",
    lg: "ds-radius-lg",
    xl: "ds-radius-xl",
    pill: "ds-radius-pill",
    circle: "ds-radius-circle",
  },
  font: {
    display: "ds-font-display",
    body: "ds-font-body",
  },
  glass: "ds-glass",
};

export {
  colors,
  brand,
  brandRgb,
  typography,
  spacing,
  radius,
  shadows,
  gradients,
  opacity,
  zIndex,
  transitions,
  components,
  css,
  cssClasses,
  injectStyles,
  ejectStyles,
  getCssString,
};
