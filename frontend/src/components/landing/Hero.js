import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, Star, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const HERO_IMG = "https://images.unsplash.com/photo-1594254773847-9fce26e950bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85";

const lineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const { t } = useLanguage();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 140, damping: 16 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 140, damping: 16 });

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
    { text: t("hero.titleA"), cls: "text-[var(--ds-text-secondary)]" },
    { text: t("hero.titleAccent"), cls: "text-transparent bg-clip-text bg-[var(--ds-grad-blush-text)]" },
    { text: t("hero.titleB"), cls: "text-[var(--ds-text-secondary)]" },
  ];

  return (
    <section id="inicio" className="relative overflow-hidden pt-12 sm:pt-20 pb-10 sm:pb-16 hero-grid-bg">
      {/* Ambient glows — refined */}
      <div className="absolute -top-32 right-[-5%] h-80 w-80 rounded-full bg-[var(--ds-blush-primary)]/8 blur-3xl pointer-events-none sm:right-[8%]" />
      <div className="absolute -bottom-16 left-[-5%] h-60 w-60 rounded-full bg-[var(--ds-cool-primary)]/8 blur-3xl pointer-events-none sm:left-[6%]" />

      {/* Subtle brand watermark — clamp para evitar overflow en móvil extremo */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        transition={{ duration: 1.6, delay: 0.5 }}
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-8 left-0 font-display font-extrabold uppercase leading-none text-[clamp(1.5rem,8vw,8rem)] sm:text-[clamp(2rem,10vw,12rem)] md:text-[clamp(3rem,14vw,18rem)] tracking-tighter whitespace-nowrap overflow-hidden max-w-[100%]"
      >
        Slayed
      </motion.p>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
        {/* Left: text content */}
        <motion.div
          initial="hidden"
          animate="show"
          className="lg:col-span-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            data-testid="hero-location-badge"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--ds-blush-soft)] bg-[var(--ds-blush-tint)]/60 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ds-blush-deep)] mb-5 sm:mb-7"
          >
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--ds-blush-deep)]" />
            {t("hero.badge")}
          </motion.div>

          {/* Main heading — clear, three-line split with refined animation */}
          <h1 data-testid="hero-main-heading" className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] sm:leading-[1.08]">
            {lines.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-0.5 -mb-0.5">
                <motion.span custom={i} variants={lineReveal} className={`block ${l.cls}`}>
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            data-testid="hero-subtitle"
            className="mt-5 sm:mt-6 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-[var(--ds-text-muted)]"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* CTAs — more prominent, larger touch targets */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-5 sm:mt-6 flex flex-col gap-3 sm:gap-4"
          >
            {/* Primary CTA — enlarged, stronger shadow, clearer intent */}
            <a
              href="#reservar"
              data-testid="hero-booking-cta-button"
              className="gold-glow group inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-[var(--ds-blush-primary)] px-7 sm:px-9 py-4 sm:py-4.5 text-sm sm:text-base font-bold text-white hover:bg-[var(--ds-blush-hover)] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[var(--ds-blush-primary)]/25 hover:shadow-xl hover:shadow-[var(--ds-blush-primary)]/30"
            >
              <span className="text-base sm:text-lg font-extrabold tracking-tight">{t("hero.cta")}</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            {/* Secondary CTA */}
            <a
              href="#servicios"
              data-testid="hero-services-button"
              className="group inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full border border-[var(--ds-border-default)] bg-white/70 backdrop-blur-sm px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-[var(--ds-text-primary)] hover:border-[var(--ds-blush-soft)] hover:text-[var(--ds-blush-deep)] hover:bg-[var(--ds-blush-tint)]/40 transition-all duration-300"
            >
              {t("hero.secondary")}
            </a>
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-5 sm:mt-6 flex items-center gap-2 sm:gap-3"
          >
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-[var(--ds-blush-primary)] text-[var(--ds-blush-primary)]" />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm text-[var(--ds-text-muted)]">
              <span className="font-semibold text-[var(--ds-text-primary)]">120+</span> {" "}
              {t("hero.trusted")}
            </span>
          </motion.div>
        </motion.div>

        {/* Right: hero image — refined framing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          className="lg:col-span-6 relative"
          style={{ perspective: 1000 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none"
          >
            {/* Glow behind image — refined colors */}
            <div className="absolute -inset-5 rounded-t-[999px] rounded-b-[2rem] bg-gradient-to-b from-[var(--ds-blush-primary)]/30 via-[var(--ds-cool-primary)]/10 to-transparent blur-xl" />

            {/* Decorative frame accent */}
            <div className="absolute -inset-0.5 rounded-t-[999px] rounded-b-[2rem] border border-[var(--ds-blush-soft)]/40 pointer-events-none" />

            {/* Image — stronger aspect-ratio enforcement, premium border + shadow */}
            <img
              data-testid="hero-stylist-image"
              data-parallax="0.06"
              src={HERO_IMG}
              alt="Trenzas afro - Slayed by Joana17"
              className="relative w-full aspect-[3/4] sm:aspect-[4/5] object-cover rounded-t-[999px] rounded-b-[2rem] border-2 border-[var(--ds-blush-soft)] shadow-2xl shadow-[var(--ds-blush-primary)]/10"
            />

            {/* Trust card — refined, sits cleanly */}
            <div className="animate-float-slow absolute -bottom-4 -left-3 sm:-left-6 md:-left-8 rounded-2xl border border-[var(--ds-border-default)] bg-white/90 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-black/5" style={{ transform: "translateZ(40px)" }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[var(--ds-blush-tint)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 sm:h-5 sm:w-5 text-[var(--ds-blush-deep)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-[var(--ds-text-primary)]">{t("hero.cardTitle")}</p>
                  <p className="text-[10px] sm:text-xs text-[var(--ds-text-muted)] mt-0.5 leading-snug">{t("hero.cardText")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
