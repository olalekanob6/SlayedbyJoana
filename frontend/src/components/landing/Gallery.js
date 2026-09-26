import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { api, resolveMediaUrl } from "@/lib/api";

export default function Gallery() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.get("/media").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (active && items.length) {
      const idx = items.findIndex((item) => item.id === active.id);
      setIndex(idx >= 0 ? idx : 0);
    }
  }, [active, items]);

  const goNext = () => {
    if (!items.length) return;
    const next = (index + 1) % items.length;
    setIndex(next);
    setActive(items[next]);
  };

  const goPrev = () => {
    if (!items.length) return;
    const prev = (index - 1 + items.length) % items.length;
    setIndex(prev);
    setActive(items[prev]);
  };

  return (
    <section id="galeria" data-testid="portfolio-gallery-section" className="py-12 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-8 sm:mb-10 lg:mb-12">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[var(--ds-blush-deep)] mb-3 sm:mb-4">
            {t("gallery.eyebrow")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ds-text-primary)]">
            {t("gallery.title")}
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--ds-text-muted)] leading-relaxed">
            {t("gallery.subtitle")}
          </p>
        </div>

        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ds-border-default)] bg-[var(--ds-bg-muted)]/40 py-16 sm:py-24 px-6"
            role="status"
            aria-live="polite"
            aria-label={t("gallery.emptyLabel")}
          >
            <div className="relative mb-4 sm:mb-5">
              <div className="absolute inset-0 rounded-full bg-[var(--ds-blush-primary)]/10 blur-2xl" />
              <svg className="relative w-10 h-10 sm:w-12 sm:h-12 text-[var(--ds-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-[var(--ds-text-muted)] text-center max-w-xs">{t("gallery.empty")}</p>
          </div>
        ) : (
          /* Elegant masonry-inspired grid — varied spans for visual rhythm */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {items.map((item, i) => {
              const isFeatured = i % 5 === 0;
              const aspectClass = i % 3 === 0 ? "aspect-[3/4] sm:aspect-[4/5]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3] sm:aspect-[5/4]";
              return (
                <motion.button
                  key={item.id}
                  data-testid={`gallery-item-${item.id}`}
                  onClick={() => setActive(item)}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.35, delay: (i % 6) * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--ds-border-default)] bg-[var(--ds-bg-muted)] group w-full text-left cursor-pointer ${aspectClass}`}
                >
                  {item.type === "video" ? (
                    <video
                      src={resolveMediaUrl(item.url)}
                      muted
                      playsInline
                      loop
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(item.url)}
                      alt={lang === "en" ? item.caption_en || item.caption_es : item.caption_es}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}

                  {/* Hover overlay — refined */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 border border-white/20 shadow-lg transition-transform duration-200 group-hover:scale-105">
                      {item.type === "video" ? (
                        <>
                          <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white fill-white" />
                          <span className="text-[10px] sm:text-xs text-white font-medium tracking-wide">Ver</span>
                        </>
                      ) : (
                        <>
                          <Expand className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                          <span className="text-[10px] sm:text-xs text-white font-medium tracking-wide">Ver</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 bg-[var(--ds-blush-primary)]/90 backdrop-blur-md rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 border border-[var(--ds-blush-primary)]/30 shadow-lg">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider">Destacado</span>
                    </div>
                  )}

                  {/* Elegant video indicator — refined ring badge */}
                  {item.type === "video" && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg ring-1 ring-white/10">
                      <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-[var(--ds-blush-primary)] fill-[var(--ds-blush-primary)]" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="6" fill="currentColor" />
                        <rect x="10.5" y="5" width="3" height="10" rx="0.5" fill="black" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] text-white font-medium uppercase tracking-widest">Video</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced lightbox */}
      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent
          data-testid="gallery-image-modal"
          className="max-w-4xl sm:max-w-5xl bg-transparent border-0 p-0 sm:p-1 shadow-2xl"
          style={{ maxHeight: "90vh" }}
        >
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                {/* Close button — refined */}
                <button
                  onClick={() => setActive(null)}
                  className="absolute -top-3 -right-3 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:border-[var(--ds-blush-primary)]/40 transition-all shadow-2xl hover:shadow-[0_0_20px_rgba(229,169,60,0.3)] active:scale-95"
                  aria-label="Cerrar galería"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Navigation — refined */}
                <button
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 sm:h-14 sm:w-14 -ml-6 sm:-ml-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:text-[var(--ds-blush-primary)] hover:border-[var(--ds-blush-primary)]/40 transition-all shadow-lg hover:shadow-[0_0_16px_rgba(229,169,60,0.25)] active:scale-95"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 sm:h-14 sm:w-14 -mr-6 sm:-mr-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:text-[var(--ds-blush-primary)] hover:border-[var(--ds-blush-primary)]/40 transition-all shadow-lg hover:shadow-[0_0_16px_rgba(229,169,60,0.25)] active:scale-95"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Counter — refined */}
                <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white tracking-widest border border-white/10 shadow-lg">
                  <span className="text-[var(--ds-blush-primary)]">{index + 1}</span> / {items.length}
                </div>

                {/* Media — refined presentation */}
                {active.type === "video" ? (
                  <div className="w-full max-h-[70vh] sm:max-h-[75vh] rounded-xl bg-black overflow-hidden shadow-2xl">
                    <video
                      src={resolveMediaUrl(active.url)}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-contain"
                      onEnded={() => setPlaying(false)}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                    />
                    {/* Video overlay hint — refined, only when paused */}
                    {!playing && (
                      <button
                        onClick={() => {
                          const v = document.querySelector("video");
                          if (v) v.play();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-300"
                        aria-label="Reproducir video"
                      >
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center shadow-2xl hover:bg-white/20 hover:border-[var(--ds-blush-primary)]/40 transition-all active:scale-95">
                          <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white fill-white ml-1.5" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <img
                    src={resolveMediaUrl(active.url)}
                    alt="Trabajo de Slayed by Joana17"
                    className="w-full max-h-[70vh] sm:max-h-[75vh] object-contain rounded-xl bg-black shadow-2xl"
                  />
                )}

                {/* Caption — refined with backdrop */}
                {active.caption_es && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6 rounded-b-xl">
                    <p className="text-xs sm:text-sm text-white text-center font-medium max-w-md mx-auto leading-relaxed tracking-wide">
                      <span className="text-[var(--ds-blush-primary)] font-semibold">}— </span>
                      {lang === "en" ? (active.caption_en || active.caption_es) : active.caption_es}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
