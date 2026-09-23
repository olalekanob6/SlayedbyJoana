import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import BookingCalendar from "@/components/admin/BookingCalendar";
import CatalogPanel from "@/components/admin/CatalogPanel";
import ContentPanel from "@/components/admin/ContentPanel";
import EarningsPanel from "@/components/admin/EarningsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";
import WaitlistPanel from "@/components/admin/WaitlistPanel";
import GalleryPanel from "@/components/admin/GalleryPanel";

const tabs = [["bookings", "Reservas"], ["gallery", "Galería"], ["catalog", "Catálogo"], ["content", "Contenido"], ["earnings", "Ganancias"], ["waitlist", "Lista de espera"], ["settings", "Ajustes"]];

export default function AdminPage() {
  const { user, loginWithEmail, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("bookings");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailsId, setDetailsId] = useState("");

  useEffect(() => {
    if (user?.role === "admin") api.get("/bookings").then((r) => setBookings(r.data)).catch((error) => toast.error(formatApiError(error)));
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

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const tomorrowIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString().slice(0, 10);
  const weekIso = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().slice(0, 10);
  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const haystack = [booking.name, booking.phone, booking.email].join(" ").toLowerCase();
      const statusOk = statusFilter === "all" || booking.status === statusFilter;
      const paymentOk = paymentFilter === "all" || (paymentFilter === "paid" ? booking.payment_status === "paid" : booking.payment_status !== "paid");
      const dateOk = dateFilter === "all" || (dateFilter === "today" && booking.date === todayIso) || (dateFilter === "tomorrow" && booking.date === tomorrowIso) || (dateFilter === "week" && booking.date >= todayIso && booking.date <= weekIso);
      return statusOk && paymentOk && dateOk && (!query || haystack.includes(query));
    }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [bookings, statusFilter, dateFilter, paymentFilter, search, todayIso, tomorrowIso, weekIso]);
  const byDay = useMemo(() => bookings.reduce((all, booking) => ({ ...all, [booking.date]: [...(all[booking.date] || []), booking] }), {}), [bookings]);
  const counts = useMemo(() => ({ all: bookings.length, pending: bookings.filter((b) => b.status === "pending").length, confirmed: bookings.filter((b) => b.status === "confirmed").length, cancelled: bookings.filter((b) => b.status === "cancelled").length }), [bookings]);
  const setView = (value) => { setStatusFilter(value); setDateFilter("all"); };
  if (!user) return <div className="min-h-screen grid place-items-center bg-[var(--page-bg)] p-6"><form onSubmit={submitLogin} className="w-full max-w-md rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-xl"><h1 className="mb-6 font-display text-2xl font-bold">Iniciar sesión</h1><label className="mb-4 block text-sm font-semibold">Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" className="mt-2 w-full rounded-xl border px-4 py-3" /></label><label className="mb-4 block text-sm font-semibold">Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 w-full rounded-xl border px-4 py-3" /></label>{loginError && <p role="alert" className="mb-4 text-sm text-red-500">{loginError}</p>}<button type="submit" disabled={loggingIn} className="w-full rounded-full bg-gold px-6 py-3 font-bold text-white disabled:opacity-60">{loggingIn ? "Iniciando sesión…" : "Iniciar sesión"}</button></form></div>;
  if (user.role !== "admin") return <div className="min-h-screen grid place-items-center p-6 text-center"><p>No tienes permisos de administración.</p><button onClick={logout} className="ml-3 underline">Salir</button></div>;
  return <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-display text-3xl font-bold">Panel de administración</h1><p className="text-sm text-[var(--muted-text)]">{user.email}</p></div><button onClick={logout} className="rounded-full border px-4 py-2 text-sm">Salir</button></header>
    <nav className="mb-8 flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-gold text-white" : "border"}`}>{label}</button>)}</nav>
    {tab === "bookings" && <><div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["all", "Todas"], ["pending", "Pendientes"], ["confirmed", "Confirmadas"], ["cancelled", "Canceladas"]].map(([id, label]) => <button key={id} onClick={() => setView(id)} className={`rounded-2xl border p-4 text-left ${statusFilter === id && dateFilter === "all" ? "border-gold bg-gold/10" : "border-[var(--border-soft)] bg-white"}`}><span className="block text-xs uppercase text-[var(--muted-text)]">{label}</span><strong className="font-display text-2xl text-gold">{counts[id]}</strong></button>)}</div><div className="mb-6 grid gap-3 rounded-2xl border border-[var(--border-soft)] bg-white p-4 md:grid-cols-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, teléfono o email" className="rounded-xl border px-3 py-2 md:col-span-2" /><select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-xl border px-3 py-2"><option value="all">Todas las fechas</option><option value="today">Hoy</option><option value="tomorrow">Mañana</option><option value="week">Próximos 7 días</option></select><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-xl border px-3 py-2"><option value="all">Todos los pagos</option><option value="pending">Señal pendiente</option><option value="paid">Señal recibida</option></select></div><div className="mb-6 flex gap-2"><button onClick={() => setDateFilter("today")} className={`rounded-full px-4 py-2 text-sm font-bold ${dateFilter === "today" ? "bg-gold text-white" : "border"}`}>HOY</button><button onClick={() => { setDateFilter("week"); setStatusFilter("all"); }} className={`rounded-full px-4 py-2 text-sm font-bold ${dateFilter === "week" ? "bg-gold text-white" : "border"}`}>PRÓXIMAS CITAS</button></div><BookingCalendar byDay={byDay} selectedDate={selectedDate} onSelect={setSelectedDate} currentMonth={month} onMonthChange={(delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))} /><div className="mt-6 space-y-3">{(selectedDate ? filteredBookings.filter((b) => b.date === selectedDate) : filteredBookings).length === 0 ? <p className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 text-sm text-[var(--muted-text)]">No hay citas con estos filtros.</p> : (selectedDate ? filteredBookings.filter((b) => b.date === selectedDate) : filteredBookings).map((b) => <div key={b.id || b._id}><BookingRow booking={b} reload={() => api.get("/bookings").then((r) => setBookings(r.data))} onDetails={() => setDetailsId(detailsId === (b.id || b._id) ? "" : (b.id || b._id))} />{detailsId === (b.id || b._id) && <div className="-mt-2 rounded-b-2xl border border-t-0 bg-white p-4 text-sm">{b.phone}{b.email ? ` · ${b.email}` : ""}{b.duration_minutes ? ` · ${b.duration_minutes} min` : ""}</div>}</div>)}</div></>}
    {tab === "gallery" && <GalleryPanel />}{tab === "catalog" && <CatalogPanel />}{tab === "content" && <ContentPanel />}{tab === "earnings" && <EarningsPanel />}{tab === "waitlist" && <WaitlistPanel />}{tab === "settings" && <SettingsPanel />}
  </div></div>;
}

function BookingRow({ booking, reload, onDetails }) {
  const [busy, setBusy] = useState("");
  const bookingId = booking.id || booking._id;
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
  return <article className="rounded-2xl border bg-white p-4 flex flex-wrap items-center justify-between gap-3"><div><b>{booking.date} · {booking.time} · {booking.service}</b><p className="text-sm text-[var(--muted-text)]">{booking.name} · {booking.phone} · estado: {booking.status} · pago: {booking.payment_status}</p></div><div className="flex gap-2"><button type="button" onClick={onDetails} className="rounded-full border px-3 py-1 text-xs">Ver detalles</button><button disabled={Boolean(busy) || !bookingId} onClick={() => update("confirmed")} className="rounded-full border border-green-300 px-3 py-1 text-xs disabled:opacity-50">{busy === "confirmed" ? "Guardando…" : "Confirmar"}</button><button disabled={Boolean(busy) || !bookingId || booking.payment_status === "paid"} onClick={markPaid} className="rounded-full border border-gold px-3 py-1 text-xs disabled:opacity-50">{busy === "paid" ? "Guardando…" : "Señal recibida"}</button><button disabled={Boolean(busy) || !bookingId} onClick={() => update("cancelled")} className="rounded-full border border-red-300 px-3 py-1 text-xs disabled:opacity-50">{busy === "cancelled" ? "Guardando…" : "Cancelar"}</button></div></article>;
}
