import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
export const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_CAP = MONTHS_ES.map((m) => m[0].toUpperCase() + m.slice(1));

const DOTS = { pending: "bg-yellow-400", confirmed: "bg-green-400", cancelled: "bg-red-400" };

export default function BookingCalendar({ byDay, selectedDate, onSelect, currentMonth, onMonthChange, dailyCapacity = 2 }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = new Date().toISOString().split("T")[0];

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const iso = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div data-testid="bookings-calendar" className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button data-testid="calendar-prev-month" onClick={() => onMonthChange(-1)}
                className="h-9 w-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--muted-text)] hover:text-gold hover:border-gold/40 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p data-testid="calendar-month-label" className="font-display font-bold text-lg">{MONTHS_CAP[month]} {year}</p>
        <button data-testid="calendar-next-month" onClick={() => onMonthChange(1)}
                className="h-9 w-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--muted-text)] hover:text-gold hover:border-gold/40 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-[var(--muted-text)] mb-2">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={`empty-${i}`} />;
          const date = iso(d);
          const items = byDay[date] || [];
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const isFull = items.length >= dailyCapacity;
          return (
            <button
              key={date}
              data-testid={`calendar-day-${date}`}
              onClick={() => onSelect(date)}
              className={`relative aspect-square rounded-xl text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
                isSelected
                  ? "bg-gold text-[#FFFFFF] font-bold"
                  : isToday
                    ? "border border-gold/60 text-gold font-semibold"
                    : items.length
                      ? "bg-[var(--surface-soft)] border border-[var(--border-soft)] hover:border-gold/40"
                      : "text-[var(--muted-text)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              {d}
              {items.length > 0 && (
                <span className="flex gap-0.5">
                  {["pending", "confirmed", "cancelled"].map((s) =>
                    items.some((b) => b.status === s) ? (
                      <span key={s} className={`h-1.5 w-1.5 rounded-full ${DOTS[s]}`} />
                    ) : null
                  )}
                </span>
              )}
              {items.length > 0 && !isSelected && (
                <span className="absolute top-0.5 right-1 text-[9px] font-bold text-gold">{items.length}</span>
              )}
              {isFull && (
                <span
                  data-testid={`calendar-full-${date}`}
                  className={`absolute bottom-0.5 rounded-full px-1.5 py-px text-[8px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-red-400/10 text-red-400"
                  }`}
                >
                  Completo
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-[var(--muted-text)]">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Pendiente</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-400" /> Confirmada</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Cancelada</span>
        <span className="inline-flex items-center gap-1.5"><span className="rounded-full bg-red-400/10 px-2 py-px text-[9px] font-bold text-red-400">Completo</span> límite diario</span>
      </div>
    </div>
  );
}
