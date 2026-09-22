import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, Star, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const HERO_IMG = "https://images.unsplash.com/photo-1594254773847-9fce26e950bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85";

const lineReveal = {
  hidden: { y: "115%" },
  show: (i) => ({
    y: "0%",
    transition: { duration: 1.0, delay: 0.25 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const { t } = useLanguage();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 18 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const lines = [
    { text: t("hero.titleA"), cls: "text-[var(--foreground-strong)]" },
    { text: t("hero.titleAccent"), cls: "text-gold-gradient" },
    { text: t("hero.titleB"), cls: "text-[var(--foreground-strong)]" },
  ];

  return (
    <section id="inicio" className="hero-grid-bg relative overflow-hidden pt-28 sm:pt-36 pb-16 sm:pb-24">
      <div data-parallax="0.35" className="hidden md:block absolute -top-24 right-[8%] h-80 w-80 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
      <div data-parallax="0.22" className="hidden md:block absolute bottom-0 left-[4%] h-64 w-64 rounded-full bg-copper/15 blur-3xl pointer-events-none" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.06 }}
        transition={{ duration: 1.6, delay: 0.8 }}
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-10 left-0 font-display font-extrabold uppercase leading-none text-[22vw] tracking-tighter whitespace-nowrap"
      >
        Slayed
      </motion.p>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
        <motion.div
          initial="hidden"
          animate="show"
          className="lg:col-span-7"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-testid="hero-location-badge"
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-6"
          >
            <MapPin className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </motion.div>

          <h1 data-testid="hero-main-heading" className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
            {lines.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-1 -mb-1">
                <motion.span custom={i} variants={lineReveal} className={`block ${l.cls}`}>
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            data-testid="hero-subtitle"
            className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--muted-text)]"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <a href="#reservar" data-testid="hero-booking-cta-button"
               className="gold-glow group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-bold text-[#FFFFFF] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 transition-all duration-300">
              {t("hero.cta")}
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a href="#servicios" data-testid="hero-services-button"
               className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-soft)] px-8 py-4 text-base font-semibold text-[var(--foreground-strong)] hover:border-gold/60 hover:text-gold transition-all duration-300">
              {t("hero.secondary")}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-sm text-[var(--muted-text)]">120+ {t("hero.trusted")}</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="lg:col-span-5 relative"
          style={{ perspective: 1000 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative mx-auto w-72 sm:w-80 lg:w-full max-w-sm"
          >
            <div className="absolute -inset-3 rounded-t-[999px] rounded-b-[2rem] bg-gradient-to-b from-gold/40 via-copper/20 to-transparent blur-xl" />
            <img
              data-testid="hero-stylist-image"
              data-parallax="0.08"
              src={HERO_IMG}
              alt="Trenzas afro - Slayed by Joana17"
              className="relative w-full aspect-[3/4] object-cover rounded-t-[999px] rounded-b-[2rem] border border-gold/30"
            />
            <div className="animate-float-slow absolute -bottom-6 -left-6 sm:-left-10 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)]/90 backdrop-blur-xl p-4 shadow-2xl shadow-black/50" style={{ transform: "translateZ(40px)" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("hero.cardTitle")}</p>
                  <p className="text-xs text-[var(--muted-text)]">{t("hero.cardText")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
