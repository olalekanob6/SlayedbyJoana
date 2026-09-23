import { useCallback, useEffect, useState } from "react";
import { Save, UserPlus, Trash2, Bell, Smartphone, Instagram, ShieldCheck, Clock, Scissors, MapPin, Palette, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { ALL_SERVICE_OPTIONS } from "@/data/services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAY_ROWS = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

const CATEGORY_LABELS = { mujer: "Mujer", hombre: "Hombre", extras: "Extras" };

const DEFAULT_SCHEDULE = {
  monday: { open: true, start: "14:30", end: "19:00" },
  tuesday: { open: true, start: "14:30", end: "19:00" },
  wednesday: { open: false, start: "14:30", end: "19:00" },
  thursday: { open: true, start: "14:30", end: "19:00" },
  friday: { open: true, start: "14:30", end: "19:00" },
  saturday: { open: true, start: "11:00", end: "18:30" },
  sunday: { open: true, start: "11:00", end: "18:30" },
};

const defaultDurationMinutes = (service) => {
  const duration = service.duration || "";
  const range = duration.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*h/);
  if (range) return Math.round(parseFloat(range[2].replace(",", ".")) * 60);
  const hours = duration.match(/(\d+(?:[.,]\d+)?)\s*h/);
  if (hours) return Math.round(parseFloat(hours[1].replace(",", ".")) * 60);
  const minutes = duration.match(/(\d+)\s*min/);
  if (minutes) return Number(minutes[1]);
  return 30;
};

const DEFAULT_THEME = {
  accent: "#E56B9E",
  background: "#FFFFFF",
  surface: "#FFF3F7",
  text: "#2E2126",
  muted: "#97707F",
  border: "#F5D3E2",
};

const DEFAULT_SETTINGS = {
  owner_notify_email: "",
  bizum_number: "",
  instagram: "",
  studio_address: "Barinaga 6, bajo derecha, Bilbao",
  theme: DEFAULT_THEME,
  daily_capacity: 2,
  slot_interval_minutes: 90,
  schedule: DEFAULT_SCHEDULE,
  date_overrides: {},
  service_durations: {},
};

const mergeSettings = (data = {}) => ({
  ...DEFAULT_SETTINGS,
  ...data,
  schedule: Object.fromEntries(
    DAY_ROWS.map(({ id }) => [id, { ...DEFAULT_SCHEDULE[id], ...(data.schedule?.[id] || {}) }])
  ),
  service_durations: { ...(data.service_durations || {}) },
  date_overrides: { ...(data.date_overrides || {}) },
  theme: { ...DEFAULT_THEME, ...(data.theme || {}) },
});

