import { Clock, ArrowUpRight, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SERVICE_CATEGORIES, SIZES } from "@/data/services";

const SIZE_SHORT = ["Peq.", "S.Med.", "Med.", "Gran."];
const SIZE_LABELS = ["Peq.", "S.Med.", "Med.", "Gran."];

// ──────────────────────────────────────────────
// PriceBlock — presentación visual premium
// ──────────────────────────────────────────────

function PriceBlock({ s }) {
  const { lang } = useLanguage();

  // ── Matrix: tabla con badge "desde" + precio mínimo destacado ──
  if (s.type === "matrix") {
    const allPrices = Object.values(s.lengths).flat();
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    return (
      <div className="flex-1">
        {/* Badge "desde" — angular, prominente */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--ds-blush-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Sparkles className="h-3 w-3" />
            {lang === "en" ? "From" : "Desde"}
          </span>
          <span className="font-display text-lg sm:text-xl font-extrabold text-[var(--ds-blush-deep)]">
            {minPrice}€
          </span>
          {minPrice !== maxPrice && (
            <span className="text-[10px] text-[var(--ds-text-muted)] ml-auto">
              — {maxPrice}€
            </span>
          )}
        </div>
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-[var(--ds-text-muted)]">
              <th className="text-left font-medium pb-2 pr-2 text-[10px] uppercase tracking-wider"></th>
              {SIZE_SHORT.map((sz) => (
                <th key={sz} className="text-right font-medium pb-2 px-1 text-[10px] uppercase tracking-wider">
                  {sz}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(s.lengths).map(([length, prices]) => (
              <tr key={length} className="border-t border-[var(--ds-border-default)]/40">
                <td className="py-1.5 pr-2 font-medium text-[var(--ds-text-secondary)] text-[10px] uppercase tracking-wider">
                  {length}
                </td>
                {prices.map((p, i) => (
                  <td key={i} className="py-1.5 text-right">
                    <span className={`inline-block font-bold ${p === minPrice ? "text-[var(--ds-blush-deep)]" : "text-[var(--ds-text-primary)]"}`}>
                      {p}€
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Sizes: grid con tarjetas hover ──
  if (s.type === "sizes") {
    return (
      <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3">
        {SIZES.map((sz, i) => (
          <div
            key={sz}
            className={`rounded-xl border bg-white px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between transition-all duration-200 hover:border-[var(--ds-blush-soft)] hover:shadow-sm ${
              i === 0 ? "border-[var(--ds-blush-soft)] bg-[var(--ds-blush-tint)]/50" : "border-[var(--ds-border-default)]"
            }`}
          >
            <span className="text-[10px] sm:text-xs text-[var(--ds-text-muted)] uppercase tracking-wide font-medium">
              {sz}
            </span>
            <span className={`text-sm sm:text-base font-bold ${
              i === 0 ? "text-[var(--ds-blush-deep)]" : "text-[var(--ds-text-primary)]"
            }`}>
              {s.sizePrices[i]}€
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── Options: lista con dividers refinados ──
  if (s.type === "options") {
    return (
      <div className="flex-1 space-y-0">
        {s.options.map((o, idx) => (
          <div
            key={o.label}
            className="flex items-center justify-between py-2 border-b border-[var(--ds-border-default)]/30 last:border-0"
          >
            <span className="text-xs sm:text-sm text-[var(--ds-text-secondary)] truncate pr-2">
              {o.label}
            </span>
            <span className="text-sm sm:text-base font-bold text-[var(--ds-text-primary)] whitespace-nowrap ml-2">
              {o.price}€
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── Simple: precio grande + badge ──
  return (
    <div className="flex-1 flex flex-col items-start gap-2">
      {s.fromPrice && (
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--ds-blush-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
          {lang === "en" ? "From" : "Desde"}
        </span>
      )}
      <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-none">
        <span className="text-[var(--ds-blush-deep)]">{s.base}</span>
        <span className="text-[var(--ds-text-primary)]">€</span>
      </div>
      {s.unitPrice && (
        <span className="text-[11px] text-[var(--ds-text-muted)] font-medium">
          {lang === "en" ? "/ per" : "/ por"} {s.unitPrice}
        </span>
      )}
      {s.plusPrice && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border-default)] bg-[var(--ds-bg-muted)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--ds-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ds-blush-primary)]" />
          + extra
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// DurationBadge — pill prominente
// ──────────────────────────────────────────────

function DurationBadge({ duration }) {
  return (
    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[var(--ds-cool-border)] bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[var(--ds-text-secondary)] shadow-[var(--ds-shadow-sm)]">
      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--ds-blush-primary)]" />
      <span className="hidden sm:inline">{duration}</span>
      <span className="sm:hidden">{duration.replace(/[\d.]+.?/, "").trim() || duration}</span>
    </span>
  );
}

// ──────────────────────────────────────────────
// ServicesCatalog
// ──────────────────────────────────────────────

export default function ServicesCatalog({ onBook }) {
  const { t, lang } = useLanguage();
  const { services } = useSiteConfig();

  return (
    <section
      id="servicios"
      data-testid="services-catalog-section"
      className="py-12 sm:py-20 lg:py-28 bg-[var(--ds-bg-muted)]/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-8 sm:mb-10 lg:mb-12">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[var(--ds-blush-deep)] mb-3 sm:mb-4">
            {t("services.eyebrow")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ds-text-primary)]">
            {t("services.title")}
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--ds-text-muted)] leading-relaxed max-w-xl">
            {t("services.subtitle")}
          </p>
        </div>

        {/* Tabs — estilo refinado */}
        <Tabs defaultValue="mujer" className="mt-2">
          <TabsList className="bg-white border border-[var(--ds-border-default)] rounded-full p-1 h-auto mb-8 sm:mb-10 lg:mb-12 shadow-sm">
            {SERVICE_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                data-testid={`catalog-tab-${cat}`}
                className="rounded-full px-5 sm:px-7 py-2 text-[11px] sm:text-xs font-semibold data-[state=active]:bg-[var(--ds-blush-primary)] data-[state=active]:text-white text-[var(--ds-text-muted)] transition-all duration-300"
              >
                {t(`services.tabs.${cat}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {SERVICE_CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-2 xl:grid-cols-3">
                {services[cat].map((s, i) => (
                  <motion.div
                    key={s.id}
                    data-testid={`service-card-${s.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                    className="group flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--ds-border-default)] bg-white p-6 sm:p-7 lg:p-8 hover:border-[var(--ds-blush-soft)] hover:shadow-xl hover:shadow-[var(--ds-blush-primary)]/5 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Name + duration — jerarquía clara */}
                    <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                      <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold leading-snug text-[var(--ds-text-primary)]">
                        {s.name}
                      </h3>
                      {s.duration && (
                        <DurationBadge duration={s.duration} />
                      )}
                    </div>

                    {/* Description — legible */}
                    <p className="text-xs sm:text-sm text-[var(--ds-text-muted)] mb-4 sm:mb-5 leading-relaxed line-clamp-2">
                      {lang === "en" ? s.descEn : s.descEs}
                    </p>

                    {/* Price area — elevado, claro */}
                    <div className="mt-auto pt-4 sm:pt-5">
                      <div className="rounded-xl bg-[var(--ds-bg-muted)]/60 border border-[var(--ds-border-default)]/50 p-3 sm:p-4">
                        <PriceBlock s={s} />
                      </div>
                    </div>

                    {/* CTA — más prominente, primary action */}
                    <div className="mt-4 sm:mt-5 flex justify-end">
                      <button
                        data-testid={`service-book-${s.id}`}
                        onClick={() => onBook(s.id)}
                        className="group/cta inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-[var(--ds-grad-blush-hero)] px-5 sm:px-7 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-[var(--ds-shadow-glow-soft)] hover:shadow-[var(--ds-shadow-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10">{t("services.book")}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 group-hover/cta:translate-x-0.5 group-hover/cta:translate-y-0.5 transition-transform duration-300" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
