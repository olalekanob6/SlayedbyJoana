import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/context/LanguageContext";

const FAQ_TEST_IDS = ["faq-item-kanekalon", "faq-item-duration", "faq-item-reservation", "faq-item-tension"];

export default function Faq() {
  const { t } = useLanguage();
  const items = t("faq.items");

  return (
    <section id="faq" data-testid="faq-accordion-section" className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("faq.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("faq.title")}</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              data-testid={FAQ_TEST_IDS[i]}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-6 data-[state=open]:border-gold/40 transition-colors duration-300"
            >
              <AccordionTrigger className="text-left font-display text-base sm:text-lg font-semibold hover:text-gold hover:no-underline py-5">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base leading-relaxed text-[var(--muted-text)] pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
