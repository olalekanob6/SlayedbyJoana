import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Calendar, Clock, Phone, Mail, AlertCircle, CheckCircle2, XCircle, CreditCard, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import BookingCalendar from "@/components/admin/BookingCalendar";
import CatalogPanel from "@/components/admin/CatalogPanel";
import ContentPanel from "@/components/admin/ContentPanel";
import EarningsPanel from "@/components/admin/EarningsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";
import WaitlistPanel from "@/components/admin/WaitlistPanel";
import GalleryPanel from "@/components/admin/GalleryPanel";

const tabs = [
  ["dashboard", "Inicio"],
  ["bookings", "Reservas"],
  ["calendar", "Calendario"],
  ["gallery", "Galería"],
  ["catalog", "Catálogo"],
  ["content", "Contenido"],
  ["earnings", "Ganancias"],
  ["waitlist", "Lista espera"],
  ["settings", "Ajustes"],
];

const STATUS_LABEL = { pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada" };
const STATUS_BADGE_CLASS = {
  pending: "bg-blush-tint text-blush-deep border-blush-soft",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

export default function AdminPage() {
  const { user, loginWithEmail, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const tomorrowIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().slice(0, 10);
  const weekIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().slice(0, 10);

  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/bookings")
        .then((r) => setBookings(r.data))
        .catch((error) => toast.error(formatApiError(error)));
    }
  }, [user]);

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await loginWithEmail(email, password);
      setPassword("");
    } catch (error) {
      setLoginError(error?.response?.data?.detail || "Correo o contraseña incorrectos.");
    } finally {
      setLoggingIn(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const haystack = [booking.name, booking.phone, booking.email].join(" ").toLowerCase();
      const statusOk = statusFilter === "all" || booking.status === statusFilter;
      const paymentOk = paymentFilter === "all" || (paymentFilter === "paid" ? booking.payment_status === "paid" : booking.payment_status !== "paid");
      const dateOk = dateFilter === "all"
        || (dateFilter === "today" && booking.date === todayIso)
        || (dateFilter === "tomorrow" && booking.date === tomorrowIso)
        || (dateFilter === "week" && booking.date >= todayIso && booking.date <= weekIso);
      return statusOk && paymentOk && dateOk && (!query || haystack.includes(query));
    }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [bookings, statusFilter, dateFilter, paymentFilter, search, todayIso, tomorrowIso, weekIso]);

  const byDay = useMemo(() => bookings.reduce((all, b) => ({ ...all, [b.date]: [...(all[b.date] || []), b] }), {}), [bookings]);

  const todayBookings = useMemo(() => filteredBookings.filter((b) => b.date === todayIso), [filteredBookings, todayIso]);

  const counts = useMemo(() => ({
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    unpaid: bookings.filter((b) => b.payment_status !== "paid" && b.status !== "cancelled").length,
    paid: bookings.filter((b) => b.payment_status === "paid").length,
  }), [bookings]);

  const nextAppointments = useMemo(() =>
    bookings.filter((b) => b.date >= todayIso && b.status === "confirmed")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 6),
    [bookings, todayIso]
  );

  const unpaidBookings = useMemo(() =>
    bookings.filter((b) => b.payment_status !== "paid" && b.status !== "cancelled"),
    [bookings]
  );

  const setView = (value) => { setStatusFilter(value); setDateFilter("all"); };

  const reloadBookings = () => api.get("/bookings").then((r) => setBookings(r.data)).catch((error) => toast.error(formatApiError(error)));

  // ── LOGIN ──
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-blush-bg p-6">
        <div className="w-full max-w-sm rounded-3xl border border-[var(--ds-border-subtle)] bg-white p-8 shadow-[var(--ds-shadow-lg)]">
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-blush-primary to-blush-deep flex items-center justify-center shadow-[var(--ds-shadow-glow)]">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-onyx-primary">Slayed by Joana</h1>
            <p className="text-sm text-muted mt-1">Inicia sesión para gestionar tu estudio</p>
          </div>
          <form onSubmit={submitLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username"
                className="w-full h-12 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-4 text-sm text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full h-12 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-4 text-sm text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none" />
            </div>
            {loginError && (
              <p role="alert" className="text-sm text-blush-deep flex items-center gap-2 bg-blush-tint rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />{loginError}
              </p>
            )}
            <button type="submit" disabled={loggingIn}
              className="w-full h-12 rounded-full bg-blush-primary text-white font-bold text-sm disabled:opacity-50 transition-all hover:bg-blush-hover hover:shadow-[var(--ds-shadow-button-hover)] active:scale-[0.99]">
              {loggingIn ? "Iniciando sesión…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center bg-blush-bg p-6 text-center">
        <div className="max-w-sm">
          <div className="rounded-3xl border border-[var(--ds-border-subtle)] bg-white p-8 shadow-[var(--ds-shadow-md)]">
            <h2 className="font-display text-xl font-bold">Acceso no autorizado</h2>
            <p className="text-sm text-muted mt-2">No tienes permisos de administración.</p>
            <button onClick={logout}
              className="mt-5 h-10 rounded-full border border-blush-soft bg-blush-tint text-sm font-semibold text-blush-deep hover:bg-blush-soft transition-colors">
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-blush-bg p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blush-primary to-blush-deep flex items-center justify-center shadow-[var(--ds-shadow-glow-soft)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-onyx-primary">Slayed by Joana</h1>
              <p className="text-xs text-muted">Panel de administración</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted hidden sm:inline">{user.email}</span>
            <button onClick={logout}
              className="h-9 rounded-full border border-[var(--ds-border-subtle)] bg-white px-4 text-xs font-semibold text-secondary hover:border-blush-soft hover:text-blush-deep transition-colors flex items-center gap-1.5 shadow-[var(--ds-shadow-sm)]">
              <XCircle className="h-3.5 w-3.5" /> Salir
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="mb-6 overflow-x-auto">
          <div className="flex gap-2 flex-nowrap sm:flex-wrap">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`h-10 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-all ${
                  tab === id
                    ? "bg-onyx-primary text-white shadow-[var(--ds-shadow-md)]"
                    : "border border-[var(--ds-border-subtle)] bg-white text-secondary hover:border-blush-soft hover:text-blush-deep"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ═══════════ INICIO / DASHBOARD ═══════════ */}
        {tab === "dashboard" && (
          <div className="space-y-5">
            {/* Banner del día */}
            <div className="rounded-3xl bg-gradient-to-br from-blush-primary to-blush-deep p-6 sm:p-8 text-white shadow-[var(--ds-shadow-glow)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm opacity-80 font-medium uppercase tracking-wider">
                    {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="font-display text-3xl sm:text-4xl font-bold mt-1 leading-tight">
                    {todayBookings.length} cita{todayBookings.length !== 1 ? "s" : ""} hoy
                  </p>
                </div>
                <button onClick={() => { setTab("bookings"); setDateFilter("today"); setStatusFilter("all"); }}
                  className="h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-5 text-sm font-bold hover:bg-white/30 transition-colors flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Ver citas de hoy
                </button>
              </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total citas", value: counts.all, icon: Calendar, cls: "text-secondary" },
                { label: "Confirmadas", value: counts.confirmed, icon: CheckCircle2, cls: "text-green-500" },
                { label: "Pendientes", value: counts.pending, icon: AlertCircle, cls: "text-blush-deep" },
                { label: "Señal pendiente", value: counts.unpaid, icon: CreditCard, cls: "text-amber-600" },
              ].map((card) => (
                <div key={card.label}
                  className="bg-white px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{card.label}</p>
                      <p className={`font-display text-2xl sm:text-3xl font-bold mt-1 ${card.cls}`}>{card.value}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-cream-soft/50">
                      <card.icon className={`h-5 w-5 ${card.cls}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Citas de hoy */}
            {todayBookings.length > 0 && (
              <section className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-5 sm:p-6 shadow-[var(--ds-shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blush-primary" /> Citas de hoy
                  </h2>
                  <button onClick={() => { setTab("bookings"); setDateFilter("today"); }}
                    className="text-sm font-semibold text-blush-deep hover:text-blush-primary transition-colors">
                    Ver todas →
                  </button>
                </div>
                <div className="space-y-2">
                  {todayBookings.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream-soft px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{b.name}</p>
                        <p className="text-xs text-muted mt-0.5">{b.service} · {b.time}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={b.status} />
                        {b.payment_status === "paid" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" />Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                            <CreditCard className="h-3 w-3" />Señal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Próximas citas */}
            {nextAppointments.length > 0 && (
              <section className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-5 sm:p-6 shadow-[var(--ds-shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blush-primary" /> Próximas citas
                  </h2>
                  <button onClick={() => { setTab("bookings"); setDateFilter("week"); }}
                    className="text-sm font-semibold text-blush-deep hover:text-blush-primary transition-colors">
                    Ver semana →
                  </button>
                </div>
                <div className="space-y-2">
                  {nextAppointments.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{b.name}</p>
                        <p className="text-xs text-muted mt-0.5">{b.date} · {b.time} · {b.service}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Señales pendientes */}
            {unpaidBookings.length > 0 && (
              <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-gold" />
                  <h2 className="font-display font-bold">Señales pendientes de cobro</h2>
                </div>
                <div className="space-y-2">
                  {unpaidBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[var(--ds-border-subtle)] px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{b.service}</p>
                        <p className="text-xs text-muted">{b.name} · {b.date}</p>
                      </div>
                      <button onClick={() => { setTab("bookings"); setStatusFilter("all"); setPaymentFilter("pending"); }}
                        className="h-8 rounded-full border border-gold/40 px-3 text-xs font-bold text-gold hover:bg-gold hover:text-white transition-colors flex items-center justify-center">
                        Cobrar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Vacío */}
            {todayBookings.length === 0 && nextAppointments.length === 0 && (
              <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-8 text-center">
                <Calendar className="h-10 w-10 text-muted mx-auto mb-3" />
                <p className="font-display text-base font-bold">No hay citas programadas</p>
                <p className="text-sm text-muted mt-1">Las reservas aparecerán aquí automáticamente.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ RESERVAS ═══════════ */}
        {tab === "bookings" && (
          <div className="space-y-5">
            {/* Filtros por estado */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "Todas", count: counts.all },
                { id: "pending", label: "Pendientes", count: counts.pending },
                { id: "confirmed", label: "Confirmadas", count: counts.confirmed },
                { id: "cancelled", label: "Canceladas", count: counts.cancelled },
              ].map((c) => (
                <button key={c.id} onClick={() => setView(c.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    statusFilter === c.id && dateFilter === "all"
                      ? "bg-blush-primary border-blush-primary text-white shadow-[var(--ds-shadow-sm)]"
                      : "border-[var(--ds-border-subtle)] bg-white text-secondary hover:border-blush-soft hover:text-blush-deep"
                  }`}>
                  {c.label}
                  <span className={`ml-1.5 text-xs ${statusFilter === c.id && dateFilter === "all" ? "text-white/70" : "text-muted"}`}>
                    ({c.count})
                  </span>
                </button>
              ))}
            </div>

            {/* Barra de filtros */}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-3 sm:p-4 shadow-[var(--ds-shadow-sm)]">
              <div className="relative flex-1 min-w-[180px]">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, teléfono o email…"
                  className="w-full h-10 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-4 text-sm outline-none focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/15 transition-colors" />
              </div>
              <div className="flex gap-2">
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-3 text-sm outline-none focus:border-blush-primary transition-colors">
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="tomorrow">Mañana</option>
                  <option value="week">Próximos 7 días</option>
                </select>
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--ds-border-subtle)] bg-cream-soft px-3 text-sm outline-none focus:border-blush-primary transition-colors">
                  <option value="all">Todos los pagos</option>
                  <option value="pending">Señal pendiente</option>
                  <option value="paid">Señal recibida</option>
                </select>
              </div>
            </div>

            {/* Botones rápidos */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDateFilter("today")}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${
                  dateFilter === "today" ? "bg-blush-primary text-white shadow-[var(--ds-shadow-sm)]" : "border border-[var(--ds-border-subtle)] bg-white text-secondary hover:border-blush-soft"
                }`}>
                <Clock className="h-4 w-4" /> HOY
              </button>
              <button onClick={() => { setDateFilter("week"); setStatusFilter("all"); }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  dateFilter === "week" ? "bg-blush-primary text-white shadow-[var(--ds-shadow-sm)]" : "border border-[var(--ds-border-subtle)] bg-white text-secondary hover:border-blush-soft"
                }`}>
                PRÓXIMAS CITAS
              </button>
              {dateFilter !== "all" && (
                <button onClick={() => { setDateFilter("all"); setStatusFilter("all"); }}
                  className="rounded-full border border-red-200 text-red-400 px-4 py-2 text-sm font-bold bg-white hover:bg-red-50 transition-colors">
                  Limpiar filtros
                </button>
              )}
              <button onClick={reloadBookings}
                className="rounded-full border border-[var(--ds-border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-secondary hover:border-blush-soft hover:text-blush-deep transition-colors flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
              </button>
            </div>

            {/* Calendario */}
            <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-4 sm:p-6 shadow-[var(--ds-shadow-sm)]">
              <BookingCalendar byDay={byDay} selectedDate={selectedDate} onSelect={setSelectedDate} currentMonth={month}
                onMonthChange={(delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))} />
            </div>

            {/* Lista */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-secondary">
                {filteredBookings.length === 0 ? "Sin resultados" : `${filteredBookings.length} reserva${filteredBookings.length !== 1 ? "s" : ""}`}
                {search && <span className="text-muted"> para «{search}»</span>}
              </p>
              {filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-10 text-center">
                  <Calendar className="h-8 w-8 text-muted mx-auto mb-3" />
                  <p className="text-sm text-muted">No hay reservas que coincidan con los filtros.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredBookings.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} reload={reloadBookings} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ CALENDARIO ═══════════ */}
        {tab === "calendar" && (
          <div className="max-w-3xl space-y-5">
            <BookingCalendar byDay={byDay} selectedDate={selectedDate} onSelect={setSelectedDate} currentMonth={month}
              onMonthChange={(delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))} />
            {selectedDate && byDay[selectedDate]?.length > 0 && (
              <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-5 shadow-[var(--ds-shadow-sm)]">
                <p className="font-display font-bold text-sm mb-3">{selectedDate} · {byDay[selectedDate].length} cita{byDay[selectedDate].length !== 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {byDay[selectedDate].map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream-soft px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{b.name}</p>
                        <p className="text-xs text-muted">{b.time} · {b.service}</p>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Demás pestañas */}
        {tab === "gallery" && <GalleryPanel />}
        {tab === "catalog" && <CatalogPanel />}
        {tab === "content" && <ContentPanel />}
        {tab === "earnings" && <EarningsPanel />}
        {tab === "waitlist" && <WaitlistPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

// ── Componentes auxiliares ──

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
      STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS.pending
    }`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function BookingRow({ booking, reload }) {
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState(false);
  const bookingId = booking.id || booking._id;
  const isToday = booking.date === todayIso;

  const update = async (status) => {
    setBusy(status);
    try {
      await api.patch(`/bookings/${encodeURIComponent(bookingId)}`, { status });
      await reload();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy("");
    }
  };

  const markPaid = async () => {
    setBusy("paid");
    try {
      await api.patch(`/bookings/${encodeURIComponent(bookingId)}/payment`, { payment_status: "paid" });
      await reload();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy("");
    }
  };

  const deleteBooking = async () => {
    if (!window.confirm("¿Eliminar esta reserva cancelada?\nLa reserva se quitará del listado.")) return;
    setDeleting(true);
    try {
      await api.delete(`/bookings/${encodeURIComponent(bookingId)}`);
      await reload();
      toast.success("Reserva eliminada correctamente.");
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-4 sm:p-5 shadow-[var(--ds-shadow-sm)] hover:shadow-[var(--ds-shadow-md)] hover:border-blush-soft transition-all">

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              isToday
                ? "bg-blush-primary border-blush-primary text-white"
                : "bg-cream-soft text-muted border-[var(--ds-border-subtle)]"
            }`}>
              <Calendar className="h-3 w-3" />{booking.date}
            </span>
            <StatusBadge status={booking.status} />
          </div>
          <p className="font-display text-base font-bold mt-1.5 truncate">{booking.name}</p>
          <p className="text-sm text-muted mt-0.5">{booking.service}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-sm text-blush-deep">{booking.time}</p>
          <p className="text-xs text-muted mt-0.5">{booking.phone}</p>
        </div>
      </div>

      {/* Contacto + pago */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted mb-4 pb-3 border-b border-[var(--ds-border-subtle)]">
        {booking.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{booking.email}</span>}
        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{booking.phone}</span>
        {booking.payment_status === "paid" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 font-bold">
            <CheckCircle2 className="h-3 w-3" />Señal recibida
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 font-bold">
            <CreditCard className="h-3 w-3" />Señal pendiente
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button disabled={Boolean(busy) || !bookingId || booking.status === "cancelled"} onClick={() => update("confirmed")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            busy === "confirmed" ? "bg-green-200 text-green-700" :
            booking.status === "confirmed" ? "bg-green-50 text-green-600 border border-green-200 cursor-default" :
            "bg-green-500 text-white hover:bg-green-600 shadow-[var(--ds-shadow-sm)] disabled:opacity-50"
          }`}>
          {busy === "confirmed" ? "Guardando…" : booking.status === "confirmed" ? "Confirmada" : "Confirmar"}
        </button>
        <button disabled={Boolean(busy) || !bookingId || booking.payment_status === "paid"} onClick={markPaid}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            busy === "paid" ? "bg-amber-200 text-amber-700" :
            booking.payment_status === "paid" ? "bg-green-50 text-green-600 border border-green-200 cursor-default" :
            "bg-amber-500 text-white hover:bg-amber-600 shadow-[var(--ds-shadow-sm)] disabled:opacity-50"
          }`}>
          {busy === "paid" ? "Guardando…" : booking.payment_status === "paid" ? "Pagada" : "Señal recibida"}
        </button>
        <button disabled={Boolean(busy) || !bookingId || booking.status === "cancelled"} onClick={() => update("cancelled")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            busy === "cancelled" ? "bg-red-200 text-red-700" :
            booking.status === "cancelled" ? "bg-red-50 text-red-600 border border-red-200 cursor-default" :
            "bg-red-500 text-white hover:bg-red-600 shadow-[var(--ds-shadow-sm)] disabled:opacity-50"
          }`}>
          {busy === "cancelled" ? "Guardando…" : booking.status === "cancelled" ? "Cancelada" : "Cancelar"}
        </button>
        {booking.status === "cancelled" && (
          <button disabled={Boolean(deleting) || !bookingId} onClick={deleteBooking}
            className="rounded-xl px-3 py-2 text-xs font-bold text-red-500 border border-red-300 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50">
            {deleting ? "Eliminando…" : "🗑 Eliminar"}
          </button>
        )}
      </div>
    </article>
  );
}
