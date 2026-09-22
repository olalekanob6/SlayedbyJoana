import { useCallback, useEffect, useState } from "react";
import { Save, Eye, EyeOff, Euro, Scissors } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { ALL_SERVICE_OPTIONS, EXTRAS, SERVICE_CATEGORIES, SIZES } from "@/data/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const CATEGORY_LABELS = { mujer: "Mujer", hombre: "Hombre", extras: "Extras" };

const clone = (value) => JSON.parse(JSON.stringify(value));
const EMPTY_CUSTOM_SERVICE = {
  category: "mujer",
  name: "",
  type: "simple",
  base: 0,
  duration_minutes: 60,
  descEs: "",
  descEn: "",
  options: [{ label: "", price: 0 }],
};

export default function CatalogPanel() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState(EMPTY_CUSTOM_SERVICE);

  const load = useCallback(() => {
    api.get("/admin/settings").then((r) => setSettings(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  useEffect(load, [load]);

  const updateSettings = (updater) => {
    setSettings((current) => {
      const next = clone(current);
      updater(next);
      return next;
    });
  };

  const updateOverride = (serviceId, key, value) => {
    updateSettings((next) => {
      next.service_overrides = next.service_overrides || {};
      next.service_overrides[serviceId] = {
        name: "",
        descEs: "",
        descEn: "",
        visible: true,
        order: 0,
        ...(next.service_overrides[serviceId] || {}),
        [key]: value,
      };
    });
  };

  const updatePriceBook = (serviceKey, updater) => {
    updateSettings((next) => {
      next.price_book = next.price_book || {};
      next.price_book[serviceKey] = next.price_book[serviceKey] || {};
      updater(next.price_book[serviceKey]);
    });
  };

  const updateCustomService = (serviceId, key, value) => {
    updateSettings((next) => {
      next.custom_services = (next.custom_services || []).map((service) =>
        service.id === serviceId ? { ...service, [key]: value } : service
      );
    });
  };

  const addCustomService = () => {
    const name = newService.name.trim();
    if (!name) {
      toast.error("Ponle un nombre al servicio");
      return;
    }
    if (Number(newService.base) <= 0) {
      toast.error("Pon un precio base mayor que 0");
      return;
    }
    if (newService.type === "options") {
      const labels = newService.options.map((option) => option.label.trim());
      if (!labels.length || labels.some((label) => !label)) {
        toast.error("Completa los nombres de las opciones");
        return;
      }
      if (new Set(labels).size !== labels.length) {
        toast.error("Hay opciones repetidas");
        return;
      }
    }
    const stamp = Date.now();
    const service = {
      id: `custom-${stamp}`,
      key: `custom_${stamp}`,
      category: newService.category,
      name,
      type: newService.type,
      base: Number(newService.base),
      options: newService.type === "options"
        ? newService.options.map((option) => ({ label: option.label.trim(), price: Number(option.price) }))
        : [],
      duration_minutes: Number(newService.duration_minutes),
      descEs: newService.descEs,
      descEn: newService.descEn,
      extras: [],
      visible: true,
      order: 100 + (settings.custom_services?.length || 0),
    };
    updateSettings((next) => {
      next.custom_services = [...(next.custom_services || []), service];
      next.price_book[service.key] = service.type === "options"
        ? { options: Object.fromEntries(service.options.map((option) => [option.label, option.price])), base: service.base }
        : { base: service.base };
      next.service_durations[service.key] = service.duration_minutes;
    });
    setNewService(EMPTY_CUSTOM_SERVICE);
    toast.success("Servicio añadido. Pulsa Guardar catálogo para publicarlo.");
  };

  const removeCustomService = (service) => {
    updateSettings((next) => {
      next.custom_services = (next.custom_services || []).filter((item) => item.id !== service.id);
      delete next.price_book?.[service.key];
      delete next.service_durations?.[service.key];
      delete next.service_overrides?.[service.id];
    });
    toast.success("Servicio eliminado. Pulsa Guardar catálogo para confirmarlo.");
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      window.dispatchEvent(new CustomEvent("site-config-updated"));
      toast.success("Catálogo guardado — ya se ve en la web");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div data-testid="catalog-loading" className="rounded-2xl border border-[var(--border-soft)] bg-white p-8 text-sm text-[var(--muted-text)]">Cargando catálogo...</div>;
  }

  const customOptions = (settings.custom_services || []).map((service) => ({
    id: service.id,
    name: service.name,
    key: service.key,
    category: service.category,
    service,
    custom: true,
  }));
  const allOptions = [...ALL_SERVICE_OPTIONS, ...customOptions];

  const renderPriceEditor = (option) => {
    const service = option.service;
    const key = option.key;
    const book = settings.price_book?.[key] || {};

    if (service.type === "matrix") {
      return (
        <div className="space-y-3">
          {Object.entries(service.lengths).map(([length, prices]) => (
            <div key={length} className="grid grid-cols-[90px_repeat(4,1fr)] gap-2 items-center">
              <p className="text-xs font-semibold text-[var(--muted-text)]">{length}</p>
              {prices.map((price, index) => (
                <Input
                  key={`${length}-${SIZES[index]}`}
                  data-testid={`price-${option.id}-${length}-${index}`}
                  type="number"
                  min="0"
                  value={book.lengths?.[length]?.[index] ?? price}
                  onChange={(e) => updatePriceBook(key, (draft) => {
                    draft.lengths = draft.lengths || clone(service.lengths);
                    draft.lengths[length][index] = Number(e.target.value);
                  })}
                  className="bg-white border-[var(--border-soft)] h-9"
                />
              ))}
            </div>
          ))}
          <PriceBaseInput option={option} value={book.base ?? service.base} onChange={(value) => updatePriceBook(key, (draft) => { draft.base = value; })} />
        </div>
      );
    }

    if (service.type === "sizes") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SIZES.map((size, index) => (
              <div key={size}>
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{size}</Label>
                <Input
                  data-testid={`price-${option.id}-${index}`}
                  type="number"
                  min="0"
                  value={book.sizes?.[index] ?? service.sizePrices[index]}
                  onChange={(e) => updatePriceBook(key, (draft) => {
                    draft.sizes = draft.sizes || [...service.sizePrices];
                    draft.sizes[index] = Number(e.target.value);
                  })}
                  className="mt-1 bg-white border-[var(--border-soft)] h-9"
                />
              </div>
            ))}
          </div>
          <PriceBaseInput option={option} value={book.base ?? service.base} onChange={(value) => updatePriceBook(key, (draft) => { draft.base = value; })} />
        </div>
      );
    }

    if (service.type === "options") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {service.options.map((optionPrice) => (
              <div key={optionPrice.label}>
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{optionPrice.label}</Label>
                <Input
                  data-testid={`price-${option.id}-${optionPrice.label}`}
                  type="number"
                  min="0"
                  value={book.options?.[optionPrice.label] ?? optionPrice.price}
                  onChange={(e) => updatePriceBook(key, (draft) => {
                    draft.options = draft.options || {};
                    draft.options[optionPrice.label] = Number(e.target.value);
                  })}
                  className="mt-1 bg-white border-[var(--border-soft)] h-9"
                />
              </div>
            ))}
          </div>
          <PriceBaseInput option={option} value={book.base ?? service.base} onChange={(value) => updatePriceBook(key, (draft) => { draft.base = value; })} />
        </div>
      );
    }

    return (
      <PriceBaseInput option={option} value={book.base ?? service.base} onChange={(value) => updatePriceBook(key, (draft) => { draft.base = value; })} />
    );
  };

  return (
    <div data-testid="catalog-panel" className="space-y-8 max-w-6xl">
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5 text-gold" /> Catálogo editable
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">Cambia precios, textos, orden y visibilidad. Al guardar, la web y las reservas usan los nuevos valores.</p>
        </div>
        <button data-testid="catalog-save-button" onClick={save} disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar catálogo"}
        </button>
      </div>

      <section data-testid="custom-service-form" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold">Añadir servicio personalizado</h3>
          <p className="text-sm text-[var(--muted-text)] mt-1">Crea servicios simples o con opciones. Los servicios actuales solo se pueden ocultar, no borrar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Categoría</Label>
            <select data-testid="new-service-category" value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm">
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="extras">Extras</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Nombre</Label>
            <Input data-testid="new-service-name" value={newService.name}
                   onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                   className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Duración (min)</Label>
            <Input data-testid="new-service-duration" type="number" min="10" max="720" step="5" value={newService.duration_minutes}
                   onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
                   className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Tipo de precio</Label>
            <select data-testid="new-service-type" value={newService.type}
                    onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm">
              <option value="simple">Simple / desde</option>
              <option value="options">Varias opciones</option>
            </select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Precio base €</Label>
            <Input data-testid="new-service-base" type="number" min="0" value={newService.base}
                   onChange={(e) => setNewService({ ...newService, base: Number(e.target.value) })}
                   className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10" />
          </div>
        </div>
        {newService.type === "options" && (
          <div className="space-y-2">
            {newService.options.map((option, index) => (
              <div key={index} className="grid grid-cols-[1fr_120px_auto] gap-2">
                <Input data-testid={`new-service-option-label-${index}`} placeholder="Nombre opción" value={option.label}
                       onChange={(e) => {
                         const options = [...newService.options];
                         options[index] = { ...options[index], label: e.target.value };
                         setNewService({ ...newService, options });
                       }}
                       className="bg-[var(--surface-soft)] border-[var(--border-soft)] h-10" />
                <Input data-testid={`new-service-option-price-${index}`} type="number" min="0" placeholder="€" value={option.price}
                       onChange={(e) => {
                         const options = [...newService.options];
                         options[index] = { ...options[index], price: Number(e.target.value) };
                         setNewService({ ...newService, options });
                       }}
                       className="bg-[var(--surface-soft)] border-[var(--border-soft)] h-10" />
                <button type="button" data-testid={`new-service-option-remove-${index}`}
                        onClick={() => setNewService({ ...newService, options: newService.options.filter((_, i) => i !== index) })}
                        className="rounded-full border border-red-300 px-3 text-xs font-bold text-red-400">
                  Quitar
                </button>
              </div>
            ))}
            <button type="button" data-testid="new-service-option-add"
                    onClick={() => setNewService({ ...newService, options: [...newService.options, { label: "", price: 0 }] })}
                    className="rounded-full border border-gold/50 px-4 py-2 text-xs font-bold text-gold">
              Añadir opción
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Textarea data-testid="new-service-desc-es" placeholder="Descripción ES" value={newService.descEs}
                    onChange={(e) => setNewService({ ...newService, descEs: e.target.value })}
                    className="min-h-20 bg-[var(--surface-soft)] border-[var(--border-soft)]" />
          <Textarea data-testid="new-service-desc-en" placeholder="Descripción EN" value={newService.descEn}
                    onChange={(e) => setNewService({ ...newService, descEn: e.target.value })}
                    className="min-h-20 bg-[var(--surface-soft)] border-[var(--border-soft)]" />
        </div>
        <button type="button" data-testid="new-service-add-button" onClick={addCustomService}
                className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] transition-colors">
          Añadir servicio
        </button>
      </section>


      {SERVICE_CATEGORIES.map((category) => (
        <section key={category} className="space-y-4">
          <h3 className="font-display text-xl font-bold">{CATEGORY_LABELS[category]}</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {allOptions.filter((option) => option.category === category).map((option, index) => {
              const isCustom = Boolean(option.custom);
              const override = isCustom ? option.service : (settings.service_overrides?.[option.id] || {});
              const visible = override.visible !== undefined ? override.visible : true;
              const updateField = isCustom ? updateCustomService : updateOverride;
              return (
                <article key={option.id} data-testid={`catalog-service-${option.id}`}
                         className="rounded-2xl border border-[var(--border-soft)] bg-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex-1">
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Nombre visible</Label>
                      <Input
                        data-testid={`service-name-${option.id}`}
                        value={isCustom ? option.service.name : (override.name || option.name)}
                        onChange={(e) => updateField(option.id, "name", e.target.value)}
                        className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Orden</Label>
                      <Input
                        data-testid={`service-order-${option.id}`}
                        type="number"
                        value={override.order ?? index}
                        onChange={(e) => updateField(option.id, "order", Number(e.target.value))}
                        className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10"
                      />
                    </div>
                    <button
                      type="button"
                      data-testid={`service-visible-${option.id}`}
                      onClick={() => updateField(option.id, "visible", !visible)}
                      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                        visible ? "border-green-400/40 text-green-500" : "border-[rgba(var(--accent-rgb),0.45)] text-[var(--muted-text)]"
                      }`}
                    >
                      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {visible ? "Visible" : "Oculto"}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        data-testid={`service-delete-${option.id}`}
                        onClick={() => removeCustomService(option.service)}
                        className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400 hover:text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  {isCustom && (
                    <div className="max-w-40">
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Duración (min)</Label>
                      <Input
                        data-testid={`service-duration-custom-${option.id}`}
                        type="number"
                        min="10"
                        max="720"
                        step="5"
                        value={option.service.duration_minutes}
                        onChange={(e) => {
                          const minutes = Number(e.target.value);
                          updateCustomService(option.id, "duration_minutes", minutes);
                          updateSettings((next) => { next.service_durations[option.key] = minutes; });
                        }}
                        className="mt-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-10"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Descripción ES</Label>
                      <Textarea
                        data-testid={`service-desc-es-${option.id}`}
                        value={override.descEs ?? option.service.descEs}
                        onChange={(e) => updateField(option.id, "descEs", e.target.value)}
                        className="mt-1 min-h-20 bg-[var(--surface-soft)] border-[var(--border-soft)]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Descripción EN</Label>
                      <Textarea
                        data-testid={`service-desc-en-${option.id}`}
                        value={override.descEn ?? option.service.descEn}
                        onChange={(e) => updateField(option.id, "descEn", e.target.value)}
                        className="mt-1 min-h-20 bg-[var(--surface-soft)] border-[var(--border-soft)]"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] mb-3 flex items-center gap-1.5">
                      <Euro className="h-3.5 w-3.5" /> Precios
                    </p>
                    {renderPriceEditor(option)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-4">
        <h3 className="font-display text-xl font-bold">Precios de extras</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXTRAS.map((extra) => (
            <div key={extra.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
              <Label className="text-xs font-semibold">{extra.nameEs}</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  data-testid={`extra-price-${extra.id}`}
                  type="number"
                  min="0"
                  value={settings.extras_prices?.[extra.id] ?? extra.price}
                  onChange={(e) => updateSettings((next) => {
                    next.extras_prices = next.extras_prices || {};
                    next.extras_prices[extra.id] = Number(e.target.value);
                  })}
                  className="bg-white border-[var(--border-soft)] h-10"
                />
                <span className="text-xs text-[var(--muted-text)]">€</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PriceBaseInput({ option, value, onChange }) {
  return (
    <div className="max-w-40">
      <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Precio base / desde</Label>
      <Input
        data-testid={`price-base-${option.id}`}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 bg-white border-[var(--border-soft)] h-9"
      />
    </div>
  );
}