export default function SettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState({ date: "", open: true, start: "09:00", end: "18:00" });

  const load = useCallback(() => {
    api.get("/admin/settings").then((r) => setSettings(mergeSettings(r.data))).catch(() => {});
    api.get("/admin/admins").then((r) => setAdmins(r.data)).catch(() => {});
  }, []);

  useEffect(load, [load]);

  const updateDay = (day, key, value) => {
    setSettings((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        [day]: { ...current.schedule[day], [key]: value },
      },
    }));
  };

  const updateDuration = (serviceKey, minutes) => {
    setSettings((current) => ({
      ...current,
      service_durations: {
        ...current.service_durations,
        [serviceKey]: Number(minutes),
      },
    }));
  };

  const addDateOverride = () => {
    if (!exceptionDraft.date) return toast.error("Elige una fecha");
    setSettings((current) => ({
      ...current,
      date_overrides: { ...current.date_overrides, [exceptionDraft.date]: {
        open: exceptionDraft.open, start: exceptionDraft.start, end: exceptionDraft.end,
      } },
    }));
    setExceptionDraft({ date: "", open: true, start: "09:00", end: "18:00" });
  };

  const removeDateOverride = (date) => setSettings((current) => {
    const next = { ...current.date_overrides };
    delete next[date];
    return { ...current, date_overrides: next };
  });

  const durationFor = (option) =>
    settings.service_durations?.[option.key] ?? defaultDurationMinutes(option.service);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      window.dispatchEvent(new CustomEvent("site-config-updated"));
      toast.success("Ajustes guardados — ya valen en la web");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/admins", newAdmin);
      toast.success("Administradora añadida");
      setNewAdmin({ email: "", password: "", name: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const removeAdmin = async (email) => {
    try {
      await api.delete(`/admin/admins/${encodeURIComponent(email)}`);
      toast.success("Administradora eliminada");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <p className="font-display font-bold text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" /> Avisos y pagos
        </p>
        <div>
          <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Email que recibe las citas</Label>
          <Input data-testid="settings-notify-email" type="email" value={settings.owner_notify_email}
                 onChange={(e) => setSettings({ ...settings, owner_notify_email: e.target.value })}
                 className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          <p className="text-xs text-[var(--muted-text)] mt-1">A este email llega el aviso cada vez que alguien reserva.</p>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)] flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> Número de Bizum
          </Label>
          <Input data-testid="settings-bizum" value={settings.bizum_number}
                 onChange={(e) => setSettings({ ...settings, bizum_number: e.target.value })}
                 className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          <p className="text-xs text-[var(--muted-text)] mt-1">Se muestra a la clienta cuando elige pagar por Bizum.</p>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)] flex items-center gap-1.5">
            <Instagram className="h-3.5 w-3.5" /> Enlace de Instagram
          </Label>
          <Input data-testid="settings-instagram" value={settings.instagram}
                 onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                 className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Dirección del estudio
          </Label>
          <Input data-testid="settings-studio-address" value={settings.studio_address}
                 onChange={(e) => setSettings({ ...settings, studio_address: e.target.value })}
                 className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          <p className="text-xs text-[var(--muted-text)] mt-1">Se muestra en el pie de página y actualiza el mapa de Google.</p>
        </div>
        <button data-testid="settings-save-button" onClick={saveSettings} disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar ajustes"}
        </button>
      </div>


      <div data-testid="theme-settings" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-gold" /> Color de la página
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Elige los colores principales. Se aplican a la web y al panel al guardar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ["accent", "Color principal"],
            ["background", "Fondo"],
            ["surface", "Tarjetas suaves"],
            ["text", "Texto principal"],
            ["muted", "Texto suave"],
            ["border", "Bordes"],
          ].map(([key, label]) => (
            <div key={key} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
              <Label className="text-xs font-semibold">{label}</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  data-testid={`theme-color-${key}`}
                  type="color"
                  value={settings.theme?.[key] || DEFAULT_THEME[key]}
                  onChange={(e) => setSettings({
                    ...settings,
                    theme: { ...DEFAULT_THEME, ...(settings.theme || {}), [key]: e.target.value.toUpperCase() },
                  })}
                  className="h-11 w-16 cursor-pointer bg-white border-[var(--border-soft)] p-1"
                />
                <span data-testid={`theme-color-value-${key}`} className="text-xs font-semibold text-[var(--muted-text)]">
                  {settings.theme?.[key] || DEFAULT_THEME[key]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button data-testid="theme-save-button" onClick={saveSettings} disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar colores"}
        </button>
      </div>

      <div data-testid="schedule-settings" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" /> Horarios y límite de reservas
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Controla qué días aceptas citas, la primera y última hora disponible y cuántas reservas entran cada día.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Reservas máximas por día</Label>
            <Input data-testid="settings-daily-capacity" type="number" min="1" max="20"
                   value={settings.daily_capacity}
                   onChange={(e) => setSettings({ ...settings, daily_capacity: Number(e.target.value) })}
                   className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Intervalo entre huecos (minutos)</Label>
            <Input data-testid="settings-slot-interval" type="number" min="30" max="240" step="15"
                   value={settings.slot_interval_minutes}
                   onChange={(e) => setSettings({ ...settings, slot_interval_minutes: Number(e.target.value) })}
                   className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          </div>
        </div>

        <div className="space-y-3">
          {DAY_ROWS.map(({ id, label }) => {
            const day = settings.schedule[id];
            return (
              <div key={id} data-testid={`schedule-day-${id}`}
                   className="grid grid-cols-1 sm:grid-cols-[130px_110px_1fr_1fr] gap-3 items-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                <p className="text-sm font-semibold">{label}</p>
                <button type="button" data-testid={`schedule-open-${id}`}
                        onClick={() => updateDay(id, "open", !day.open)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                          day.open
                            ? "border-green-400/40 text-green-500 hover:bg-green-400 hover:text-white"
                            : "border-[rgba(var(--accent-rgb),0.45)] text-[var(--muted-text)] hover:bg-gold hover:text-white"
                        }`}>
                  {day.open ? "Abierto" : "Cerrado"}
                </button>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Desde</Label>
                  <Input data-testid={`schedule-start-${id}`} type="time" value={day.start} disabled={!day.open}
                         onChange={(e) => updateDay(id, "start", e.target.value)}
                         className="mt-1 bg-white border-[var(--border-soft)] h-10 disabled:opacity-50" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-[var(--muted-text)]">Hasta</Label>
                  <Input data-testid={`schedule-end-${id}`} type="time" value={day.end} disabled={!day.open}
                         onChange={(e) => updateDay(id, "end", e.target.value)}
                         className="mt-1 bg-white border-[var(--border-soft)] h-10 disabled:opacity-50" />
                </div>
              </div>
            );
          })}
        </div>

        <button data-testid="schedule-save-button" onClick={saveSettings} disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
      </div>

      <div data-testid="date-exception-settings" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-gold" /> Disponibilidad por fecha</p>
          <p className="text-sm text-[var(--muted-text)] mt-1">Abre, cierra o cambia el horario de una fecha concreta. No modifica ningún lunes, martes ni otra semana.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 items-end">
          <div><Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Fecha</Label><Input data-testid="date-exception-date" type="date" value={exceptionDraft.date} onChange={(e) => setExceptionDraft({ ...exceptionDraft, date: e.target.value })} className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" /></div>
          <div><Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Estado</Label><button type="button" data-testid="date-exception-open" onClick={() => setExceptionDraft({ ...exceptionDraft, open: !exceptionDraft.open })} className={`mt-2 w-full h-11 rounded-md border text-sm font-semibold ${exceptionDraft.open ? "border-green-400/40 text-green-600" : "border-red-400/40 text-red-500"}`}>{exceptionDraft.open ? "Abierto" : "Cerrado"}</button></div>
          <div><Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Desde</Label><Input data-testid="date-exception-start" type="time" disabled={!exceptionDraft.open} value={exceptionDraft.start} onChange={(e) => setExceptionDraft({ ...exceptionDraft, start: e.target.value })} className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11 disabled:opacity-50" /></div>
          <div><Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">Hasta</Label><Input data-testid="date-exception-end" type="time" disabled={!exceptionDraft.open} value={exceptionDraft.end} onChange={(e) => setExceptionDraft({ ...exceptionDraft, end: e.target.value })} className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-11 disabled:opacity-50" /></div>
          <button type="button" data-testid="date-exception-add" onClick={addDateOverride} className="h-11 rounded-full bg-gold px-5 text-sm font-bold text-white">Añadir</button>
        </div>
        <div className="space-y-2">
          {Object.entries(settings.date_overrides || {}).sort(([a], [b]) => a.localeCompare(b)).map(([date, override]) => (
            <div key={date} data-testid={`date-exception-${date}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
              <span className="text-sm font-semibold">{date}</span><span className={override.open ? "text-green-600 text-sm" : "text-red-500 text-sm"}>{override.open ? `Abierto · ${override.start}–${override.end}` : "Cerrado"}</span>
              <button type="button" aria-label={`Eliminar excepción ${date}`} onClick={() => removeDateOverride(date)} className="text-red-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
          {!Object.keys(settings.date_overrides || {}).length && <p className="text-sm text-[var(--muted-text)]">No hay excepciones configuradas.</p>}
        </div>
        <button data-testid="date-exception-save-button" onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"><Save className="h-4 w-4" />{saving ? "Guardando..." : "Guardar excepciones"}</button>
      </div>

      <div data-testid="duration-settings" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5 text-gold" /> Duración real de servicios
          </p>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Estos minutos bloquean los huecos siguientes y evitan que una cita se solape con otra.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_SERVICE_OPTIONS.map((option) => (
            <div key={option.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
              <Label className="text-xs font-semibold text-[var(--foreground-strong)]">
                {option.name} <span className="text-[var(--muted-text)] font-normal">· {CATEGORY_LABELS[option.category]}</span>
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  data-testid={`service-duration-${option.id}`}
                  type="number"
                  min="10"
                  max="720"
                  step="5"
                  value={durationFor(option)}
                  onChange={(e) => updateDuration(option.key, e.target.value)}
                  className="bg-white border-[var(--border-soft)] h-10"
                />
                <span className="text-xs text-[var(--muted-text)] shrink-0">min</span>
              </div>
            </div>
          ))}
        </div>
        <button data-testid="duration-save-button" onClick={saveSettings} disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar duraciones"}
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 space-y-5">
        <p className="font-display font-bold text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gold" /> Administradoras del panel
        </p>
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.email} data-testid={`admin-row-${a.email}`}
                 className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{a.name || "Admin"}</p>
                <p className="text-xs text-[var(--muted-text)] truncate">{a.email}</p>
              </div>
              <button data-testid={`admin-remove-${a.email}`} onClick={() => removeAdmin(a.email)}
                      className="text-red-400 hover:text-red-500 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <form data-testid="add-admin-form" onSubmit={addAdmin} className="space-y-3 pt-2 border-t border-[var(--border-soft)]">
          <p className="text-xs uppercase tracking-wider text-[var(--muted-text)] pt-2">Añadir administradora</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input data-testid="new-admin-name" placeholder="Nombre" value={newAdmin.name}
                   onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                   className="bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
            <Input data-testid="new-admin-email" type="email" required placeholder="Email" value={newAdmin.email}
                   onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                   className="bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
            <Input data-testid="new-admin-password" type="text" required placeholder="Contraseña (mín. 6)" value={newAdmin.password}
                   onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                   className="bg-[var(--surface-soft)] border-[var(--border-soft)] h-11" />
          </div>
          <button data-testid="add-admin-button" type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-3 text-sm font-bold text-gold hover:bg-gold hover:text-white transition-colors">
            <UserPlus className="h-4 w-4" /> Añadir
          </button>
        </form>
      </div>
    </div>
  );
}
