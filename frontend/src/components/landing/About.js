import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const ABOUT_IMG = "/about-joana-braids.png";

export default function About() {
  const { t } = useLanguage();
  const points = t("about.points");

  return (
    <section id="sobre-joana" data-testid="about-joana-section" className="py-16 sm:py-24 lg:py-32 bg-[var(--surface-soft)]/40 border-y border-[var(--border-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-tr from-gold/30 via-transparent to-copper/25 blur-xl" />
          <img
            data-testid="about-joana-portrait"
            data-parallax="0.1"
            src={ABOUT_IMG}
            alt="Joana - CEO y estilista de Slayed by Joana17"
            className="relative w-full aspect-[4/5] object-cover rounded-[2.5rem] border border-gold/25"
          />
          <div className="absolute -bottom-5 right-6 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)]/95 backdrop-blur px-5 py-3">
            <p className="font-display text-xl font-bold text-gold">{t("about.signature")}</p>
            <p className="text-xs text-[var(--muted-text)]">{t("about.role")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("about.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-6">{t("about.title")}</h2>
          <div data-testid="about-joana-bio" className="space-y-4 text-base leading-relaxed text-[var(--muted-text)]">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>

          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-sm sm:text-base">
                <span className="h-6 w-6 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-gold" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
