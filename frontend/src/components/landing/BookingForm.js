import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  CalendarCheck, Clock, Bell, CheckCircle2, CreditCard, Smartphone,
  CalendarX2, CalendarDays, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Info, User, Phone, Mail, MessageSquare, MapPin, Plus, Minus, Copy, ArrowRight,
  Sparkles, PartyPopper, Star
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SIZES } from "@/data/services";
import { api, formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_SLOT_INFO = {
  slots: [], taken: [], available: [], is_open: true,
  daily_capacity: 2, bookings_count: 0, remaining_capacity: 0,
  duration_minutes: 0,
};

const EMPTY_FORM = {
  service: "", length: "", size: "", extras: [],
  date: "", time: "", name: "", phone: "", email: "",
  notes: "", payment_method: "online",
};

const STATUS_LABELS = { pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada" };

const STEP_DEFS = [
  { key: "service", icon: CalendarCheck, labelKey: "booking.stepService", shortKey: "S" },
  { key: "date",     icon: CalendarDays,   labelKey: "booking.stepDate",     shortKey: "F" },
  { key: "time",     icon: Clock,          labelKey: "booking.stepTime",      shortKey: "H" },
  { key: "data",     icon: User,           labelKey: "booking.stepData",      shortKey: "D" },
  { key: "confirm",  icon: CheckCircle2,   labelKey: "booking.stepConfirm",   shortKey: "C" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (n % 1 === 0 ? `${n}` : n.toFixed(2).replace(".", ","));
const fmtDuration = (minutes) => {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};
const todayStr = () => new Date().toISOString().split("T")[0];

/** Formatea una fecha como "Lun 14 · Ene" para el calendario */
const formatCalendarDay = (dateStr, lang) => {
  const d = new Date(`${dateStr}T12:00:00`);
  const weekday = d.toLocaleDateString(lang === "en" ? "en-GB" : "es-ES", { weekday: "short" });
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return { weekday, day, month };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingForm({ preselectedService, onSuccess }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { allServiceOptions, extras: catalogExtras, getService, computePrice } = useSiteConfig();

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep]       = useState(preselectedService ? 1 : 0);
  const [form, setForm]        = useState(EMPTY_FORM);
  const [sending, setSending]  = useState(false);
  const [sent, setSent]        = useState(false);
  const [sentMethod, setSentMethod]    = useState("bizum");
  const [sentPayable, setSentPayable]  = useState(0);
  const [bizumNumber, setBizumNumber]  = useState("");

  // ── Data state ────────────────────────────────────────────────────────────
  const [slotInfo, setSlotInfo]       = useState(EMPTY_SLOT_INFO);
  const [calendarInfo, setCalendarInfo] = useState({});
  const [myBookings, setMyBookings]   = useState([]);
  const [waitlistForm, setWaitlistForm]   = useState({ name: "", phone: "", email: "" });
  const [waitlistSending, setWaitlistSending] = useState(false);
  const [waitlistSent, setWaitlistSent]       = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [slotsLoading, setSlotsLoading]       = useState(false);
  const [fieldErrors, setFieldErrors]         = useState({});

  // ── Refs ──────────────────────────────────────────────────────────────────
  const nameInputRef = useRef(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const serviceOption = useMemo(
    () => allServiceOptions.find((o) => o.id === form.service),
    [allServiceOptions, form.service],
  );
  const service      = serviceOption?.service || getService(form.service);
  const total        = computePrice(service, form.length, form.size, form.extras);
  const payAmount     = Math.round((total / 2) * 100) / 100;
  const remainingAmount = Math.round((total - payAmount) * 100) / 100;

  const dayClosed = Boolean(form.date && !slotInfo.is_open);
  const dayFull   = Boolean(form.date && slotInfo.is_open && slotInfo.remaining_capacity <= 0);

  const variantReady =
    !service ||
    (service.type === "matrix" && form.length && form.size) ||
    (service.type === "sizes"   && form.size) ||
    (service.type === "options"  && form.length) ||
    service.type === "simple";

  // ── Presets ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (preselectedService) {
      setForm((f) => ({ ...EMPTY_FORM, service: preselectedService }));
      const timer = setTimeout(() => setStep(1), 300);
      return () => clearTimeout(timer);
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

  // Auto-focus name cuando no hay user en step de datos
  useEffect(() => {
    if (step === 3 && !user && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step, user]);

  // ── Slots fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    setWaitlistSent(false);
    if (!form.date) {
      setSlotInfo(EMPTY_SLOT_INFO);
      return;
    }
    setSlotsLoading(true);
    const selectedOption = allServiceOptions.find((o) => o.id === form.service);
    const serviceKey = selectedOption?.key || selectedOption?.name || form.service;
    const params = new URLSearchParams({ date: form.date, service_key: serviceKey });
    api.get(`/bookings/slots?${params}`)
      .then((r) => {
        const info = { ...EMPTY_SLOT_INFO, ...r.data };
        setSlotInfo(info);
        setSlotsLoading(false);
        setForm((f) =>
          (!info.is_open || info.remaining_capacity <= 0 || info.taken.includes(f.time))
            ? { ...f, time: "" }
            : f,
        );
      })
      .catch(() => {
        setSlotInfo(EMPTY_SLOT_INFO);
        setSlotsLoading(false);
      });
  }, [form.date, form.service, allServiceOptions]);

  // ── Calendar fetch ────────────────────────────────────────────────────────
  const calAbortRef = useRef(null);
  useEffect(() => {
    if (calAbortRef.current) {
      calAbortRef.current.abort();
    }
    calAbortRef.current = new AbortController();
    setCalendarLoading(true);
    const start = new Date();
    const end   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 34);
    const serviceOption = allServiceOptions.find((o) => o.id === form.service);
    const params = new URLSearchParams({
      start:  start.toISOString().slice(0, 10),
      end:    end.toISOString().slice(0, 10),
      service_key: serviceOption?.key || serviceOption?.name || form.service,
    });
    api.get(`/bookings/calendar?${params}`, { signal: calAbortRef.current.signal })
      .then((r) => {
        setCalendarInfo(r.data.dates || {});
        setCalendarLoading(false);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") {
          setCalendarInfo({});
          setCalendarLoading(false);
        }
      });
    return () => {
      calAbortRef.current?.abort();
    };
  }, [form.service, allServiceOptions]);

  // ── Step validation ───────────────────────────────────────────────────────
  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return !!form.service && variantReady;
      case 1: return !!form.date && slotInfo.is_open && slotInfo.remaining_capacity > 0;
      case 2: return !!form.time && !slotInfo.taken.includes(form.time);
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }, [step, form, slotInfo, variantReady]);

  const validateStep3 = useCallback(() => {
    const errs = {};
    if (!user) {
      if (!form.name.trim()) errs.name = true;
      if (!form.email.trim() || !form.email.includes("@")) errs.email = true;
    }
    if (!form.phone.trim()) errs.phone = true;
    return errs;
  }, [form, user]);

  // ── Form setters ──────────────────────────────────────────────────────────
  const set = (key) => (e) => {
    const val = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

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
        x.id === id ? { ...x, qty: Math.min(10, Math.max(1, x.qty + delta)) } : x,
      ),
    }));

  const goToStep = (idx) => {
    if (idx < 0) idx = 0;
    if (idx >= STEP_DEFS.length) idx = STEP_DEFS.length - 1;
    if (idx > step) {
      if (idx === 4 && step === 3) {
        const errs = validateStep3();
        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
          toast.error(t("booking.errorsInForm"));
          return;
        }
        setFieldErrors({});
      }
      if (!canAdvance()) {
        toast.error(t("booking.completePreviousStep"));
        return;
      }
    }
    setStep(idx);
  };

  const goNext = () => goToStep(step + 1);
  const goBack = () => goToStep(step - 1);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service || !form.date || !form.time || !form.phone) return;
    if (!user && !form.name) return;
    if (service && !variantReady) {
      toast.error(t("booking.variantRequired"));
      return;
    }
    const errs = validateStep3();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error(t("booking.errorsInForm"));
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
      setForm(EMPTY_FORM);
      onSuccess?.();
      toast.success(t("booking.successTitle"));
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error(t("booking.slotTakenToast"));
        const params = new URLSearchParams({
          date: form.date,
          service_key: serviceOption?.key || serviceOption?.name || form.service,
        });
        api.get(`/bookings/slots?${params}`)
          .then((r) => setSlotInfo({ ...EMPTY_SLOT_INFO, ...r.data }))
          .catch(() => {});
        setForm((f) => ({ ...f, time: "" }));
        setStep(2);
      } else {
        toast.error(formatApiError(err) || t("booking.errorToast"));
      }
    } finally {
      setSending(false);
    }
  };

  // ── Waitlist ──────────────────────────────────────────────────────────────
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

  const copyBizum = async () => {
    const text = bizumNumber
      ? `${fmt(sentPayable)}€ · Bizum ${bizumNumber}`
      : `${fmt(sentPayable)}€ · Bizum`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("booking.bizumCopied"));
    } catch {
      toast.error(t("booking.copyError"));
    }
  };

  // ── Pay options ───────────────────────────────────────────────────────────
  const payOptions = [
    {
      id: "online",
      icon: CreditCard,
      title: t("booking.payOnline").replace("{amount}", fmt(payAmount)),
      desc:  t("booking.payOnlineDesc"),
      testId: "booking-pay-online",
    },
    {
      id: "bizum",
      icon: Smartphone,
      title: t("booking.payBizum").replace("{amount}", fmt(payAmount)),
      desc:  t("booking.payBizumDesc"),
      testId: "booking-pay-bizum",
    },
  ];

  const submitLabel = sending
    ? t("booking.submitting")
    : form.payment_method === "online"
      ? t("booking.submitPay").replace("{amount}", fmt(payAmount))
      : t("booking.submitBizum").replace("{amount}", fmt(payAmount));

  const upcoming = myBookings.filter(
    (b) => b.status !== "cancelled" && b.date >= todayStr(),
  );

  // ── Shared label style ─────────────────────────────────────────────────────
  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted"; // siempre visible, DS muted

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <section
      id="reservar"
      className="py-12 sm:py-20 lg:py-28 bg-[var(--ds-bg-page)]/50 border-y border-[var(--ds-border-subtle)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blush-soft mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blush-primary" />
            {t("booking.eyebrow")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight text-onyx-primary">
            {t("booking.title")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted max-w-xl">
            {t("booking.subtitle")}
          </p>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">

          {/* ═══════════════════════════════════════════════════════════════
           LEFT SIDEBAR: Steps + user info + my bookings
           ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5 order-last lg:order-none">

            {/* ── Progress indicator ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-5 sm:p-6 shadow-[var(--ds-shadow-md)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blush-soft mb-4 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-blush-primary" />
                {t("booking.flowLabel")}
              </p>

              <ol className="flex items-start justify-between gap-1 list-none m-0 p-0">
                {STEP_DEFS.map((s, i) => {
                  const Icon = s.icon;
                  const isActive    = i === step;
                  const isCompleted = i < step;
                  return (
                    <li key={i} className="flex flex-col items-center gap-2.5 shrink-0 flex-1 min-w-0">
                      {/* Circle con número */}
                      <button
                        type="button"
                        onClick={() => goToStep(i)}
                        disabled={i > step && !canAdvance()}
                        className={`
                          flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200 shrink-0 relative
                          ${isCompleted
                            ? "border-blush-primary bg-blush-primary text-white cursor-pointer shadow-[var(--ds-shadow-button)]"
                            : isActive
                              ? "border-blush-primary bg-white text-blush-primary cursor-pointer shadow-sm shadow-blush-soft ring-2 ring-blush-primary/20"
                              : "border-[var(--ds-border-subtle)] bg-white text-muted cursor-pointer hover:border-blush-soft/70 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          }
                        `}
                        title={t(s.labelKey)}
                        aria-label={t(s.labelKey)}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        ) : (
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                        {/* Número pequeño en la esquina para verificación visual */}
                        {!isCompleted && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blush-primary text-white text-[9px] flex items-center justify-center font-extrabold opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                            {i + 1}
                          </span>
                        )}
                      </button>

                      {/* Label — siempre visible, DS muted */}
                      <span className={`
                        text-xs sm:text-sm font-semibold whitespace-nowrap text-center leading-tight transition-colors duration-200
                        ${isActive    ? "text-blush-primary" : ""}
                        ${isCompleted ? "text-onyx-soft" : ""}
                        ${!isActive && !isCompleted ? "text-muted" : ""}
                      `}>
                        {i === step
                          ? t(s.labelKey)
                          : isCompleted
                            ? t("booking.stepDone")
                            : t(s.labelKey)}
                      </span>

                      {/* Connector line */}
                      {i < STEP_DEFS.length - 1 && (
                        <div className={`
                          h-0.5 w-full rounded bg-[var(--ds-border-subtle)] mt-0.5 transition-colors duration-300
                          ${isCompleted ? "bg-blush-primary" : ""}
                        `} />
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* Resumen rápido del paso actual */}
              {step > 0 && step < 4 && (
                <div className="mt-4 pt-3 border-t border-[var(--ds-border-subtle)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    {t("booking.currentStepLabel")}
                  </p>
                  <p className="text-sm font-semibold text-onyx-primary capitalize">
                    {t(STEP_DEFS[step].labelKey)}
                  </p>
                </div>
              )}
            </div>

            {/* ── Logged-in user badge ─────────────────────────────────────── */}
            {user && (
              <div className="flex items-center gap-3 rounded-2xl border border-blush-primary/20 bg-blush-soft/40 px-4 py-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full border border-blush-primary/30" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-blush-primary/15 border border-blush-primary/30 flex items-center justify-center text-sm font-bold text-blush-primary">
                    {(user.name || "J")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted">{t("booking.loggedAs")}</p>
                  <p className="text-sm font-semibold truncate text-onyx-primary">{user.name} · {user.email}</p>
                </div>
              </div>
            )}

            {/* ── My bookings ──────────────────────────────────────────────── */}
            {user && (
              <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-5 sm:p-6 shadow-[var(--ds-shadow-sm)]">
                <p className="font-display font-bold text-xs uppercase tracking-widest text-blush-primary flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4" /> {t("booking.myBookings")}
                </p>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted">{t("booking.noBookings")}</p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-3 text-sm border-b border-[var(--ds-border-subtle)] pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-onyx-primary">
                            {b.service}{b.variant_label ? ` · ${b.variant_label}` : ""}
                          </p>
                          <p className="text-xs text-muted">{b.date} · {b.time}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${b.status === "confirmed" ? "text-blush-deep" : "text-onyx-muted"}`}
                        >
                          {STATUS_LABELS[b.status] || b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
           RIGHT: form area
           ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 min-w-0">

            {/* ── SUCCESS STATE (Celebrada) ───────────────────────────────── */}
            <AnimatePresence mode="wait">
              {sent && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full rounded-3xl border border-blush-primary/25 bg-white p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-[var(--ds-shadow-xl)]"
                >
                  {/* Fondo decorativo animado — blobs más refinados con DS2 */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-blush-soft/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-blush-tint/50 rounded-full blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-gradient-to-br from-blush-pale/20 via-white/5 to-blush-tint/20 rounded-full blur-3xl" />

                  {/* Icono celebracional */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-blush-soft/40 via-blush-tint/30 to-blush-pale/20 rounded-full blur-xl scale-150 animate-pulse" />
                    <div className="absolute inset-0 bg-blush-primary/10 rounded-full blur-md scale-125" />
                    <PartyPopper className="relative h-16 w-16 sm:h-20 sm:w-20 text-blush-primary drop-shadow-sm" />
                    {/* Check anidado — versión más premium */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-11 w-11 rounded-full bg-white shadow-[var(--ds-shadow-md)] border border-blush-soft/30 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-blush-primary" />
                      </div>
                    </div>
                  </div>

                    <h3>
                      <span className="inline-block bg-gradient-to-r from-onyx-primary via-onyx-soft to-blush-deep bg-clip-text text-transparent font-display text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                        {t("booking.successTitle")}
                      </span>
                    </h3>
                  <p className="text-sm sm:text-base text-muted max-w-md mb-6 leading-relaxed">
                    {t("booking.successText")}
                  </p>

                  {/* Tarjeta resumen */}
                  <div className="w-full max-w-md rounded-2xl border border-blush-soft/40 bg-blush-tint/40 p-5 sm:p-6 text-left mb-5 shadow-[var(--ds-shadow-sm)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blush-soft mb-3 flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-blush-primary" />
                      {t("booking.successSummaryLabel")}
                    </p>
                    <div className="space-y-2.5 text-sm bg-white/70 rounded-xl p-4 border border-blush-soft/30 shadow-[var(--ds-shadow-sm)]">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted">{t("booking.service")}</span>
                        <span className="font-semibold text-right max-w-[60%] text-right text-onyx-primary text-right">{serviceOption?.name || form.service}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted">{t("booking.date")}</span>
                        <span className="font-semibold text-right text-onyx-primary text-right">{form.date}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted">{t("booking.time")}</span>
                        <span className="font-semibold text-right text-onyx-primary text-right">{form.time}</span>
                      </div>
                      {form.length && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-muted">{t("booking.length")}</span>
                          <span className="font-semibold text-right text-onyx-primary text-right">{form.length}</span>
                        </div>
                      )}
                      {form.size && (
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-muted">{t("booking.size")}</span>
                          <span className="font-semibold text-right text-onyx-primary text-right">{form.size}</span>
                        </div>
                      )}
                      <div className="border-t border-blush-soft/40 pt-2.5 flex justify-between items-center">
                        <span className="font-semibold text-onyx-primary">{t("booking.total")}</span>
                        <span className="font-display text-lg sm:text-xl font-extrabold text-blush-primary">
                          {fmt(total)}€
                        </span>
                      </div>
                      {sentMethod === "bizum" && (
                        <div className="flex justify-between text-xs gap-4">
                          <span className="text-muted">{t("booking.payBizum")}</span>
                          <span className="font-bold text-blush-primary">{fmt(sentPayable)}€</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bizum instructions */}
                  {sentMethod === "bizum" && (
                    <div className="w-full max-w-md rounded-2xl border border-blush-primary/30 bg-gradient-to-r from-blush-tint via-blush-pale/40 to-blush-soft/30 p-5 text-left shadow-[var(--ds-shadow-glow-soft)]">
                      <p className="font-display font-bold text-blush-deep mb-2 flex items-center gap-2">
                        <Smartphone className="h-5 w-5" /> {t("booking.bizumTitle")}
                      </p>
                      <p className="text-sm text-onyx-soft leading-relaxed">
                        {bizumNumber
                          ? t("booking.bizumText")
                              .replace("{amount}", fmt(sentPayable))
                              .replace("{number}", bizumNumber)
                          : t("booking.bizumNoNumber").replace("{amount}", fmt(sentPayable))}
                      </p>
                      {bizumNumber && (
                        <button
                          type="button"
                          data-testid="bizum-copy-button"
                          onClick={copyBizum}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-blush-primary px-5 py-3 text-sm font-bold text-white hover:bg-blush-hover transition-colors min-h-[44px] shadow-[var(--ds-shadow-button)] hover:shadow-[var(--ds-shadow-button-hover)] hover:scale-[1.02] active:scale-100"
                        >
                          <Copy className="h-4 w-4" /> {t("booking.copyBizum")}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Next steps */}
                  <div className="w-full max-w-md rounded-2xl border border-blush-soft/30 bg-white p-4 text-left mb-5 text-sm shadow-[var(--ds-shadow-sm)]">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                      {t("booking.nextStepsTitle")}
                    </p>
                    <ul className="space-y-1.5 text-muted">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blush-deep shrink-0 mt-0.5" />
                        {t("booking.nextStepsCheckEmail")}
                      </li>
                      {sentMethod === "bizum" && (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blush-primary shrink-0 mt-0.5" />
                          {t("booking.nextStepsSendBizum")}
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blush-deep shrink-0 mt-0.5" />
                        {t("booking.nextStepsWaitConfirmation")}
                      </li>
                    </ul>
                  </div>

                  <button
                    data-testid="booking-new-request-button"
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-2 w-full sm:w-auto rounded-full border-2 border-blush-primary/30 bg-white px-6 py-3 text-sm font-semibold text-blush-primary hover:bg-blush-primary hover:text-white transition-all duration-300 min-h-[44px] shadow-[var(--ds-shadow-md)] hover:shadow-[var(--ds-shadow-button)] hover:scale-[1.02] active:scale-100"
                  >
                    <ArrowRight className="inline h-4 w-4 mr-1.5 -rotate-45" />
                    {t("booking.newBooking")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FORM ─────────────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {!sent && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <form
                    data-testid="online-booking-form"
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-[var(--ds-border-subtle)] bg-white p-5 sm:p-8 shadow-[var(--ds-shadow-xl)] shadow-blush-soft/20 space-y-6"
                  >

                    {/* ══════════════════════════════════════════════════════
                     STEP 0: SERVICIO
                     ══════════════════════════════════════════════════════ */}
                    {step === 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-5">
                          {/* Service select */}
                          <div>
                            <Label className={`${labelClass} mb-1`}>
                              {t("booking.service")} <span className="text-cocarde-primary">*</span>
                            </Label>
                            <Select value={form.service} onValueChange={(v) => {
                              setForm((f) => ({
                                ...f, service: v, length: "", size: "", extras: [], date: "", email: "",
                              }));
                              if (v) setTimeout(() => setStep(1), 200);
                            }}>
                              <SelectTrigger
                                data-testid="booking-service-select"
                                className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none"
                                aria-label={t("booking.selectService")}
                              >
                                <SelectValue placeholder={t("booking.selectService")} />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-[var(--ds-border-subtle)] max-h-72">
                                {allServiceOptions.map((s) => (
                                  <SelectItem key={s.id} value={s.id} className="focus:bg-blush-soft/40 text-onyx-primary">
                                    {s.name} · {t(`services.tabs.${s.category}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Service info card */}
                          {serviceOption && (
                            <div className="rounded-2xl border border-[var(--ds-border-subtle)] bg-[var(--ds-bg-muted)] p-4 space-y-3 shadow-[var(--ds-shadow-sm)]">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-display font-bold text-base text-onyx-primary">{serviceOption.name}</p>
                                  <p className="text-xs text-muted capitalize">
                                    {t(`services.tabs.${serviceOption.category}`)}
                                  </p>
                                </div>
                                {service && (
                                  <span className="text-sm font-bold text-blush-primary whitespace-nowrap bg-blush-tint rounded-lg px-2.5 py-1 border border-blush-soft/40">
                                    desde {fmt(computePrice(service, "", "", []))}€
                                  </span>
                                )}
                              </div>
                              {service?.duration && (
                                <div className="flex items-center gap-2 text-xs text-muted">
                                  <Clock className="h-3.5 w-3.5 text-blush-primary" />
                                  {service.duration}
                                </div>
                              )}
                              {service?.descEs && (
                                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                                  {lang === "en" ? service.descEn : service.descEs}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Variants */}
                          {service?.type === "matrix" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className={`${labelClass} mb-1`}>
                                  {t("booking.length")}
                                </Label>
                                <Select value={form.length} onValueChange={set("length")}>
                                  <SelectTrigger
                                    data-testid="booking-length-select"
                                    className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none"
                                  >
                                    <SelectValue placeholder={t("booking.selectLength")} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-[var(--ds-border-subtle)]">
                                    {Object.keys(service.lengths).map((l) => (
                                      <SelectItem key={l} value={l} className="focus:bg-blush-soft/40 text-onyx-primary">
                                        {l} · {fmt(computePrice(service, l, form.size, form.extras))}€
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className={`${labelClass} mb-1`}>
                                  {t("booking.size")}
                                </Label>
                                <Select value={form.size} onValueChange={set("size")}>
                                  <SelectTrigger
                                    data-testid="booking-size-select"
                                    className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none"
                                  >
                                    <SelectValue placeholder={t("booking.selectSize")} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-[var(--ds-border-subtle)]">
                                    {SIZES.map((sz) => (
                                      <SelectItem key={sz} value={sz} className="focus:bg-blush-soft/40 text-onyx-primary">
                                        {sz} · {fmt(computePrice(service, form.length, sz, form.extras))}€
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {service?.type === "sizes" && (
                            <div>
                              <Label className={`${labelClass} mb-1`}>
                                {t("booking.size")}
                              </Label>
                              <Select value={form.size} onValueChange={set("size")}>
                                <SelectTrigger
                                  data-testid="booking-size-select"
                                  className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none"
                                >
                                  <SelectValue placeholder={t("booking.selectSize")} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-[var(--ds-border-subtle)]">
                                  {SIZES.map((sz) => (
                                    <SelectItem key={sz} value={sz} className="focus:bg-blush-soft/40 text-onyx-primary">
                                      {sz} · {fmt(computePrice(service, "", sz, form.extras))}€
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {service?.type === "options" && (
                            <div>
                              <Label className={`${labelClass} mb-1`}>
                                {t("booking.type")}
                              </Label>
                              <Select value={form.length} onValueChange={set("length")}>
                                <SelectTrigger
                                  data-testid="booking-type-select"
                                  className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none"
                                >
                                  <SelectValue placeholder={t("booking.selectType")} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-[var(--ds-border-subtle)]">
                                  {service.options.map((o) => (
                                    <SelectItem key={o.label} value={o.label} className="focus:bg-blush-soft/40 text-onyx-primary">
                                      {o.label} · {o.price}€
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Extras */}
                          {service && service.extras.length > 0 && (
                            <div>
                              <Label className={`${labelClass} mb-1`}>
                                {t("booking.extrasTitle")}
                              </Label>
                              <div data-testid="booking-extras" className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {service.extras.map((id) => {
                                  const ex = catalogExtras.find((e) => e.id === id);
                                  const entry = form.extras.find((x) => x.id === id);
                                  const active = !!entry;
                                  return (
                                    <div
                                      key={id}
                                      data-testid={`booking-extra-${id}`}
                                      className={`
                                        rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-2 transition-all duration-200 min-h-[44px]
                                        ${active ? "border-blush-primary bg-blush-tint font-semibold" : "border-[var(--ds-border-subtle)] bg-[var(--ds-bg-muted)]"}
                                      `}
                                    >
                                      <button type="button" onClick={() => toggleExtra(id)} className="text-left flex-1 min-w-0">
                                        <span className="block truncate text-onyx-primary">
                                          {lang === "en" ? ex.nameEn : ex.nameEs}
                                        </span>
                                        <span className="text-blush-primary font-bold">
                                          +{ex.price}€{ex.qty ? "/ud" : ""}
                                        </span>
                                      </button>
                                      {ex.qty && active ? (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            data-testid={`extra-minus-${id}`}
                                            onClick={() => changeQty(id, -1)}
                                            className="h-8 w-8 rounded-full border border-blush-soft/50 flex items-center justify-center text-blush-primary hover:bg-blush-primary hover:text-white transition-colors min-h-[44px] min-w-[44px]"
                                          >
                                            <Minus className="h-3.5 w-3.5" />
                                          </button>
                                          <span data-testid={`extra-qty-${id}`} className="font-bold w-6 text-center text-onyx-primary">
                                            {entry.qty}
                                          </span>
                                          <button
                                            type="button"
                                            data-testid={`extra-plus-${id}`}
                                            onClick={() => changeQty(id, 1)}
                                            className="h-8 w-8 rounded-full border border-blush-soft/50 flex items-center justify-center text-blush-primary hover:bg-blush-primary hover:text-white transition-colors min-h-[44px] min-w-[44px]"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span
                                          className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                            active ? "bg-blush-primary border-blush-primary text-white" : "border-[var(--ds-border-subtle)]"
                                          }`}
                                          aria-hidden="true"
                                        >
                                          {active && <CheckCircle2 className="h-3 w-3" />}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Total mini */}
                          {service && (
                            <div className="rounded-2xl border-2 border-blush-primary/25 bg-gradient-to-r from-blush-tint to-blush-soft/30 px-5 py-3.5 flex items-center justify-between shadow-[var(--ds-shadow-glow-soft)]">
                              <span className="text-sm font-semibold text-onyx-primary">{t("booking.total")}</span>
                              <span data-testid="booking-total-amount" className="font-display text-xl font-extrabold text-blush-primary">
                                {fmt(total)}€
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                     STEP 1: FECHA — Calendar + date picker + slots count
                     ══════════════════════════════════════════════════════ */}
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-4">
                          <Label className={`${labelClass} mb-1`}>
                            {t("booking.date")}
                          </Label>

                          {/* Calendar grid — responsive: 7 cols en desktop, 4 en móvil */}
                          <div
                            data-testid="booking-availability-calendar"
                            className="grid grid-cols-4 sm:grid-cols-7 gap-2"
                          >
                            {calendarLoading ? (
                              // Skeleton while loading
                              Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-bg-muted)] h-14 animate-pulse" />
                              ))
                            ) : Object.entries(calendarInfo).length === 0 ? (
                              <div className="col-span-full rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-bg-muted)] p-6 text-center">
                                <Loader2 className="h-6 w-6 text-blush-primary animate-spin mx-auto mb-2" />
                                <p className="text-sm text-muted">{t("booking.loadingCalendar")}</p>
                              </div>
                            ) : (
                              Object.entries(calendarInfo)
                                .slice(0, 35)
                                .map(([date, info]) => {
                                  const disabled = !info.open || info.full;
                                  const selected = form.date === date;
                                  const isToday  = date === todayStr();
                                  const { weekday, day, month } = formatCalendarDay(date, lang);
                                  return (
                                    <button
                                      key={date}
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => {
                                        setForm((f) => ({ ...f, date, time: "" }));
                                        goNext();
                                      }}
                                      title={disabled
                                        ? (info.full ? t("booking.dateFullReason") : t("booking.dateUnavailableReason"))
                                        : t("booking.dateAvailable")
                                      }
                                      className={`relative rounded-xl border-2 px-2 py-3 text-xs transition-all duration-150 min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${selected ? "border-blush-primary bg-blush-primary text-white shadow-[var(--ds-shadow-button)]" : disabled ? "border-red-200 bg-red-50 text-red-400 line-through cursor-not-allowed opacity-60" : "border-[var(--ds-border-subtle)] bg-white text-onyx-primary hover:border-blush-primary hover:shadow-[var(--ds-shadow-sm)] hover:bg-blush-tint cursor-pointer"} ${isToday && !selected ? "ring-2 ring-blush-soft/50" : ""}`}
                                    >
                                      <span className={`block font-semibold uppercase tracking-wider text-[10px] ${selected ? "text-white/80" : "text-muted"}`}>
                                        {weekday}
                                      </span>
                                      <span className={`block font-bold text-sm ${selected ? "text-white" : "text-onyx-primary"}`}>
                                        {day}
                                      </span>
                                      <span className={`block font-semibold text-[10px] ${selected ? "text-white/70" : "text-muted"}`}>
                                        /{month}
                                      </span>
                                      {disabled && (
                                        <CalendarX2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-red-400" />
                                      )}
                                      {isToday && !selected && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blush-primary" />
                                      )}
                                      {!disabled && info.low_capacity && info.low_capacity <= 2 && (
                                        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-yellow-500" title="Pocas plazas" />
                                      )}
                                    </button>
                                  );
                                })
                            )}
                          </div>

                          {/* Date picker inline como fallback */}
                          <Input
                            data-testid="booking-date-picker"
                            type="date"
                            min={todayStr()}
                            required
                            value={form.date}
                            onChange={(e) => {
                              setForm((f) => ({ ...f, date: e.target.value, time: "" }));
                            }}
                            className="mt-2 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl"
                            aria-label={t("booking.selectDate")}
                          />

                          {/* Status messages */}
                          {form.date && (
                            <div className="space-y-2">
                              {dayClosed && (
                                <div className="inline-flex items-center gap-2 rounded-xl bg-red-50/70 border border-cocarde-primary/25 px-4 py-3 text-sm min-h-[44px]">
                                  <CalendarX2 className="h-4 w-4 text-cocarde-primary shrink-0" />
                                  <span className="font-semibold text-cocarde-primary">{t("booking.dayClosed")}</span>
                                </div>
                              )}
                              {dayFull && (
                                <div className="rounded-2xl border border-blush-primary/25 bg-blush-tint p-4 min-h-[52px]">
                                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-blush-deep">
                                    <CalendarX2 className="h-4 w-4" />
                                    {t("booking.dayFull").replace("{count}", slotInfo.daily_capacity)}
                                  </p>
                                  {waitlistSent ? (
                                    <p className="mt-3 text-sm font-semibold text-green-600">
                                      {t("booking.waitlistSuccess")}
                                    </p>
                                  ) : (
                                    <div className="mt-3 space-y-3">
                                      <p className="text-sm font-bold text-onyx-primary">{t("booking.waitlistTitle")}</p>
                                      <p className="text-xs text-muted">{t("booking.waitlistText")}</p>
                                      <div className="grid grid-cols-1 gap-2">
                                        <Input
                                          data-testid="waitlist-name"
                                          required
                                          value={waitlistForm.name}
                                          onChange={(e) => setWaitlistForm((c) => ({ ...c, name: e.target.value }))}
                                          placeholder={t("booking.waitlistName")}
                                          className="bg-white border-[var(--ds-border-subtle)] h-10 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl"
                                        />
                                        <Input
                                          data-testid="waitlist-phone"
                                          required
                                          type="tel"
                                          value={waitlistForm.phone}
                                          onChange={(e) => setWaitlistForm((c) => ({ ...c, phone: e.target.value }))}
                                          placeholder={t("booking.waitlistPhone")}
                                          className="bg-white border-[var(--ds-border-subtle)] h-10 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl"
                                        />
                                        <Input
                                          data-testid="waitlist-email"
                                          type="email"
                                          value={waitlistForm.email}
                                          onChange={(e) => setWaitlistForm((c) => ({ ...c, email: e.target.value }))}
                                          placeholder={t("booking.waitlistEmail")}
                                          className="bg-white border-[var(--ds-border-subtle)] h-10 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        data-testid="waitlist-submit"
                                        onClick={handleWaitlistSubmit}
                                        disabled={waitlistSending}
                                        className="w-full rounded-full bg-blush-primary px-4 py-3 text-sm font-bold text-white hover:bg-blush-hover disabled:opacity-60 transition-colors min-h-[44px] shadow-[var(--ds-shadow-button)]"
                                      >
                                        {waitlistSending ? t("booking.waitlistSending") : t("booking.waitlistSubmit")}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {slotInfo.is_open && slotInfo.remaining_capacity > 0 && !dayClosed && !dayFull && (
                                <p className="inline-flex items-center gap-2 text-xs font-medium text-blush-deep bg-blush-tint border border-blush-soft/40 rounded-xl px-4 py-2.5 min-h-[32px]">
                                  <span className="h-2 w-2 rounded-full bg-blush-primary" />
                                  {t("booking.slotsLeft").replace("{count}", slotInfo.remaining_capacity)} ·
                                  {fmtDuration(slotInfo.duration_minutes) ? ` ${fmtDuration(slotInfo.duration_minutes)} aprox.` : ""}
                                </p>
                              )}
                              {!slotInfo.is_open && !dayClosed && !slotsLoading && (
                                <p className="text-xs text-muted">
                                  {t("booking.loadingSlots")}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Empty state para calendar */}
                          {!form.date && !calendarLoading && Object.keys(calendarInfo).length === 0 && (
                            <p className="text-xs text-muted flex items-center gap-2 py-2 min-h-[32px]">
                              <AlertCircle className="h-3.5 w-3.5 text-blush-deep" />
                              {t("booking.noDatesAvailable")}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                     STEP 2: HORA — Slots como botones grandes
                     ══════════════════════════════════════════════════════ */}
                    {step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-4">
                          <Label className={`${labelClass} mb-1`}>
                            {t("booking.time")}
                          </Label>

                          {/* Slots grid — botones grandes y claros */}
                          <div data-testid="booking-slots-list" className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                            {slotsLoading ? (
                              Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-bg-muted)] h-12 animate-pulse" />
                              ))
                            ) : slotInfo.slots.length === 0 && !form.date ? (
                              <p className="col-span-full text-sm text-muted py-5 text-center bg-blush-tint/30 rounded-xl border border-blush-soft/30">
                                <Clock className="h-5 w-5 inline mr-1.5 text-blush-deep" />
                                {t("booking.selectDateFirst")}
                              </p>
                            ) : slotInfo.slots.length === 0 && form.date ? (
                              <div className="col-span-full rounded-2xl border border-blush-soft/40 bg-blush-tint/50 p-6 text-center min-h-[80px] shadow-[var(--ds-shadow-sm)]">
                                <Clock className="h-8 w-8 text-blush-deep mx-auto mb-3" />
                                <p className="text-sm font-semibold text-onyx-primary">{t("booking.noSlotsAvailable")}</p>
                                <p className="text-xs text-muted mt-1">
                                  {slotInfo.remaining_capacity <= 0
                                    ? t("booking.dayFullAlt")
                                    : t("booking.noSlotsForDate")}
                                </p>
                              </div>
                            ) : (
                              slotInfo.slots.map((slot) => {
                                const taken   = slotInfo.taken.includes(slot);
                                const selected = form.time === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    disabled={taken}
                                    onClick={() => setForm((f) => ({ ...f, time: slot }))}
                                    className={`
                                      relative rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-150 min-h-[56px] flex flex-col items-center justify-center gap-0.5
                                      ${taken
                                        ? "border-cocarde-primary/20 bg-red-50/70 text-cocarde-primary line-through cursor-not-allowed opacity-60"
                                        : selected
                                          ? "border-blush-primary bg-blush-primary text-white shadow-[var(--ds-shadow-button)]"
                                          : "border-[var(--ds-border-subtle)] bg-white text-onyx-primary hover:border-blush-primary hover:shadow-[var(--ds-shadow-sm)] hover:bg-blush-tint cursor-pointer"
                                      }
                                    `}
                                    title={taken ? t("booking.slotTaken") : slot}
                                    aria-pressed={selected}
                                    aria-label={`Hora ${slot}${taken ? ", ocupada" : ", disponible"}`}
                                  >
                                    <span className={`block text-base font-bold ${selected ? "text-white" : "text-onyx-primary"}`}>
                                      {slot}
                                    </span>
                                    {taken && (
                                      <CalendarX2 className="absolute top-1.5 right-1.5 h-4 w-4 text-cocarde-primary" />
                                    )}
                                    {selected && (
                                      <CheckCircle2 className="absolute bottom-1 right-1.5 h-3.5 w-3.5 text-white" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>

                          {/* Info contextual */}
                          {form.date && (
                            <div className="space-y-1.5">
                              {slotInfo.duration_minutes > 0 && (
                                <p className="text-xs text-muted flex items-center gap-2 min-h-[24px]">
                                  <Clock className="h-3.5 w-3.5 text-blush-primary shrink-0" />
                                  {t("booking.durationEstimate").replace("{duration}", fmtDuration(slotInfo.duration_minutes))}
                                </p>
                              )}
                              {slotInfo.is_open && slotInfo.remaining_capacity > 0 && !slotsLoading && (
                                <p className="text-xs text-muted min-h-[24px]">
                                  {t("booking.slotsLeft").replace("{count}", slotInfo.remaining_capacity)}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Locked states */}
                          {dayClosed && (
                            <div className="rounded-xl border border-cocarde-primary/20 bg-red-50/60 px-4 py-3 flex items-center gap-2 text-sm min-h-[44px]">
                              <CalendarX2 className="h-4 w-4 text-cocarde-primary shrink-0" />
                              <span className="font-semibold text-cocarde-primary">{t("booking.dayClosed")}</span>
                            </div>
                          )}
                          {dayFull && (
                            <div className="rounded-2xl border border-blush-primary/30 bg-blush-tint/60 p-4 min-h-[48px] shadow-[var(--ds-shadow-sm)]">
                              <p className="inline-flex items-center gap-2 text-sm font-semibold text-blush-deep">
                                <CalendarX2 className="h-4 w-4 text-blush-primary" />
                                {t("booking.dayFull").replace("{count}", slotInfo.daily_capacity)}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                     STEP 3: DATOS PERSONALES
                     ══════════════════════════════════════════════════════ */}
                    {step === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-4">
                          {user ? (
                            <div className="rounded-2xl border border-blush-primary/20 bg-blush-tint/60 px-4 py-3.5 text-sm flex items-center gap-3 min-h-[52px]">
                              <Info className="h-4.5 w-4.5 text-blush-deep shrink-0" />
                              <div>
                                <p className="text-onyx-primary font-semibold">
                                  {t("booking.usingProfile").replace("{name}", user.name)}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Name */}
                              <div>
                                <Label className={`${labelClass} mb-1`}>
                                  {t("booking.name")} <span className="text-cocarde-primary">*</span>
                                </Label>
                                <Input
                                  data-testid="booking-client-name"
                                  ref={nameInputRef}
                                  required
                                  autoComplete="name"
                                  placeholder={t("booking.namePlaceholder")}
                                  value={form.name}
                                  onChange={set("name")}
                                  className={`mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl ${
                                    fieldErrors.name ? "border-red-400 ring-1 ring-red-200" : ""
                                  }`}
                                  aria-required="true"
                                  aria-invalid={!!fieldErrors.name}
                                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                                />
                                {fieldErrors.name && (
                                  <p id="name-error" className="mt-1.5 text-xs text-cocarde-primary flex items-center gap-1 min-h-[20px]">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {t("booking.nameRequired")}
                                  </p>
                                )}
                              </div>
                              {/* Email */}
                              <div>
                                <Label className={`${labelClass} mb-1`}>
                                  {t("booking.email")} <span className="text-cocarde-primary">*</span>
                                </Label>
                                <Input
                                  data-testid="booking-client-email"
                                  type="email"
                                  autoComplete="email"
                                  placeholder={t("booking.emailPlaceholder")}
                                  value={form.email}
                                  onChange={set("email")}
                                  className={`mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl ${
                                    fieldErrors.email ? "border-red-400 ring-1 ring-red-200" : ""
                                  }`}
                                  aria-required="true"
                                  aria-invalid={!!fieldErrors.email}
                                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                />
                                {fieldErrors.email && (
                                  <p id="email-error" className="mt-1.5 text-xs text-cocarde-primary flex items-center gap-1 min-h-[20px]">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {t("booking.emailInvalid")}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Phone — siempre requerido, teclado numérico */}
                          <div>
                            <Label className={`${labelClass} mb-1`}>
                              {t("booking.phone")} <span className="text-cocarde-primary">*</span>
                            </Label>
                            <Input
                              data-testid="booking-client-phone"
                              required
                              type="tel"
                              autoComplete="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder={t("booking.phonePlaceholder")}
                              value={form.phone}
                              onChange={set("phone")}
                              className={`mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] h-12 text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none rounded-xl ${
                                fieldErrors.phone ? "border-red-400 ring-1 ring-red-200" : ""
                              }`}
                              aria-required="true"
                              aria-invalid={!!fieldErrors.phone}
                              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                            />
                            {fieldErrors.phone && (
                              <p id="phone-error" className="mt-1.5 text-xs text-cocarde-primary flex items-center gap-1 min-h-[20px]">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {t("booking.phoneRequired")}
                              </p>
                            )}
                          </div>

                          {/* Notes */}
                          <div>
                            <Label className={`${labelClass} mb-1`}>
                              {t("booking.notes")}
                            </Label>
                            <Textarea
                              data-testid="booking-client-notes"
                              rows={3}
                              placeholder={t("booking.notesPlaceholder")}
                              value={form.notes}
                              onChange={set("notes")}
                              className="mt-1.5 bg-[var(--ds-bg-muted)] border-[var(--ds-border-subtle)] text-onyx-primary placeholder:text-muted focus:border-blush-primary focus:ring-2 focus:ring-blush-primary/20 transition-colors outline-none resize-none rounded-xl min-h-[80px]"
                              aria-label={t("booking.notes")}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                     STEP 4: CONFIRMAR
                     ══════════════════════════════════════════════════════ */}
                    {step === 4 && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="space-y-5">
                          {/* Summary card */}
                          <div className="rounded-2xl border border-blush-soft/30 bg-blush-tint/30 p-5 sm:p-6 space-y-4 shadow-[var(--ds-shadow-sm)]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blush-soft flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-blush-primary" />
                              {t("booking.summaryTitle")}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-full bg-blush-tint border border-blush-soft/50 flex items-center justify-center text-blush-primary shrink-0 mt-0.5">
                                  <CalendarCheck className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                    {t("booking.service")}
                                  </p>
                                  <p className="font-semibold text-onyx-primary">{serviceOption?.name || form.service}</p>
                                  {form.length && <p className="text-xs text-muted">{form.length}</p>}
                                  {form.size && <p className="text-xs text-muted">Talla: {form.size}</p>}
                                  {form.extras.length > 0 && (
                                    <p className="text-xs text-muted">
                                      {form.extras.map((e) => {
                                        const ex = catalogExtras.find((x) => x.id === e.id);
                                        return ex ? (lang === "en" ? ex.nameEn : ex.nameEs) : "";
                                      }).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-full bg-blush-tint border border-blush-soft/50 flex items-center justify-center text-blush-primary shrink-0 mt-0.5">
                                  <CalendarDays className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                                    {t("booking.date")} · {t("booking.time")}
                                  </p>
                                  <p className="font-semibold text-onyx-primary">{form.date} · {form.time}</p>
                                </div>
                              </div>
                            </div>

                            {/* Total destacado */}
                            <div className="border-t border-blush-soft/30 pt-3 flex justify-between items-center bg-white rounded-xl px-4 py-3 shadow-[var(--ds-shadow-sm)]">
                              <div>
                                <p className="text-xs text-muted">{t("booking.total")}</p>
                                <p className="font-display text-2xl font-extrabold text-blush-primary">{fmt(total)}€</p>
                              </div>
                              <div className="text-right text-xs">
                                <p className="text-muted">{t("booking.payNow")}</p>
                                <p className="font-bold text-blush-primary">{fmt(payAmount)}€</p>
                              </div>
                            </div>

                            {form.payment_method === "bizum" && (
                              <div className="text-xs text-muted bg-white rounded-xl border border-blush-soft/30 px-4 py-3 flex items-center gap-2 shadow-[var(--ds-shadow-sm)]">
                                <Smartphone className="h-4 w-4 text-blush-primary shrink-0" />
                                {t("booking.payBizumRemainder")}: <span className="font-semibold text-blush-primary">{fmt(remainingAmount)}€</span>
                              </div>
                            )}
                          </div>

                          {/* Payment method */}
                          <div>
                            <Label className={`${labelClass} mb-1`}>
                              {t("booking.payTitle")}
                            </Label>
                            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {payOptions.map((opt) => {
                                const active = form.payment_method === opt.id;
                                return (
                                  <button
                                    type="button"
                                    key={opt.id}
                                    data-testid={opt.testId}
                                    onClick={() => setForm((f) => ({ ...f, payment_method: opt.id }))}
                                    className={`
                                      rounded-2xl border-2 p-5 text-left transition-all duration-300 min-h-[80px]
                                      ${active
                                        ? "border-blush-primary bg-blush-tint shadow-[var(--ds-shadow-glow-soft)]"
                                        : "border-[var(--ds-border-subtle)] bg-white hover:border-blush-soft/50 hover:shadow-[var(--ds-shadow-sm)]"
                                      }
                                    `}
                                  >
                                    <opt.icon className={`h-6 w-6 mb-3 ${active ? "text-blush-primary" : "text-muted"}`} />
                                    <p className={`font-semibold text-sm ${active ? "text-blush-primary" : "text-onyx-primary"}`}>
                                      {opt.title}
                                    </p>
                                    <p className="text-xs text-muted mt-1 leading-relaxed">{opt.desc}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Contact preview */}
                          {!user && (
                            <div className="rounded-2xl border border-blush-soft/30 bg-white p-4 text-sm space-y-2 shadow-[var(--ds-shadow-sm)]">
                              <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-blush-primary" />
                                {t("booking.contactPreview")}
                              </p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                <span><strong className="text-muted">{t("booking.name")}:</strong>{" "}<span className="text-onyx-primary">{form.name || t("booking.notProvided")}</span></span>
                                <span><strong className="text-muted">{t("booking.phone")}:</strong>{" "}<span className="text-onyx-primary">{form.phone || t("booking.notProvided")}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* ── Navigation buttons ──────────────────────────────────── */}
                    <div className="flex items-center gap-3 pt-1">
                      {/* Back */}
                      {step > 0 && (
                        <button
                          type="button"
                          onClick={goBack}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-blush-soft/50 bg-white px-4 py-2.5 text-sm font-semibold text-muted hover:border-blush-primary hover:text-blush-primary hover:bg-blush-tint hover:shadow-sm transition-all duration-200 min-h-[44px]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t("booking.back")}
                        </button>
                      )}
                      {/* Spacer */}
                      <div className="flex-1" />
                      {/* Forward / Submit */}
                      {step < STEP_DEFS.length - 1 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={!canAdvance()}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blush-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-blush-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] shadow-[var(--ds-shadow-button)] hover:shadow-[var(--ds-shadow-button-hover)] hover:scale-[1.02] active:scale-100"
                        >
                          {t("booking.next")}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                        data-testid="booking-form-submit-button"
                        type="submit"
                        disabled={sending || !form.phone}
                        className="inline-flex items-center gap-2 rounded-full bg-blush-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-blush-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 min-h-[44px] shadow-[var(--ds-shadow-button)] hover:shadow-[var(--ds-shadow-button-hover)] hover:scale-[1.02] active:scale-100"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("booking.submitting")}
                            </>
                          ) : (
                            <>
                              {form.payment_method === "online" ? (
                                <CreditCard className="h-4 w-4" />
                              ) : (
                                <Smartphone className="h-4 w-4" />
                              )}
                              {submitLabel}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Loading skeleton global ──────────────────────────────────── */}
            {!form.date && step === 1 && calendarLoading && (
              <div className="mt-4 rounded-2xl border border-[var(--ds-border-subtle)] bg-white p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-blush-primary mx-auto mb-3" />
                <p className="text-sm text-muted">{t("booking.loadingCalendar")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
