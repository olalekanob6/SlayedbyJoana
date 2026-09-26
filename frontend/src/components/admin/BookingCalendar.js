import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
const MONTHS_CAP = MONTHS_ES.map((m) => m[0].toUpperCase() + m.slice(1));

const DOT = {
  pending: "bg-amber-400",
  confirmed: "bg-green-500",
  cancelled: "bg-red-400",
};

/**
 * Calendario visual de disponibilidad para el panel admin.
 * Props:
 *  - byDay: { "YYYY-MM-DD": [booking, ...] } (de AdminPage)
 *  - selectedDate, onSelect: navegación de día seleccionado
 *  - currentMonth, onMonthChange: navegación de mes
 *  - dailyCapacity: número de citas máximas por día (default 2)
 *  - closedDates: array de fechas cerradas opcional (no usado por ahora; reservado)
 */
export default function BookingCalendar({
  byDay = {},
  selectedDate,
  onSelect,
  currentMonth,
  onMonthChange,
  dailyCapacity = 2,
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const iso = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-4 sm:p-6 shadow-[var(--ds-shadow-sm)]">
      {/* header mes */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => onMonthChange(-1)}
          className="h-9 w-9 rounded-full border border-[var(--ds-border-subtle)] flex items-center justify-center text-secondary hover:text-blush-primary hover:border-blush-soft transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display font-bold text-lg">
          {MONTHS_CAP[month]} {year}
        </p>
        <button
          onClick={() => onMonthChange(1)}
          className="h-9 w-9 rounded-full border border-[var(--ds-border-subtle)] flex items-center justify-center text-secondary hover:text-blush-primary hover:border-blush-soft transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* encabezados de semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted mb-2">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>

      {/* días */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((d, i) => {
          if (d === null) return <span key={`empty-${i}`} />;

          const date = iso(d);
          const items = byDay[date] || [];
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const occupied = items.filter((b) => b.status !== "cancelled").length;
          const available = Math.max(0, dailyCapacity - occupied);
          const isFull = occupied >= dailyCapacity;
          const hasBookings = items.length > 0;
          const hasPending = items.some((b) => b.status === "pending");
          const hasConfirmed = items.some((b) => b.status === "confirmed");
          const hasCancelled = items.some((b) => b.status === "cancelled");

          const base =
            "relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 border text-xs sm:text-sm " +
            (isSelected
              ? "bg-blush-primary text-white font-bold shadow-[var(--ds-shadow-sm)] ring-2 ring-blush-primary/30"
              : isToday
                ? "border-2 border-blush-primary/60 text-blush-primary font-semibold bg-blush-tint"
                : isFull
                  ? "bg-red-50 border border-red-200 text-red-600 font-semibold"
                  : hasBookings
                    ? "bg-cream-soft border border-[var(--ds-border-subtle)] hover:border-blush-soft hover:shadow-[var(--ds-shadow-sm)]"
                    : "text-muted hover:bg-cream-soft border border-transparent");

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={base}
              title={
                isFull
                  ? `Completo · ${occupied}/${dailyCapacity} citas`
                  : hasBookings
                    ? `${occupied} cita${occupied !== 1 ? "s" : ""} · ${available} libre${available === 1 ? "" : "s"}`
                    : "Sin citas"
              }
            >
              {d}

              {/* dots de estado */}
              {hasBookings && !isSelected && (
                <span className="flex gap-0.5 mt-0.5">
                  {hasPending && <span className={`h-1.5 w-1.5 rounded-full ${DOT.pending}`} title="Pendiente" />}
                  {hasConfirmed && <span className={`h-1.5 w-1.5 rounded-full ${DOT.confirmed}`} title="Confirmada" />}
                  {hasCancelled && <span className={`h-1.5 w-1.5 rounded-full ${DOT.cancelled}`} title="Cancelada" />}
                </span>
              )}

              {/* contador de citas (cuando no está seleccionado) */}
              {hasBookings && !isSelected && (
                <span className="absolute top-0.5 right-1 text-[9px] font-bold text-blush-deep bg-white/80 rounded-full px-1 py-0.5 leading-none">
                  {occupied}
                </span>
              )}

              {/* barra de capacidad restante (solo cuando hay alguna cita y no está lleno) */}
              {hasBookings && !isFull && !isSelected && (
                <div className="absolute bottom-0.5 left-1.5 right-1.5 h-0.5 rounded-full bg-red-200/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all"
                    style={{ width: `${(occupied / dailyCapacity) * 100}%` }}
                  />
                </div>
              )}

              {/* badge completo */}
              {isFull && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[8px] font-bold uppercase ${
                    isSelected ? "bg-white/20 text-white" : "bg-red-400/10 text-red-500"
                  }`}
                >
                  Lleno
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* leyenda */}
      <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blush-primary" /> Pendiente
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Confirmada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Cancelada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-full bg-red-400/10 px-2 py-px text-[9px] font-bold text-red-500 border border-red-200">
            Lleno
          </span>
          límite diario
        </span>
      </div>
    </div>
  );
}
