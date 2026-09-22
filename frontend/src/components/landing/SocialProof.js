import { Star, Award, MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function SocialProof() {
  const { t } = useLanguage();

  const stats = [
    { icon: Star, value: "4.9/5", label: t("proof.rating"), testId: "social-proof-stat-rating" },
    { icon: Award, value: "+7", label: t("proof.experience"), testId: "social-proof-stat-experience" },
    { icon: MapPin, value: "Bilbao", label: t("proof.location"), testId: "social-proof-stat-location" },
    { icon: Heart, value: "+1.500", label: t("proof.clients"), testId: "social-proof-stat-clients" },
  ];

  return (
    <section data-testid="social-proof-bar" className="border-y border-[var(--border-soft)] bg-[var(--surface-soft)]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.testId}
            data-testid={s.testId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-gold">{s.value}</p>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
