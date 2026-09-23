import { useEffect, useState } from "react";
import { MapPin, Clock, Instagram, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

export default function Footer() {
  const { t } = useLanguage();
  const [instagram, setInstagram] = useState("https://www.instagram.com/slayedbyjoana17/");
  const [schedule, setSchedule] = useState(null);
  const [studioAddress, setStudioAddress] = useState("Barinaga 6, bajo derecha, Bilbao");

  useEffect(() => {
    api.get("/config").then((r) => {
      if (r.data.instagram) setInstagram(r.data.instagram);
      if (r.data.schedule) setSchedule(r.data.schedule);
      if (r.data.studio_address) setStudioAddress(r.data.studio_address);
    }).catch(() => {});
  }, []);

  const weekdays = t("footer.weekdays");
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(studioAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioAddress)}`;

  return (
    <footer id="contacto" data-testid="footer-section" className="border-t border-[var(--border-soft)] bg-[var(--surface-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              {t("footer.finalTitle")}
            </h2>
            <p className="text-base text-[var(--muted-text)] max-w-md mb-8">{t("footer.finalText")}</p>
            <a href="#reservar" data-testid="footer-final-cta-button"
               className="gold-glow inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-bold text-[#FFFFFF] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 transition-all duration-300">
              {t("footer.cta")}
              <ArrowRight className="h-5 w-5" />
            </a>

            <div className="mt-12 space-y-6">
              <div data-testid="operating-hours-info">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-3 inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {t("footer.hours")}
                </p>
                <div className="text-sm text-[var(--muted-text)] space-y-1.5">
                  {(schedule ? Object.entries(schedule) : []).map(([day, hours]) => (
                    <p key={day} data-testid={`footer-hours-${day}`} className="flex justify-between max-w-xs">
                      <span>{weekdays[day] || day}</span>
                      <span className="text-[var(--foreground-strong)]">{hours.open ? `${hours.start} – ${hours.end}` : t("footer.closed")}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-3">{t("footer.follow")}</p>
                <a href={instagram} target="_blank" rel="noopener noreferrer"
                   data-testid="instagram-profile-link"
                   className="inline-flex items-center gap-2 text-sm text-[var(--muted-text)] hover:text-gold transition-colors">
                  <Instagram className="h-4 w-4" />
                  @slayedbyjoana17
                </a>
              </div>

              <div data-testid="qr-web-card" className="inline-flex items-center gap-4 rounded-2xl border border-gold/25 bg-[var(--surface-soft)] p-4">
                <img src="/qr-slayedbyjoana17.png" alt="Código QR web Slayed by Joana17" className="h-24 w-24 rounded-lg" />
                <div>
                  <p className="font-display font-bold text-sm text-gold">{t("footer.qrTitle")}</p>
                  <p className="text-xs text-[var(--muted-text)] mt-1 max-w-[190px] leading-relaxed">{t("footer.qrText")}</p>
                </div>
              </div>
            </div>
          </div>

          <div data-testid="bilbao-map-container" className="relative rounded-3xl overflow-hidden border border-[var(--border-soft)] min-h-[320px]">
            <iframe
              title="Slayed by Joana17 - Bilbao"
              src={mapSrc}
              className="absolute inset-0 h-full w-full grayscale-[35%] contrast-[1.05]"
              loading="lazy"
            />
            <a href={mapsLink} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ubicación de Slayed by Joana17 en Google Maps`} data-testid="footer-map-link" className="absolute inset-0 z-10" />
            <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-[var(--surface)]/90 backdrop-blur border border-[var(--border-soft)] px-4 py-3 flex items-center gap-2 pointer-events-none">
              <MapPin className="h-4 w-4 text-gold" />
              <span data-testid="footer-studio-address" className="text-sm font-medium">{studioAddress}</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border-soft)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-extrabold text-lg">
            <span className="text-gold">SLAYED</span>{" "}
            <span className="text-xs font-body font-medium tracking-[0.3em] text-[var(--muted-text)] uppercase">by Joana17</span>
          </p>
          <p className="text-xs text-[var(--muted-text)]">{t("footer.rights")}</p>
          <a href="/admin" data-testid="footer-admin-link" className="text-xs text-[var(--muted-text)]/60 hover:text-gold transition-colors">
            Iniciar sesión
          </a>
        </div>
      </div>
    </footer>
  );
}
