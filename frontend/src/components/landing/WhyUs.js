import { ShieldCheck, Sparkles, CircleDollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const ICONS = [ShieldCheck, Sparkles, CircleDollarSign];
const TEST_IDS = ["why-us-pillar-tension-free", "why-us-pillar-exclusive-designs", "why-us-pillar-price-transparency"];

export default function WhyUs() {
  const { t } = useLanguage();
  const pillars = t("why.pillars");

  return (
    <section id="por-que" data-testid="why-choose-joana-section" className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("why.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("why.title")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={TEST_IDS[i]}
                data-testid={TEST_IDS[i]}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="group relative border-t border-[var(--border-soft)] px-2 md:px-8 py-10 md:py-12 hover:border-gold/50 transition-colors duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <span
                    aria-hidden="true"
                    className="font-display text-6xl sm:text-7xl font-extrabold leading-none text-transparent transition-all duration-500 group-hover:[-webkit-text-stroke:1.5px_rgb(var(--accent-rgb))]"
                    style={{ WebkitTextStroke: "1.5px rgba(229,105,158,0.35)" }}
                  >
                    0{i + 1}
                  </span>
                  <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold mb-3">{p.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--muted-text)]">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
