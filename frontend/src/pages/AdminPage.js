import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import BookingCalendar from "@/components/admin/BookingCalendar";
import CatalogPanel from "@/components/admin/CatalogPanel";
import ContentPanel from "@/components/admin/ContentPanel";
import EarningsPanel from "@/components/admin/EarningsPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";
import WaitlistPanel from "@/components/admin/WaitlistPanel";

const tabs = [["bookings", "Reservas"], ["catalog", "Catálogo"], ["content", "Contenido"], ["earnings", "Ganancias"], ["waitlist", "Lista de espera"], ["settings", "Ajustes"]];

export default function AdminPage() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("bookings");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    if (user?.role === "admin") api.get("/bookings").then((r) => setBookings(r.data)).catch(() => {});
  }, [user]);

  const byDay = useMemo(() => bookings.reduce((all, booking) => ({ ...all, [booking.date]: [...(all[booking.date] || []), booking] }), {}), [bookings]);
  if (!user) return <div className="min-h-screen grid place-items-center p-6"><button onClick={() => loginWithGoogle("/admin")} className="rounded-full bg-gold px-6 py-3 font-bold text-white">Iniciar sesión</button></div>;
  if (user.role !== "admin") return <div className="min-h-screen grid place-items-center p-6 text-center"><p>No tienes permisos de administración.</p><button onClick={logout} className="ml-3 underline">Salir</button></div>;
  return <div className="min-h-screen bg-[var(--page-bg)] p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-display text-3xl font-bold">Panel de administración</h1><p className="text-sm text-[var(--muted-text)]">{user.email}</p></div><button onClick={logout} className="rounded-full border px-4 py-2 text-sm">Salir</button></header>
    <nav className="mb-8 flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-gold text-white" : "border"}`}>{label}</button>)}</nav>
    {tab === "bookings" && <><BookingCalendar byDay={byDay} selectedDate={selectedDate} onSelect={setSelectedDate} currentMonth={month} onMonthChange={(delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))} /><div className="mt-6 space-y-3">{(selectedDate ? byDay[selectedDate] || [] : bookings).map((b) => <BookingRow key={b.id} booking={b} reload={() => api.get("/bookings").then((r) => setBookings(r.data))} />)}</div></>}
    {tab === "catalog" && <CatalogPanel />}{tab === "content" && <ContentPanel />}{tab === "earnings" && <EarningsPanel />}{tab === "waitlist" && <WaitlistPanel />}{tab === "settings" && <SettingsPanel />}
  </div></div>;
}

function BookingRow({ booking, reload }) {
  const update = async (status) => { await api.patch(`/bookings/${booking.id}`, { status }); reload(); };
  const markPaid = async () => { await api.patch(`/bookings/${booking.id}/payment`, { payment_status: "paid" }); reload(); };
  return <article className="rounded-2xl border bg-white p-4 flex flex-wrap items-center justify-between gap-3"><div><b>{booking.date} · {booking.time} · {booking.service}</b><p className="text-sm text-[var(--muted-text)]">{booking.name} · {booking.phone} · {booking.payment_status}</p></div><div className="flex gap-2"><button onClick={() => update("confirmed")} className="rounded-full border border-green-300 px-3 py-1 text-xs">Confirmar</button><button onClick={markPaid} className="rounded-full border border-gold px-3 py-1 text-xs">Señal recibida</button><button onClick={() => update("cancelled")} className="rounded-full border border-red-300 px-3 py-1 text-xs">Cancelar</button></div></article>;
}
