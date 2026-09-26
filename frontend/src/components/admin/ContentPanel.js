import { useCallback, useEffect, useState } from "react";
import { Save, Type, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { translations } from "@/i18n/translations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const getPath = (obj, path) => path.split(".").reduce((value, key) => value?.[key], obj);

const CONTENT_GROUPS = [
  {
    title: "Portada",
    fields: [
      ["hero.badge", "Etiqueta superior"],
      ["hero.titleA", "Título parte 1"],
      ["hero.titleAccent", "Título destacado"],
      ["hero.titleB", "Título parte 2"],
      ["hero.subtitle", "Subtítulo", "textarea"],
      ["hero.cta", "Botón principal"],
      ["hero.secondary", "Botón secundario"],
      ["hero.cardTitle", "Tarjeta: título"],
      ["hero.cardText", "Tarjeta: texto", "textarea"],
    ],
  },
  {
    title: "Secciones principales",
    fields: [
      ["why.title", "Por qué Joana: título"],
      ["services.title", "Servicios: título"],
      ["services.subtitle", "Servicios: subtítulo", "textarea"],
      ["gallery.title", "Galería: título"],
      ["gallery.subtitle", "Galería: subtítulo", "textarea"],
      ["booking.title", "Reserva: título"],
      ["booking.subtitle", "Reserva: subtítulo", "textarea"],
      ["testimonials.title", "Reseñas: título"],
      ["testimonials.subtitle", "Reseñas: subtítulo", "textarea"],
    ],
  },
  {
    title: "Sobre Joana",
    fields: [
      ["about.title", "Título"],
      ["about.p1", "Párrafo 1", "textarea"],
      ["about.p2", "Párrafo 2", "textarea"],
      ["about.signature", "Firma"],
      ["about.role", "Rol"],
    ],
  },
  {
    title: "FAQ y pie de página",
    fields: [
      ["faq.title", "FAQ: título"],
      ["footer.finalTitle", "CTA final: título"],
      ["footer.finalText", "CTA final: texto", "textarea"],
      ["footer.cta", "CTA final: botón"],
      ["footer.qrTitle", "QR: título"],
      ["footer.qrText", "QR: texto", "textarea"],
      ["footer.rights", "Derechos"],
    ],
  },
];

export default function ContentPanel() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/admin/settings").then((r) => setSettings(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  useEffect(load, [load]);

  const contentValue = (lang, key) => settings?.site_content?.[lang]?.[key] ?? getPath(translations[lang], key) ?? "";

  const updateContent = (lang, key, value) => {
    setSettings((current) => ({
      ...current,
      site_content: {
        es: { ...(current.site_content?.es || {}) },
        en: { ...(current.site_content?.en || {}) },
        [lang]: {
          ...(current.site_content?.[lang] || {}),
          [key]: value,
        },
      },
    }));
  };

  const updatePromo = (key, value) => {
    setSettings((current) => ({
      ...current,
      promo: { enabled: false, text_es: "", text_en: "", ...(current.promo || {}), [key]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      window.dispatchEvent(new CustomEvent("site-config-updated"));
      toast.success("Contenido guardado — ya se ve en la web");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div data-testid="content-loading" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 text-sm text-[var(--muted-text)]">Cargando contenido...</div>;
  }

  const renderField = ([key, label, type]) => {
    const InputComponent = type === "textarea" ? Textarea : Input;
    return (
      <div key={key} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3">{label}</p>
        <div className="flex flex-col gap-3">
          {["es", "en"].map((lang) => (
            <div key={lang} className="flex flex-col gap-2">
              <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{lang === "es" ? "Español" : "English"}</Label>
              <InputComponent
                data-testid={`content-${key.replaceAll(".", "-")}-${lang}`}
                value={contentValue(lang, key)}
                onChange={(e) => updateContent(lang, key, e.target.value)}
                className={`w-full bg-white border-[var(--border-soft)] h-[44px] ${type === "textarea" ? "sm:h-[60px]" : ""}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineArray = (key, label) => (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3">{label} (una línea por elemento)</p>
      <div className="flex flex-col gap-3">
        {["es", "en"].map((lang) => (
          <div key={lang} className="flex flex-col gap-2">
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{lang === "es" ? "Español" : "English"}</Label>
            <Textarea
              data-testid={`content-${key.replaceAll(".", "-")}-${lang}`}
              value={(contentValue(lang, key) || []).join("\n")}
              onChange={(e) => updateContent(lang, key, e.target.value.split("\n").map((line) => line.trim()).filter(Boolean))}
              className="w-full h-[44px] sm:h-[60px] bg-white border-[var(--border-soft)]"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderFaqItems = () => (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Preguntas frecuentes</p>
      {(contentValue("es", "faq.items") || []).map((_, index) => (
        <div key={index} className="rounded-xl bg-white border border-[var(--border-soft)] p-4 space-y-3">
          <p className="text-xs font-bold text-gold">Pregunta {index + 1}</p>
          <div className="flex flex-col gap-3">
            {["es", "en"].map((lang) => {
              const items = contentValue(lang, "faq.items") || [];
              return (
                <div key={lang} className="flex flex-col gap-2">
                  <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{lang === "es" ? "Pregunta" : "Question"}</Label>
                  <Input
                    data-testid={`faq-q-${index}-${lang}`}
                    value={items[index]?.q || ""}
                    onChange={(e) => {
                      const next = [...items];
                      next[index] = { ...next[index], q: e.target.value };
                      updateContent(lang, "faq.items", next);
                    }}
                    className="w-full bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px]"
                    placeholder={`Pregunta (${lang.toUpperCase()})`}
                  />
                  <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{lang === "es" ? "Respuesta" : "Answer"}</Label>
                  <Textarea
                    data-testid={`faq-a-${index}-${lang}`}
                    value={items[index]?.a || ""}
                    onChange={(e) => {
                      const next = [...items];
                      next[index] = { ...next[index], a: e.target.value };
                      updateContent(lang, "faq.items", next);
                    }}
                    className="w-full min-h-[44px] sm:h-[80px] bg-[var(--surface-soft)] border-[var(--border-soft)]"
                    placeholder={`Respuesta (${lang.toUpperCase()})`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div data-testid="content-panel" className="space-y-8 max-w-full overflow-x-hidden">
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-gold" /> Contenido de la web
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">Edita los textos existentes en español e inglés. Los cambios se aplican al guardar.</p>
        </div>
        <button data-testid="content-save-button" onClick={save} disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors min-w-[44px] min-h-[44px]">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar contenido"}
        </button>
      </div>

      <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 space-y-4">
        <p className="font-display font-bold text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-gold" /> Aviso o promoción
        </p>
        <button
          type="button"
          data-testid="promo-enabled-toggle"
          onClick={() => updatePromo("enabled", !settings.promo?.enabled)}
          className={`rounded-full border px-5 py-2 text-xs font-bold transition-colors min-h-[44px] ${
            settings.promo?.enabled ? "border-green-400/40 text-green-500" : "border-[rgba(var(--accent-rgb),0.45)] text-[var(--muted-text)]"
          }`}
        >
          {settings.promo?.enabled ? "Visible en la web" : "Oculto"}
        </button>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Texto ES</Label>
            <Textarea data-testid="promo-text-es" value={settings.promo?.text_es || ""}
                      onChange={(e) => updatePromo("text_es", e.target.value)}
                      className="w-full min-h-[44px] sm:h-[80px] bg-[var(--surface-soft)] border-[var(--border-soft)]" />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Texto EN</Label>
            <Textarea data-testid="promo-text-en" value={settings.promo?.text_en || ""}
                      onChange={(e) => updatePromo("text_en", e.target.value)}
                      className="w-full min-h-[44px] sm:h-[80px] bg-[var(--surface-soft)] border-[var(--border-soft)]" />
          </div>
        </div>
      </section>

      {CONTENT_GROUPS.map((group) => (
        <section key={group.title} className="space-y-4">
          <h3 className="font-display text-xl sm:text-2xl font-bold">{group.title}</h3>
          <div className="space-y-4">
            {group.fields.map(renderField)}
          </div>
        </section>
      ))}

      <section className="space-y-4">
        <h3 className="font-display text-xl sm:text-2xl font-bold">Listas de texto</h3>
        {renderLineArray("marquee", "Palabras de la cinta animada")}
        {renderLineArray("about.points", "Puntos destacados de Sobre Joana")}
        {renderFaqItems()}
      </section>
    </div>
  );
}
