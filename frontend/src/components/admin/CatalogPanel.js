import { useCallback, useEffect, useState } from "react";
import { Save, Eye, EyeOff, Euro, Scissors, Plus, Minus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState(null);

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
    if (!name) { toast.error("Ponle un nombre al servicio"); return; }
    if (Number(newService.base) <= 0) { toast.error("Pon un precio base mayor que 0"); return; }
    if (newService.type === "options") {
      const labels = newService.options.map((o) => o.label.trim());
      if (!labels.length || labels.some((l) => !l)) { toast.error("Completa los nombres de las opciones"); return; }
      if (new Set(labels).size !== labels.length) { toast.error("Hay opciones repetidas"); return; }
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
        ? newService.options.map((o) => ({ label: o.label.trim(), price: Number(o.price) }))
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
        ? { options: Object.fromEntries(service.options.map((o) => [o.label, o.price])), base: service.base }
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
    return <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-8 text-sm text-[var(--muted-text)]">Cargando catálogo...</div>;
  }

  const allOptions = SERVICE_CATEGORIES.flatMap((cat) =>
    ALL_SERVICE_OPTIONS.filter((o) => o.category === cat).map((o) => ({ ...o, category: cat }))
  );

  const customOptions = (settings.custom_services || []).map((service) => ({
    id: service.id,
    name: service.name,
    key: service.key,
    category: service.category,
    service,
    custom: true,
  }));

  // ---- Price editor: simplified, inline, less dense ----
  const renderPriceEditor = (option) => {
    const service = option.service;
    const key = option.key;
    const book = settings.price_book?.[key] || {};

    if (service.type === "matrix") {
      return (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 sm:p-4">
            <div className="min-w-[300px]">
              <div className="grid gap-2">
                {Object.entries(service.lengths).map(([length, prices]) => (
                  <div key={length} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--muted-text)] w-14 shrink-0">{length}</span>
                    {prices.map((price, index) => (
                      <div key={index} className="flex items-center gap-1 flex-1">
                        <span className="text-[10px] text-[var(--muted-text)] w-6 shrink-0">{SIZES[index]}</span>
                        <Input
                          type="number"
                          min="0"
                          value={book.lengths?.[length]?.[index] ?? price}
                          onChange={(e) => updatePriceBook(key, (d) => {
                            d.lengths = d.lengths || clone(service.lengths);
                            d.lengths[length][index] = Number(e.target.value);
                          })}
                          className="w-20 bg-white border-[var(--border-soft)] h-[40px] text-center text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">Desde</span>
            <Input
              type="number"
              min="0"
              value={book.base ?? service.base}
              onChange={(e) => updatePriceBook(key, (d) => { d.base = Number(e.target.value); })}
              className="flex-1 bg-white border-[var(--border-soft)] h-[44px] text-lg font-bold text-gold"
            />
            <span className="text-lg font-bold text-gold">€</span>
          </div>
        </div>
      );
    }

    if (service.type === "sizes") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SIZES.map((size, index) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">{size}</Label>
                <Input
                  type="number"
                  min="0"
                  value={book.sizes?.[index] ?? service.sizePrices[index]}
                  onChange={(e) => updatePriceBook(key, (d) => {
                    d.sizes = d.sizes || [...service.sizePrices];
                    d.sizes[index] = Number(e.target.value);
                  })}
                  className="bg-white border-[var(--border-soft)] h-[40px] text-center w-20"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">Desde</span>
            <Input
              type="number"
              min="0"
              value={book.base ?? service.base}
              onChange={(e) => updatePriceBook(key, (d) => { d.base = Number(e.target.value); })}
              className="flex-1 bg-white border-[var(--border-soft)] h-[44px] text-lg font-bold text-gold"
            />
            <span className="text-lg font-bold text-gold">€</span>
          </div>
        </div>
      );
    }

    if (service.type === "options") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {service.options.map((opt) => (
              <div key={opt.label} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted-text)] w-24 shrink-0">{opt.label}</span>
                <Input
                  type="number"
                  min="0"
                  value={book.options?.[opt.label] ?? opt.price}
                  onChange={(e) => updatePriceBook(key, (d) => {
                    d.options = d.options || {};
                    d.options[opt.label] = Number(e.target.value);
                  })}
                  className="w-24 bg-white border-[var(--border-soft)] h-[40px] text-center"
                />
                <span className="text-sm text-gold font-bold">€</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">Base</span>
            <Input
              type="number"
              min="0"
              value={book.base ?? service.base}
              onChange={(e) => updatePriceBook(key, (d) => { d.base = Number(e.target.value); })}
              className="flex-1 bg-white border-[var(--border-soft)] h-[44px] text-lg font-bold text-gold"
            />
            <span className="text-lg font-bold text-gold">€</span>
          </div>
        </div>
      );
    }

    // Simple / desde
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">Desde</span>
        <Input
          type="number"
          min="0"
          value={book.base ?? service.base}
          onChange={(e) => updatePriceBook(key, (d) => { d.base = Number(e.target.value); })}
          className="flex-1 bg-white border-[var(--border-soft)] h-[48px] text-xl font-bold text-gold"
        />
        <span className="text-xl font-bold text-gold">€</span>
      </div>
    );
  };

  // ---- Service card (simplified) ----
  const ServiceCard = ({ option, index }) => {
    const isCustom = Boolean(option.custom);
    const override = isCustom ? option.service : (settings.service_overrides?.[option.id] || {});
    const visible = override.visible !== undefined ? override.visible : true;
    const updateField = isCustom ? updateCustomService : updateOverride;
    const isExpanded = expandedId === option.id;

    return (
      <article
        key={option.id}
        data-testid={`catalog-service-${option.id}`}
        className={`rounded-2xl border transition-all ${visible ? "border-[var(--border-soft)] bg-white" : "border-[var(--border-soft)] bg-[var(--surface-soft)] opacity-60"}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Visibility toggle */}
            <button
              type="button"
              onClick={() => updateField(option.id, "visible", !visible)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors min-h-[36px] ${
                visible
                  ? "border-green-400/40 text-green-500 bg-green-50"
                  : "border-[var(--border-soft)] text-[var(--muted-text)] bg-white"
              }`}
            >
              {visible ? <Eye className="h-3 w-3 inline mr-1" /> : <EyeOff className="h-3 w-3 inline mr-1" />}
              {visible ? "Visible" : "Oculto"}
            </button>

            {/* Name + prices */}
            <div className="min-w-0">
              <p className="font-display text-base font-bold truncate text-[var(--foreground-strong)]">
                {isCustom ? option.service.name : (override.name || option.name)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] mt-0.5">
                {CATEGORY_LABELS[option.category]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Expand */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : option.id)}
              className="rounded-full border border-[var(--border-soft)] p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--muted-text)] hover:text-gold hover:border-gold/40 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Delete custom only */}
            {isCustom && (
              <button
                type="button"
                onClick={() => removeCustomService(option.service)}
                className="rounded-full border border-red-200 px-2 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-400 hover:text-white transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-soft)]">
            {/* Order + duration */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Orden</Label>
                <Input
                  type="number"
                  value={override.order ?? index}
                  onChange={(e) => updateField(option.id, "order", Number(e.target.value))}
                  className="w-16 bg-[var(--surface-soft)] border-[var(--border-soft)] h-[36px] text-center text-sm"
                />
              </div>
              {isCustom && (
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Duración</Label>
                  <Input
                    type="number"
                    min="10"
                    max="720"
                    step="5"
                    value={option.service.duration_minutes}
                    onChange={(e) => {
                      const min = Number(e.target.value);
                      updateCustomService(option.id, "duration_minutes", min);
                      updateSettings((next) => { next.service_durations[option.key] = min; });
                    }}
                    className="w-20 bg-[var(--surface-soft)] border-[var(--border-soft)] h-[36px] text-center text-sm"
                  />
                  <span className="text-[10px] text-[var(--muted-text)]">min</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Descripción ES</Label>
                <Textarea
                  value={override.descEs ?? option.service.descEs}
                  onChange={(e) => updateField(option.id, "descEs", e.target.value)}
                  className="mt-1 min-h-[60px] w-full bg-[var(--surface-soft)] border-[var(--border-soft)] text-sm resize-none"
                  placeholder="Descripción en español..."
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Descripción EN</Label>
                <Textarea
                  value={override.descEn ?? option.service.descEn}
                  onChange={(e) => updateField(option.id, "descEn", e.target.value)}
                  className="mt-1 min-h-[60px] w-full bg-[var(--surface-soft)] border-[var(--border-soft)] text-sm resize-none"
                  placeholder="Description in English..."
                />
              </div>
            </div>

            {/* Prices */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Euro className="h-3.5 w-3.5 text-gold" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-text)]">Precios</span>
              </div>
              <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                {renderPriceEditor(option)}
              </div>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <div data-testid="catalog-panel" className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5 text-gold" /> Catálogo editable
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Cambia precios, textos, orden y visibilidad. Al guardar, la web y las reservas usan los nuevos valores.
          </p>
        </div>
        <button
          data-testid="catalog-save-button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-white hover:bg-gold/90 disabled:opacity-60 transition-colors min-h-[44px] shrink-0"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar catálogo"}
        </button>
      </div>

      {/* Add custom service */}
      <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-gold" /> Añadir servicio personalizado
          </h3>
          <p className="text-sm text-[var(--muted-text)] mt-1">Crea servicios simples o con opciones. Los servicios actuales solo se pueden ocultar, no borrar.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Categoría</Label>
            <select
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              className="mt-1 h-[44px] w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
            >
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="extras">Extras</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Nombre</Label>
            <Input
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="mt-1 w-full bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px]"
              placeholder="Ej: Peinado vintage"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Duración (min)</Label>
            <Input
              type="number"
              min="10"
              max="720"
              step="5"
              value={newService.duration_minutes}
              onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
              className="mt-1 w-full bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px]"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Tipo</Label>
            <select
              value={newService.type}
              onChange={(e) => setNewService({ ...newService, type: e.target.value })}
              className="mt-1 h-[44px] w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
            >
              <option value="simple">Simple / desde</option>
              <option value="options">Varias opciones</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Precio base €</Label>
            <Input
              type="number"
              min="0"
              value={newService.base}
              onChange={(e) => setNewService({ ...newService, base: Number(e.target.value) })}
              className="mt-1 w-full bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px]"
            />
          </div>
        </div>

        {/* Options (when type = options) */}
        {newService.type === "options" && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] font-semibold">Opciones</p>
            {newService.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Nombre opción"
                  value={opt.label}
                  onChange={(e) => {
                    const opts = [...newService.options];
                    opts[idx] = { ...opts[idx], label: e.target.value };
                    setNewService({ ...newService, options: opts });
                  }}
                  className="flex-1 bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px]"
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="€"
                  value={opt.price}
                  onChange={(e) => {
                    const opts = [...newService.options];
                    opts[idx] = { ...opts[idx], price: Number(e.target.value) };
                    setNewService({ ...newService, options: opts });
                  }}
                  className="w-24 bg-[var(--surface-soft)] border-[var(--border-soft)] h-[44px] text-center"
                />
                <button
                  type="button"
                  onClick={() => setNewService({ ...newService, options: newService.options.filter((_, i) => i !== idx) })}
                  className="rounded-full border border-red-200 px-3 py-2 min-h-[44px] text-xs font-bold text-red-400 hover:bg-red-400 hover:text-white transition-colors"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNewService({ ...newService, options: [...newService.options, { label: "", price: 0 }] })}
              className="rounded-full border border-gold/40 px-4 py-2 min-h-[44px] text-xs font-bold text-gold hover:bg-gold hover:text-white transition-colors"
            >
              + Añadir opción
            </button>
          </div>
        )}

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Descripción ES</Label>
            <Textarea
              placeholder="Descripción en español..."
              value={newService.descEs}
              onChange={(e) => setNewService({ ...newService, descEs: e.target.value })}
              className="mt-1 min-h-[60px] w-full bg-[var(--surface-soft)] border-[var(--border-soft)] text-sm resize-none"
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Descripción EN</Label>
            <Textarea
              placeholder="Description in English..."
              value={newService.descEn}
              onChange={(e) => setNewService({ ...newService, descEn: e.target.value })}
              className="mt-1 min-h-[60px] w-full bg-[var(--surface-soft)] border-[var(--border-soft)] text-sm resize-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addCustomService}
          className="rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-gold/90 transition-colors min-h-[44px]"
        >
          Añadir servicio
        </button>
      </section>

      {/* Service list by category */}
      {SERVICE_CATEGORIES.map((category) => {
        const categoryOptions = [...allOptions.filter((o) => o.category === category), ...customOptions.filter((o) => o.category === category)];
        if (categoryOptions.length === 0) return null;
        return (
          <section key={category} className="space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <span className="h-5 w-5 text-gold">▼</span> {CATEGORY_LABELS[category]}
              <span className="text-sm font-normal text-[var(--muted-text)]">({categoryOptions.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryOptions.map((option, index) => (
                <ServiceCard key={option.id} option={option} index={index} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Extras prices */}
      <section className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 space-y-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <Euro className="h-5 w-5 text-gold" /> Precios de extras
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {EXTRAS.map((extra) => (
            <div key={extra.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3 sm:p-4">
              <Label className="text-sm font-semibold">{extra.nameEs}</Label>
              <div className="mt-2 flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={settings.extras_prices?.[extra.id] ?? extra.price}
                  onChange={(e) => updateSettings((next) => {
                    next.extras_prices = next.extras_prices || {};
                    next.extras_prices[extra.id] = Number(e.target.value);
                  })}
                  className="bg-white border-[var(--border-soft)] h-[44px] w-full text-center font-bold text-gold"
                />
                <span className="text-lg font-bold text-gold">€</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
