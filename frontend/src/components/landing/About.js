import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const ABOUT_IMG = "/about-joana-braids.png";

export default function About() {
  const { t } = useLanguage();
  const points = t("about.points");

  return (
    <section id="sobre-joana" data-testid="about-joana-section" className="py-16 sm:py-24 lg:py-32 bg-[var(--ds-bg-muted)]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Soft glow behind portrait */}
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[var(--ds-blush-primary)]/20 via-transparent to-[var(--ds-cool-primary)]/15 blur-xl" />
          <img
            data-testid="about-joana-portrait"
            data-parallax="0.08"
            src={ABOUT_IMG}
            alt="Joana - CEO y estilista de Slayed by Joana17"
            className="relative w-full aspect-[4/5] object-cover rounded-[2.5rem] border-2 border-[var(--ds-blush-soft)] shadow-xl"
          />
          {/* Signature badge */}
          <div className="absolute -bottom-4 right-4 sm:right-6 rounded-2xl border border-[var(--ds-border-default)] bg-white/90 backdrop-blur px-4 sm:px-5 py-3 sm:py-4 shadow-md">
            <p className="font-display text-xl sm:text-2xl font-bold text-[var(--ds-blush-deep)]">{t("about.signature")}</p>
            <p className="text-[10px] sm:text-xs text-[var(--ds-text-muted)] mt-0.5">{t("about.role")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[var(--ds-blush-deep)] mb-4">{t("about.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-6 text-[var(--ds-text-primary)]">{t("about.title")}</h2>
          <div data-testid="about-joana-bio" className="space-y-4 text-base sm:text-lg leading-relaxed text-[var(--ds-text-secondary)]">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>

          <ul className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
            {points.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-[var(--ds-text-primary)]">
                <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[var(--ds-blush-tint)] border border-[var(--ds-blush-soft)] flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--ds-blush-deep)]" />
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
