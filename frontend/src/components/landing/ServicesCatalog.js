import { Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SERVICE_CATEGORIES, SIZES } from "@/data/services";

const SIZE_SHORT = ["Peq.", "S.Med.", "Med.", "Gran."];

function PriceContent({ s }) {
  const { lang } = useLanguage();
  if (s.type === "matrix") {
    return (
      <div className="flex-1">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-[var(--muted-text)]">
              <th className="text-left font-medium pb-2"></th>
              {SIZE_SHORT.map((sz) => (
                <th key={sz} className="text-right font-medium pb-2">{sz}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(s.lengths).map(([length, prices]) => (
              <tr key={length} className="border-t border-[var(--border-soft)]">
                <td className="py-1.5 font-medium">{length}</td>
                {prices.map((p, i) => (
                  <td key={i} className="py-1.5 text-right font-semibold text-gold">{p}€</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (s.type === "sizes") {
    return (
      <div className="flex-1 grid grid-cols-2 gap-2">
        {SIZES.map((sz, i) => (
          <div key={sz} className="rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-[var(--muted-text)]">{sz}</span>
            <span className="text-sm font-bold text-gold">{s.sizePrices[i]}€</span>
          </div>
        ))}
      </div>
    );
  }
  if (s.type === "options") {
    return (
      <div className="flex-1 space-y-1.5">
        {s.options.map((o) => (
          <div key={o.label} className="flex items-center justify-between border-b border-[var(--border-soft)] pb-1.5 last:border-0">
            <span className="text-xs sm:text-sm text-[var(--foreground-strong)]">{o.label}</span>
            <span className="text-sm font-bold text-gold">{o.price}€</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex-1 flex items-center">
      <span className="font-display text-3xl font-extrabold text-gold">
        {s.plusPrice ? "+" : ""}{s.fromPrice ? (lang === "en" ? "From " : "Desde ") : ""}{s.base}€{s.unitPrice ? `/${s.unitPrice}` : ""}
      </span>
    </div>
  );
}

export default function ServicesCatalog({ onBook }) {
  const { t, lang } = useLanguage();
  const { services } = useSiteConfig();

  return (
    <section id="servicios" data-testid="services-catalog-section" className="py-16 sm:py-24 lg:py-32 bg-[var(--surface-soft)]/60 border-y border-[var(--border-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("services.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("services.title")}</h2>
          <p className="mt-4 text-base text-[var(--muted-text)]">{t("services.subtitle")}</p>
        </div>

        <Tabs defaultValue="mujer">
          <TabsList className="bg-white border border-[var(--border-soft)] rounded-full p-1 h-auto mb-10">
            {SERVICE_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                data-testid={`catalog-tab-${cat}`}
                className="rounded-full px-6 sm:px-8 py-2.5 text-sm font-semibold data-[state=active]:bg-gold data-[state=active]:text-white text-[var(--muted-text)] transition-all duration-300"
              >
                {t(`services.tabs.${cat}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {SERVICE_CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {services[cat].map((s, i) => (
                  <motion.div
                    key={s.id}
                    data-testid={`service-card-${s.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                    className="group flex flex-col rounded-3xl border border-[var(--border-soft)] bg-white p-7 hover:border-[rgba(var(--accent-rgb),0.45)] hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-xl font-semibold leading-snug">{s.name}</h3>
                      {s.duration && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--muted-text)]">
                          <Clock className="h-3.5 w-3.5 text-gold" />
                          {s.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-text)] mb-5">
                      {lang === "en" ? s.descEn : s.descEs}
                    </p>
                    <PriceContent s={s} />
                    <div className="mt-6 flex justify-end">
                      <button
                        data-testid={`service-book-${s.id}`}
                        onClick={() => onBook(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--accent-rgb),0.45)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold hover:text-white transition-all duration-300"
                      >
                        {t("services.book")}
                        <ArrowUpRight className="h-3.5 w-3.5" />
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
