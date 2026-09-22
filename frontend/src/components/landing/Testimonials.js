import { useEffect, useState } from "react";
import { Star, BadgeCheck, Quote, Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { api, formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Testimonials() {
  const { t, lang } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: "", service: "", rating: 5, text: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.text) return;
    setSending(true);
    try {
      await api.post("/reviews", {
        name: form.name,
        service: form.service,
        rating: form.rating,
        text_es: form.text,
        text_en: "",
      });
      setSent(true);
      setForm({ name: "", service: "", rating: 5, text: "" });
    } catch (err) {
      toast.error(formatApiError(err) || t("testimonials.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section data-testid="testimonials-section" className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("testimonials.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("testimonials.title")}</h2>
          <p className="mt-4 text-base text-[var(--muted-text)]">{t("testimonials.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.id}
              data-testid={`testimonial-card-${i + 1}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-8 flex flex-col"
            >
              <Quote className="h-8 w-8 text-gold/30 mb-4" />
              <blockquote className="text-sm sm:text-base leading-relaxed text-[var(--foreground-strong)] flex-1">
                {lang === "en" && r.text_en ? r.text_en : r.text_es}
              </blockquote>
              <figcaption className="mt-6 pt-6 border-t border-[var(--border-soft)]">
                <div className="flex mb-2">
                  {[...Array(r.rating || 5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-[var(--muted-text)] mt-0.5 inline-flex items-center gap-1.5">
                  {r.service}
                  <span className="inline-flex items-center gap-1 text-gold">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {t("testimonials.verified")}
                  </span>
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          {sent ? (
            <motion.div
              data-testid="review-form-success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-gold/30 bg-[var(--surface-soft)] p-10 text-center"
            >
              <CheckCircle2 className="h-12 w-12 text-gold mx-auto mb-4" />
              <p className="font-display text-xl font-bold mb-2">{t("testimonials.thanksTitle")}</p>
              <p className="text-sm text-[var(--muted-text)]">{t("testimonials.thanksText")}</p>
            </motion.div>
          ) : (
            <form
              data-testid="client-review-form"
              onSubmit={submit}
              className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-6 sm:p-10 space-y-5"
            >
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-center">{t("testimonials.cta")}</h3>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`review-form-rating-${n}`}
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    className="p-1 transition-transform duration-200 hover:scale-125"
                  >
                    <Star className={`h-8 w-8 ${n <= form.rating ? "fill-gold text-gold" : "text-[var(--border-soft)]"}`} />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  data-testid="review-form-name"
                  required
                  placeholder={t("testimonials.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-[var(--surface)] border-[var(--border-soft)] h-12"
                />
                <Input
                  data-testid="review-form-service"
                  placeholder={t("testimonials.servicePlaceholder")}
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                  className="bg-[var(--surface)] border-[var(--border-soft)] h-12"
                />
              </div>
              <Textarea
                data-testid="review-form-text"
                required
                rows={3}
                placeholder={t("testimonials.textPlaceholder")}
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                className="bg-[var(--surface)] border-[var(--border-soft)]"
              />
              <button
                data-testid="review-form-submit"
                type="submit"
                disabled={sending}
                className="gold-glow w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-bold text-[#FFFFFF] hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-all duration-300"
              >
                <Send className="h-5 w-5" />
                {sending ? t("booking.submitting") : t("testimonials.submit")}
              </button>
              <p className="text-xs text-center text-[var(--muted-text)]">{t("testimonials.moderationNote")}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
