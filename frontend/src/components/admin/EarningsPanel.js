import { useEffect, useState } from "react";
import { TrendingUp, CalendarDays, CalendarRange, Wallet, CreditCard, Smartphone } from "lucide-react";
import { api } from "@/lib/api";

export default function EarningsPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/earnings").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) {
    return <p data-testid="earnings-loading" className="text-[var(--muted-text)] py-8">Cargando ganancias...</p>;
  }

  const cards = [
    { label: "Hoy", value: data.today, icon: CalendarDays, testId: "earnings-today" },
    { label: "Esta semana", value: data.week, icon: CalendarRange, testId: "earnings-week" },
    { label: "Este mes", value: data.month, icon: TrendingUp, testId: "earnings-month" },
    { label: "Total", value: data.total, icon: Wallet, testId: "earnings-total" },
  ];

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--muted-text)]">
        Se cuentan las señales cobradas: tarjeta (automático) y Bizum cuando pulsas "Señal Bizum recibida".
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.testId} data-testid={c.testId}
               className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 hover:border-gold/40 transition-colors">
            <c.icon className="h-5 w-5 text-gold mb-3" />
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-gold">
              {c.value.toFixed(2).replace(".", ",")}€
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-text)] mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-display font-bold text-sm uppercase tracking-widest text-gold mb-4">Últimos cobros</p>
        {data.items.length === 0 ? (
          <p data-testid="earnings-empty" className="text-sm text-[var(--muted-text)]">
            Aún no hay cobros registrados. Cuando una clienta pague la señal, aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-3">
            {data.items.map((e) => (
              <div key={e.id} data-testid={`earning-item-${e.id}`}
                   className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{e.client || "Clienta"}</p>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">{e.service} · cita {e.booking_date}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    e.method === "online"
                      ? "border-gold/40 text-gold"
                      : "border-purple-400/40 text-purple-400"
                  }`}>
                    {e.method === "online" ? <CreditCard className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                    {e.method === "online" ? "Tarjeta" : "Bizum"}
                  </span>
                  <span className="font-display font-bold text-green-400">+{e.amount.toFixed(0)}€</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
