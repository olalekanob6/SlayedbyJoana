import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mail, Phone, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const STATUS_STYLES = {
  waiting: "border-yellow-400/30 bg-yellow-400/10 text-yellow-500",
  notified: "border-blue-400/30 bg-blue-400/10 text-blue-500",
  contacted: "border-green-400/30 bg-green-400/10 text-green-500",
};

const STATUS_LABELS = {
  waiting: "Esperando",
  notified: "Avisada por email",
  contacted: "Contactada",
};

export default function WaitlistPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/waitlist")
      .then((r) => setEntries(r.data))
      .catch((err) => toast.error(formatApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markContacted = async (id) => {
    try {
      await api.patch(`/admin/waitlist/${id}`, { status: "contacted" });
      toast.success("Marcada como contactada");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/waitlist/${id}`);
      toast.success("Entrada eliminada");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="waitlist-admin-panel" className="max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" /> Lista de espera
          </p>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1">
            Clientas que dejaron sus datos cuando un día estaba completo.
          </p>
        </div>
        <button
          data-testid="waitlist-refresh"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs sm:text-sm font-bold text-gold hover:bg-gold hover:text-white transition-colors min-h-[44px]"
        >
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 text-sm text-[var(--muted-text)]">
          Cargando lista...
        </div>
      ) : entries.length === 0 ? (
        <div data-testid="waitlist-empty" className="rounded-2xl border border-[var(--border-soft)] bg-white p-6 text-sm text-[var(--muted-text)]">
          No hay nadie en lista de espera.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article
              key={entry.id}
              data-testid={`waitlist-entry-${entry.id}`}
              className="rounded-2xl border border-[var(--border-soft)] bg-white p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-base sm:text-lg">{entry.name}</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-2 min-h-[44px] text-[10px] sm:text-[11px] font-bold ${STATUS_STYLES[entry.status] || STATUS_STYLES.waiting}`}
                    >
                      {STATUS_LABELS[entry.status] || entry.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-1">{entry.service} · {entry.date}</p>
                  <div className="mt-1 sm:mt-2 flex flex-wrap gap-2 sm:gap-3 text-xs text-[var(--muted-text)]">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {entry.phone}</span>
                    {entry.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {entry.email}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap flex-row-reverse sm:flex-row">
                  {entry.status !== "contacted" && (
                    <button
                      data-testid={`waitlist-contacted-${entry.id}`}
                      onClick={() => markContacted(entry.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-400/40 px-4 py-2 text-xs font-bold text-green-500 hover:bg-green-400 hover:text-white transition-colors min-h-[44px]"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Contactada
                    </button>
                  )}
                  <button
                    data-testid={`waitlist-delete-${entry.id}`}
                    onClick={() => remove(entry.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
