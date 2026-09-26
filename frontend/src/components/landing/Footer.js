import { useEffect, useState } from "react";
import { MapPin, Clock, Instagram, Phone, Send, ArrowRight, Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

export default function Footer() {
  const { t } = useLanguage();
  const [instagram, setInstagram] = useState("https://www.instagram.com/slayedbyjoana17/");
  const [schedule, setSchedule] = useState(null);
  const [studioAddress, setStudioAddress] = useState("Barinaga 6, bajo derecha, Bilbao");
  const [bizumNumber, setBizumNumber] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    api.get("/config").then((r) => {
      if (r.data.instagram) setInstagram(r.data.instagram);
      if (r.data.schedule) setSchedule(r.data.schedule);
      if (r.data.studio_address) setStudioAddress(r.data.studio_address);
      if (r.data.bizum_number) setBizumNumber(r.data.bizum_number);
      if (r.data.phone) setPhone(r.data.phone);
    }).catch(() => {});
  }, []);

  const weekdays = t("footer.weekdays");
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(studioAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioAddress)}`;

  return (
    <footer id="contacto" data-testid="footer-section" className="border-t border-[var(--border-soft)] bg-[var(--surface-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Always-visible contact bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-8 sm:mb-10 lg:mb-12">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--border-soft)] bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--foreground-strong)] hover:border-gold hover:text-gold transition-all shadow-sm"
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold" />
              {phone}
            </a>
          )}
          {bizumNumber && (
            <a
              href={`https://bizum.page.link/${bizumNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gold hover:bg-gold hover:text-white transition-all"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Bizum {bizumNumber}
            </a>
          )}
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-profile-link-footer"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--border-soft)] bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--muted-text)] hover:text-gold hover:border-gold/60 transition-all"
          >
            <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            @slayedbyjoana17
          </a>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--border-soft)] bg-white/70 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--muted-text)] hover:text-gold hover:border-gold/60 transition-all"
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Bilbao
          </a>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 mb-8 sm:mb-10 lg:mb-12">
          {/* Left: call to action + hours + social */}
          <div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4">
              {t("footer.finalTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-text)] max-w-md mb-5 sm:mb-7 leading-relaxed">
              {t("footer.finalText")}
            </p>

            <a
              href="#reservar"
              data-testid="footer-final-cta-button"
              className="gold-glow inline-flex items-center gap-2 rounded-full bg-gold px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-gold/25"
            >
              {t("footer.cta")}
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>

            {/* Operating hours */}
            <div className="mt-6 sm:mt-8">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-3 inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t("footer.hours")}
              </p>
              <div className="text-[10px] sm:text-xs text-[var(--muted-text)] space-y-1.5">
                {(schedule ? Object.entries(schedule) : []).map(([day, hours]) => (
                  <div key={day} data-testid={`footer-hours-${day}`} className="flex justify-between gap-2 max-w-xs">
                    <span>{weekdays[day] || day}</span>
                    <span className="text-[var(--foreground-strong)] font-medium">
                      {hours.open ? `${hours.start} – ${hours.end}` : t("footer.closed")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram — compact */}
            <div className="mt-4 sm:mt-5">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-2 sm:mb-3">
                {t("footer.follow")}
              </p>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="instagram-profile-link"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted-text)] hover:text-gold transition-colors"
              >
                <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                @slayedbyjoana17
              </a>
            </div>
          </div>

          {/* Right: map + QR */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Map */}
            <div
              data-testid="bilbao-map-container"
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[var(--border-soft)] min-h-[200px] sm:min-h-[240px] lg:min-h-[280px]"
            >
              <iframe
                title="Slayed by Joana17 - Bilbao"
                src={mapSrc}
                className="absolute inset-0 h-full w-full grayscale-[35%] contrast-[1.05]"
                loading="lazy"
              />
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ubicación de Slayed by Joana17 en Google Maps`}
                data-testid="footer-map-link"
                className="absolute inset-0 z-10"
              />
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 rounded-xl bg-[var(--surface)]/90 backdrop-blur border border-[var(--border-soft)] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 pointer-events-none">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold shrink-0" />
                <span
                  data-testid="footer-studio-address"
                  className="text-[10px] sm:text-xs font-medium leading-tight"
                >
                  {studioAddress}
                </span>
              </div>
            </div>

            {/* QR card — compact */}
            <div data-testid="qr-web-card" className="inline-flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-gold/25 bg-white p-3 sm:p-4 self-start">
              <img
                src="/qr-slayedbyjoana17.png"
                alt="Código QR web Slayed by Joana17"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-contain"
              />
              <div>
                <p className="font-display font-bold text-xs sm:text-sm text-gold">{t("footer.qrTitle")}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-text)] mt-0.5 leading-relaxed max-w-[140px] sm:max-w-[190px]">
                  {t("footer.qrText")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-5 sm:pt-6 border-t border-[var(--border-soft)] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p className="font-display font-extrabold text-sm sm:text-base">
            <span className="text-gold">SLAYED</span>
            <span className="text-[9px] sm:text-[10px] font-body font-medium tracking-[0.25em] text-[var(--muted-text)] uppercase ml-1 sm:ml-1.5">
              by Joana17
            </span>
          </p>
          <p className="text-[9px] sm:text-[10px] text-[var(--muted-text)] text-center sm:text-right">
            {t("footer.rights")}
          </p>
          <a
            href="/admin"
            data-testid="footer-admin-link"
            className="text-[9px] sm:text-[10px] text-[var(--muted-text)]/60 hover:text-gold transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    </footer>
  );
}
