import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function PaymentResult({ type }) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState(type === "cancel" ? "cancelled" : "checking");
  useEffect(() => {
    if (type !== "success") return;
    const id = params.get("session_id");
    if (!id) return setStatus("missing");
    api.get(`/payments/status/${encodeURIComponent(id)}`).then((r) => setStatus(r.data.payment_status)).catch(() => setStatus("error"));
  }, [params, type]);
  const message = status === "paid" ? "Pago recibido. Tu señal está registrada." : status === "cancelled" ? "El pago se canceló. Puedes volver a reservar." : status === "checking" ? "Comprobando el pago…" : "No se ha podido confirmar el pago todavía.";
  return <main className="min-h-screen grid place-items-center p-6 text-center"><div><h1 className="font-display text-3xl font-bold">{message}</h1><a className="mt-6 inline-block underline" href="/">Volver a la web</a></div></main>;
}
