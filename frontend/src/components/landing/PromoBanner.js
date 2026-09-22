import { Megaphone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function PromoBanner() {
  const { lang } = useLanguage();
  const { promo } = useSiteConfig();
  const text = lang === "en" ? promo.text_en : promo.text_es;

  if (!promo.enabled || !text) return null;

  return (
    <div data-testid="promo-banner" className="relative z-40 border-b border-gold/20 bg-gold px-4 py-3 text-center text-sm font-bold text-white">
      <span className="inline-flex items-center gap-2">
        <Megaphone className="h-4 w-4" />
        {text}
      </span>
    </div>
  );
}
