import { useEffect, useState } from "react";
import { CalendarCheck, Clock, Bell, CheckCircle2, CreditCard, Smartphone, CalendarX2, CalendarDays, Minus, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SIZES } from "@/data/services";
import { api, formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STEP_ICONS = [CalendarCheck, Clock, Bell];
const EMPTY_SLOT_INFO = { slots: [], taken: [], available: [], is_open: true, daily_capacity: 2, bookings_count: 0, remaining_capacity: 0 };

const EMPTY = { service: "", length: "", size: "", extras: [], date: "", time: "", name: "", phone: "", email: "", notes: "", payment_method: "online" };

const STATUS_LABELS = { pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada" };

const fmt = (n) => (n % 1 === 0 ? `${n}` : n.toFixed(2).replace(".", ","));
const fmtDuration = (minutes) => {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export default function BookingForm({ preselectedService, onSuccess }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { allServiceOptions, extras: catalogExtras, getService, computePrice } = useSiteConfig();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMethod, setSentMethod] = useState("bizum");
  const [sentPayable, setSentPayable] = useState(0);
  const [bizumNumber, setBizumNumber] = useState("");
  const [slotInfo, setSlotInfo] = useState(EMPTY_SLOT_INFO);
  const [myBookings, setMyBookings] = useState([]);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", phone: "", email: "" });
  const [waitlistSending, setWaitlistSending] = useState(false);
  const [waitlistSent, setWaitlistSent] = useState(false);

  useEffect(() => {
    if (preselectedService) {
      setForm((f) => ({ ...EMPTY, service: preselectedService }));
    }
  }, [preselectedService]);

  useEffect(() => {
    api.get("/config").then((r) => setBizumNumber(r.data.bizum_number || "")).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/my-bookings").then((r) => setMyBookings(r.data)).catch(() => {});
    }
  }, [user, sent]);

  useEffect(() => {
    setWaitlistSent(false);
    if (!form.date) {
      setSlotInfo(EMPTY_SLOT_INFO);
      return;
    }
    const selectedOption = allServiceOptions.find((option) => option.id === form.service);
    const serviceKey = selectedOption?.key || selectedOption?.name || form.service;
    const params = new URLSearchParams({ date: form.date, service_key: serviceKey });
    api.get(`/bookings/slots?${params.toString()}`)
      .then((r) => {
        const info = { ...EMPTY_SLOT_INFO, ...r.data };
        setSlotInfo(info);
        setForm((f) => (
          !info.is_open || info.remaining_capacity <= 0 || info.taken.includes(f.time)
            ? { ...f, time: "" }
            : f
        ));
      })
      .catch(() => setSlotInfo(EMPTY_SLOT_INFO));
  }, [form.date, form.service, allServiceOptions]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const toggleExtra = (id) =>
    setForm((f) => ({
      ...f,
      extras: f.extras.some((x) => x.id === id)
        ? f.extras.filter((x) => x.id !== id)
        : [...f.extras, { id, qty: 1 }],
    }));

  const changeQty = (id, delta) =>
    setForm((f) => ({
      ...f,
      extras: f.extras.map((x) =>
        x.id === id ? { ...x, qty: Math.min(10, Math.max(1, x.qty + delta)) } : x
      ),
    }));

  const serviceOption = allServiceOptions.find((option) => option.id === form.service);
  const service = serviceOption?.service || getService(form.service);
  const total = computePrice(service, form.length, form.size, form.extras);
  const payAmount = Math.round((total / 2) * 100) / 100;
  const dayClosed = Boolean(form.date && !slotInfo.is_open);
  const dayFull = Boolean(form.date && slotInfo.is_open && slotInfo.remaining_capacity <= 0);

  const variantReady =
    !service ||
    (service.type === "matrix" && form.length && form.size) ||
    (service.type === "sizes" && form.size) ||
    (service.type === "options" && form.length) ||
    service.type === "simple";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service || !form.date || !form.time || !form.phone) return;
    if (!user && !form.name) return;
    if (service && !variantReady) {
      toast.error(t("booking.variantRequired"));
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/bookings", {
        ...form,
        service: serviceOption?.name || form.service,
        service_key: serviceOption?.key || serviceOption?.name || form.service,
        email: form.email || null,
      });
      if (form.payment_method === "online") {
        const checkout = await api.post("/payments/checkout", {
          booking_id: data.id,
          origin_url: window.location.origin,
        });
        window.location.href = checkout.data.checkout_url;
        return;
      }
      setSentMethod(form.payment_method);
      setSentPayable(payAmount);
      setSent(true);
      setForm(EMPTY);
      onSuccess?.();
      toast.success(t("booking.successTitle"));
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error(t("booking.slotTakenToast"));
        const params = new URLSearchParams({ date: form.date, service_key: serviceOption?.key || serviceOption?.name || form.service });
        api.get(`/bookings/slots?${params.toString()}`).then((r) => setSlotInfo({ ...EMPTY_SLOT_INFO, ...r.data })).catch(() => {});
        setForm((f) => ({ ...f, time: "" }));
      } else {
        toast.error(formatApiError(err) || t("booking.errorToast"));
      }
    } finally {
      setSending(false);
    }
  };

  const handleWaitlistSubmit = async (e) => {
    e?.preventDefault();
    if (!serviceOption) {
      toast.error(t("booking.serviceRequired"));
      return;
    }
    if (!waitlistForm.name.trim() || !waitlistForm.phone.trim()) {
      toast.error(t("booking.waitlistError"));
      return;
    }
    setWaitlistSending(true);
    try {
      await api.post("/waitlist", {
        ...waitlistForm,
        email: waitlistForm.email || null,
        service: serviceOption.name,
        service_key: serviceOption.key || serviceOption.name,
        date: form.date,
      });
      setWaitlistSent(true);
      toast.success(t("booking.waitlistSuccess"));
    } catch (err) {
      toast.error(formatApiError(err) || t("booking.waitlistError"));
    } finally {
      setWaitlistSending(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const steps = t("booking.steps");

  const remainingAmount = Math.round((total - payAmount) * 100) / 100;
  const payOptions = [
    { id: "online", icon: CreditCard, title: t("booking.payOnline").replace("{amount}", fmt(payAmount)), desc: t("booking.payOnlineDesc"), testId: "booking-pay-online" },
    { id: "bizum", icon: Smartphone, title: t("booking.payBizum").replace("{amount}", fmt(payAmount)), desc: t("booking.payBizumDesc"), testId: "booking-pay-bizum" },
  ];
  const submitLabel = sending
    ? t("booking.submitting")
    : form.payment_method === "online"
      ? t("booking.submitPay").replace("{amount}", fmt(payAmount))
      : t("booking.submitBizum").replace("{amount}", fmt(payAmount));

  const copyBizum = async () => {
    const text = bizumNumber
      ? `${fmt(sentPayable)}€ · Bizum ${bizumNumber}`
      : `${fmt(sentPayable)}€ · Bizum`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("booking.bizumCopied"));
    } catch (error) {
      toast.error(t("booking.copyError"));
    }
  };

  const upcoming = myBookings.filter((b) => b.status !== "cancelled" && b.date >= today);

  return (
    <section id="reservar" className="py-16 sm:py-24 lg:py-32 bg-[var(--surface-soft)]/60 border-y border-[var(--border-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">{t("booking.eyebrow")}</p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t("booking.title")}</h2>
          <p className="mt-4 text-base text-[var(--muted-text)]">{t("booking.subtitle")}</p>

          <div className="mt-10 space-y-6">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.12 }}
                  className="flex gap-4"
                >
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{s.title}</p>
                    <p className="text-sm text-[var(--muted-text)] mt-1">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {user && (
            <div data-testid="my-bookings" className="mt-12 rounded-2xl border border-[var(--border-soft)] bg-white p-6">
              <p className="font-display font-bold text-sm uppercase tracking-widest text-gold flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4" /> {t("booking.myBookings")}
              </p>
              {upcoming.length === 0 ? (
                <p className="text-sm text-[var(--muted-text)]">{t("booking.noBookings")}</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => (
                    <div key={b.id} data-testid={`my-booking-${b.id}`} className="flex items-center justify-between gap-3 text-sm border-b border-[var(--border-soft)] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold">{b.service}{b.variant_label ? ` · ${b.variant_label}` : ""}</p>
                        <p className="text-xs text-[var(--muted-text)]">{b.date} · {b.time}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${b.status === "confirmed" ? "text-green-600" : "text-yellow-600"}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {sent ? (
            <motion.div
              data-testid="booking-success-message"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full rounded-3xl border border-gold/30 bg-white p-10 flex flex-col items-center justify-center text-center"
            >
              <CheckCircle2 className="h-16 w-16 text-gold mb-6" />
              <h3 className="font-display text-2xl font-bold mb-3">{t("booking.successTitle")}</h3>
              <p className="text-[var(--muted-text)] max-w-md">{t("booking.successText")}</p>
              {sentMethod === "bizum" && (
                <div data-testid="bizum-instructions" className="mt-6 w-full max-w-md rounded-2xl border border-gold/40 bg-gold/10 p-6 text-left">
                <p className="font-display font-bold text-gold mb-2 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {t("booking.bizumTitle")}
                </p>
                <p className="text-sm text-[var(--foreground-strong)] leading-relaxed">
                  {bizumNumber
                    ? t("booking.bizumText").replace("{amount}", fmt(sentPayable)).replace("{number}", bizumNumber)
                    : t("booking.bizumNoNumber").replace("{amount}", fmt(sentPayable))}
                </p>
                <button
                  type="button"
                  data-testid="bizum-copy-button"
                  onClick={copyBizum}
                  disabled={!bizumNumber}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {t("booking.copyBizum")}
                </button>
                </div>
              )}
              <button
                data-testid="booking-new-request-button"
                onClick={() => setSent(false)}
                className="mt-8 rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold hover:bg-gold hover:text-white transition-all duration-300"
              >
                {t("booking.submit")}
              </button>
            </motion.div>
          ) : (
            <form
              data-testid="online-booking-form"
              onSubmit={handleSubmit}
              className="rounded-3xl border border-[var(--border-soft)] bg-white p-6 sm:p-10 space-y-5 shadow-xl shadow-pink-100/50"
            >
              {user ? (
                <div data-testid="booking-logged-user" className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-3">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full border border-gold/40" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-sm font-bold text-gold">
                      {(user.name || "J")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--muted-text)]">{t("booking.loggedAs")}</p>
                    <p className="text-sm font-semibold truncate">{user.name} · {user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.name")}</Label>
                    <Input data-testid="booking-client-name" required placeholder={t("booking.namePlaceholder")}
                           value={form.name} onChange={set("name")}
                           className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.email")}</Label>
                    <Input data-testid="booking-client-email" type="email" placeholder={t("booking.emailPlaceholder")}
                           value={form.email} onChange={set("email")}
                           className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.service")}</Label>
                  <Select value={form.service} onValueChange={(v) => setForm((f) => ({ ...f, service: v, length: "", size: "", extras: [], time: "" }))}>
                    <SelectTrigger data-testid="booking-service-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                      <SelectValue placeholder={t("booking.selectService")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[var(--border-soft)] max-h-72">
                      {allServiceOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-gold/20">
                          {s.name} · {t(`services.tabs.${s.category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {service?.type === "matrix" && (
                  <>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.length")}</Label>
                      <Select value={form.length} onValueChange={set("length")}>
                        <SelectTrigger data-testid="booking-length-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                          <SelectValue placeholder={t("booking.selectLength")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[var(--border-soft)]">
                          {Object.keys(service.lengths).map((l) => (
                            <SelectItem key={l} value={l} className="focus:bg-gold/20">{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.size")}</Label>
                      <Select value={form.size} onValueChange={set("size")}>
                        <SelectTrigger data-testid="booking-size-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                          <SelectValue placeholder={t("booking.selectSize")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[var(--border-soft)]">
                          {SIZES.map((sz) => (
                            <SelectItem key={sz} value={sz} className="focus:bg-gold/20">{sz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {service?.type === "sizes" && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.size")}</Label>
                    <Select value={form.size} onValueChange={set("size")}>
                      <SelectTrigger data-testid="booking-size-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                        <SelectValue placeholder={t("booking.selectSize")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[var(--border-soft)]">
                        {SIZES.map((sz) => (
                          <SelectItem key={sz} value={sz} className="focus:bg-gold/20">{sz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {service?.type === "options" && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.type")}</Label>
                    <Select value={form.length} onValueChange={set("length")}>
                      <SelectTrigger data-testid="booking-type-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                        <SelectValue placeholder={t("booking.selectType")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[var(--border-soft)]">
                        {service.options.map((o) => (
                          <SelectItem key={o.label} value={o.label} className="focus:bg-gold/20">
                            {o.label} · {o.price}€
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {service && service.extras.length > 0 && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.extrasTitle")}</Label>
                    <div data-testid="booking-extras" className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.extras.map((id) => {
                        const ex = catalogExtras.find((extra) => extra.id === id);
                        const entry = form.extras.find((x) => x.id === id);
                        const active = !!entry;
                        return (
                          <div
                            key={id}
                            data-testid={`booking-extra-${id}`}
                            className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-2 transition-all duration-200 ${
                              active ? "border-gold bg-gold/10 font-semibold" : "border-[var(--border-soft)] bg-[var(--surface-soft)]"
                            }`}
                          >
                            <button type="button" onClick={() => toggleExtra(id)} className="text-left flex-1 min-w-0">
                              <span className="block truncate">{lang === "en" ? ex.nameEn : ex.nameEs}</span>
                              <span className="text-gold font-bold">+{ex.price}€{ex.qty ? "/ud" : ""}</span>
                            </button>
                            {ex.qty && active ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button type="button" data-testid={`extra-minus-${id}`} onClick={() => changeQty(id, -1)}
                                        className="h-7 w-7 rounded-full border border-[rgba(var(--accent-rgb),0.45)] flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-colors">
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span data-testid={`extra-qty-${id}`} className="font-bold w-5 text-center">{entry.qty}</span>
                                <button type="button" data-testid={`extra-plus-${id}`} onClick={() => changeQty(id, 1)}
                                        className="h-7 w-7 rounded-full border border-[rgba(var(--accent-rgb),0.45)] flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-colors">
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className={`h-5 w-5 rounded-full border-2 shrink-0 ${active ? "bg-gold border-gold" : "border-[rgba(var(--accent-rgb),0.45)]"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {service && (
                  <div data-testid="booking-total" className="sm:col-span-2 rounded-2xl border border-gold/40 bg-gold/5 px-5 py-4 flex items-center justify-between">
                    <span className="text-sm font-semibold">{t("booking.total")}</span>
                    <span data-testid="booking-total-amount" className="font-display text-2xl font-extrabold text-gold">{fmt(total)}€</span>
                  </div>
                )}

                <div>
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.date")}</Label>
                  <Input data-testid="booking-date-picker" type="date" min={today} required
                         value={form.date} onChange={set("date")}
                         className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12" />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.time")}</Label>
                  <Select value={form.time} onValueChange={set("time")} disabled={!form.date || dayClosed || dayFull}>
                    <SelectTrigger data-testid="booking-time-select" className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12">
                      <SelectValue placeholder={t("booking.selectTime")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[var(--border-soft)]">
                      {slotInfo.slots.map((slot) => {
                        const taken = slotInfo.taken.includes(slot);
                        return (
                          <SelectItem key={slot} value={slot} disabled={taken}
                                      data-testid={`booking-slot-${slot.replace(":", "")}`}
                                      className={taken ? "opacity-40 line-through" : "focus:bg-gold/20"}>
                            {slot}{taken ? ` · ${t("booking.slotTaken")}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {form.date && slotInfo.duration_minutes > 0 && (
                    <p data-testid="booking-duration-estimate" className="mt-2 text-xs text-[var(--muted-text)]">
                      {t("booking.durationEstimate").replace("{duration}", fmtDuration(slotInfo.duration_minutes))}
                    </p>
                  )}
                  {dayClosed && (
                    <p data-testid="booking-day-closed" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
                      <CalendarX2 className="h-3.5 w-3.5" />
                      {t("booking.dayClosed")}
                    </p>
                  )}
                  {dayFull && (
                    <div data-testid="waitlist-panel" className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 p-4">
                      <p data-testid="booking-day-full" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
                        <CalendarX2 className="h-3.5 w-3.5" />
                        {t("booking.dayFull").replace("{count}", slotInfo.daily_capacity)}
                      </p>
                      {waitlistSent ? (
                        <p data-testid="waitlist-success" className="mt-3 text-sm font-semibold text-green-500">
                          {t("booking.waitlistSuccess")}
                        </p>
                      ) : (
                        <div data-testid="waitlist-form" className="mt-3 space-y-3">
                          <p className="text-sm font-bold text-[var(--foreground-strong)]">{t("booking.waitlistTitle")}</p>
                          <p className="text-xs text-[var(--muted-text)]">{t("booking.waitlistText")}</p>
                          <Input
                            data-testid="waitlist-name"
                            required
                            value={waitlistForm.name}
                            onChange={(e) => setWaitlistForm((current) => ({ ...current, name: e.target.value }))}
                            placeholder={t("booking.waitlistName")}
                            className="bg-white border-[var(--border-soft)] h-10"
                          />
                          <Input
                            data-testid="waitlist-phone"
                            required
                            type="tel"
                            value={waitlistForm.phone}
                            onChange={(e) => setWaitlistForm((current) => ({ ...current, phone: e.target.value }))}
                            placeholder={t("booking.waitlistPhone")}
                            className="bg-white border-[var(--border-soft)] h-10"
                          />
                          <Input
                            data-testid="waitlist-email"
                            type="email"
                            value={waitlistForm.email}
                            onChange={(e) => setWaitlistForm((current) => ({ ...current, email: e.target.value }))}
                            placeholder={t("booking.waitlistEmail")}
                            className="bg-white border-[var(--border-soft)] h-10"
                          />
                          <button
                            type="button"
                            data-testid="waitlist-submit"
                            onClick={handleWaitlistSubmit}
                            disabled={waitlistSending}
                            className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
                          >
                            {waitlistSending ? t("booking.waitlistSending") : t("booking.waitlistSubmit")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {form.date && slotInfo.is_open && slotInfo.remaining_capacity > 0 && (
                    <p data-testid="booking-remaining-slots" className="mt-2 text-xs text-[var(--muted-text)]">
                      {t("booking.slotsLeft").replace("{count}", slotInfo.remaining_capacity)}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.phone")}</Label>
                  <Input data-testid="booking-client-phone" required type="tel" placeholder={t("booking.phonePlaceholder")}
                         value={form.phone} onChange={set("phone")}
                         className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)] h-12" />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.notes")}</Label>
                  <Textarea data-testid="booking-client-notes" rows={3} placeholder={t("booking.notesPlaceholder")}
                            value={form.notes} onChange={set("notes")}
                            className="mt-2 bg-[var(--surface-soft)] border-[var(--border-soft)]" />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-[var(--muted-text)]">{t("booking.payTitle")}</Label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {payOptions.map((opt) => {
                      const active = form.payment_method === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          data-testid={opt.testId}
                          onClick={() => setForm((f) => ({ ...f, payment_method: opt.id }))}
                          className={`rounded-2xl border p-5 text-left transition-all duration-300 ${
                            active
                              ? "border-gold bg-gold/10 gold-glow"
                              : "border-[var(--border-soft)] bg-[var(--surface-soft)] hover:border-[rgba(var(--accent-rgb),0.45)]"
                          }`}
                        >
                          <opt.icon className={`h-6 w-6 mb-3 ${active ? "text-gold" : "text-[var(--muted-text)]"}`} />
                          <p className={`font-semibold text-sm ${active ? "text-gold" : "text-[var(--foreground-strong)]"}`}>{opt.title}</p>
                          <p className="text-xs text-[var(--muted-text)] mt-1 leading-relaxed">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-xl border border-gold/25 bg-white/70 px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[var(--muted-text)]">{t("booking.payBizumRemainder")}</span>
                    <span data-testid="booking-remaining-amount" className="font-display font-bold text-gold">{fmt(remainingAmount)}€</span>
                  </div>
                </div>
              </div>

              <button
                data-testid="booking-form-submit-button"
                type="submit"
                disabled={sending}
                className="gold-glow w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-all duration-300"
              >
                {form.payment_method === "online" ? <CreditCard className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                {submitLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
