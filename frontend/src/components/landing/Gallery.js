import { useEffect, useState } from "react";
import { Expand } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { api, resolveMediaUrl } from "@/lib/api";

export default function Gallery() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/media").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  return (
    <section id="galeria" data-testid="portfolio-gallery-section" className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("gallery.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("gallery.title")}</h2>
          <p className="mt-4 text-base text-[var(--muted-text)]">{t("gallery.subtitle")}</p>
        </div>

        {items.length === 0 ? (
          <p className="text-[var(--muted-text)]">{t("gallery.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                data-testid={`gallery-item-${item.id}`}
                onClick={() => setActive(item)}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className={`group relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] ${i % 5 === 0 ? "row-span-2 aspect-[3/4] md:aspect-auto" : "aspect-square"}`}
              >
                {item.type === "video" ? (
                  <video src={resolveMediaUrl(item.url)} muted playsInline className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <img src={resolveMediaUrl(item.url)} alt={lang === "en" ? item.caption_en || item.caption_es : item.caption_es}
                       loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-4">
                  <Expand className="h-4 w-4 text-white shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent data-testid="gallery-image-modal" className="max-w-3xl bg-[var(--surface)] border-[var(--border-soft)] p-2 sm:p-4">
          {active && (
            active.type === "video" ? (
              <video src={resolveMediaUrl(active.url)} controls autoPlay muted className="w-full max-h-[75vh] rounded-xl" />
            ) : (
              <img src={resolveMediaUrl(active.url)} alt="Trabajo de Slayed by Joana17" className="w-full max-h-[75vh] object-contain rounded-xl" />
            )
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
