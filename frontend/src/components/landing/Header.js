import { useState } from "react";
import { Menu, X, Calendar, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { id: "servicios", key: "nav.services", testId: "nav-link-services" },
  { id: "galeria", key: "nav.gallery", testId: "nav-link-gallery" },
  { id: "sobre-joana", key: "nav.about", testId: "nav-link-about" },
  { id: "faq", key: "nav.faq", testId: "nav-link-faq" },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { user, loginWithEmail, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await loginWithEmail(email, password);
      setPassword("");
      setShowLogin(false);
    } catch (error) {
      setLoginError(error?.response?.data?.detail || "Correo o contraseña incorrectos.");
    } finally {
      setLoggingIn(false);
    }
  };

  const closeMobile = () => setOpen(false);

  return (
    <>
      {/* ── Header — minimal, sin glassmorphism excesivo ── */}
      <header
        data-testid="header-navigation"
        className="fixed top-0 inset-x-0 z-50 border-b border-[var(--ds-border-default)]/60 bg-[var(--ds-bg-page)]/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 lg:h-16 flex items-center justify-between gap-3 sm:gap-5">
          {/* Brand — tipografía protagonista */}
          <a
            href="#inicio"
            data-testid="brand-logo"
            className="font-display font-extrabold tracking-tight text-base sm:text-lg lg:text-xl leading-none text-[var(--ds-blush-deep)] hover:text-[var(--ds-blush-primary)] transition-colors"
          >
            SLAYED
            <span className="block text-[9px] sm:text-[10px] lg:text-xs font-body font-medium tracking-[0.25em] text-[var(--ds-text-muted)] uppercase mt-0.5 sm:mt-1">
              by Joana17
            </span>
          </a>

          {/* Desktop nav — limpio */}
          <nav className="hidden lg:flex items-center gap-6 sm:gap-8">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                data-testid={l.testId}
                className="text-xs sm:text-sm font-medium text-[var(--ds-text-secondary)] hover:text-[var(--ds-blush-primary)] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[var(--ds-blush-primary)]/50 after:scale-x-0 after:group-hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                {t(l.key)}
              </a>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center rounded-full border border-[var(--ds-border-default)]/60 p-0.5 text-[10px] font-semibold bg-[var(--ds-bg-elevated)]">
              <button
                data-testid="language-toggle-es"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 rounded-full transition-colors duration-200 ${lang === "es" ? "bg-[var(--ds-blush-primary)] text-white" : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)]"}`}
              >
                ES
              </button>
              <button
                data-testid="language-toggle-en"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full transition-colors duration-200 ${lang === "en" ? "bg-[var(--ds-blush-primary)] text-white" : "text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)]"}`}
              >
                EN
              </button>
            </div>

            {/* Guest: booking CTA */}
            {!user && (
              <a
                href="#reservar"
                data-testid="header-booking-cta"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[var(--ds-blush-primary)] px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white hover:bg-[var(--ds-blush-hover)] hover:-translate-y-0.5 transition-all duration-200 shadow-md shadow-[var(--ds-blush-primary)]/20 lg:px-4 lg:py-2"
              >
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">{t("nav.book")}</span>
              </a>
            )}

            {/* User chip */}
            {user && (
              <div data-testid="header-user-chip" className="hidden sm:flex items-center gap-1.5">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[var(--ds-blush-soft)]" />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[var(--ds-blush-tint)] border border-[var(--ds-blush-soft)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--ds-blush-deep)]">
                    {(user.name || "J")[0].toUpperCase()}
                  </div>
                )}
                {user.role === "admin" && (
                  <a
                    href="/admin"
                    data-testid="header-admin-link"
                    title={t("admin.title")}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[var(--ds-border-default)]/60 flex items-center justify-center text-[var(--ds-text-muted)] hover:text-[var(--ds-blush-primary)] hover:border-[var(--ds-blush-soft)] transition-colors"
                  >
                    <span className="text-[var(--ds-text-primary)] text-[10px] font-bold tracking-wider">A</span>
                  </a>
                )}
                <button
                  data-testid="header-logout-button"
                  onClick={logout}
                  title={t("auth.logout")}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[var(--ds-border-default)]/60 flex items-center justify-center text-[var(--ds-text-muted)] hover:text-red-400 hover:border-red-400/50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              data-testid="mobile-menu-button"
              onClick={() => setOpen(!open)}
              className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-muted)] transition-colors"
              aria-label="Menú"
            >
              {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              data-testid="mobile-menu"
              className="lg:hidden border-t border-[var(--ds-border-default)]/60 bg-[var(--ds-bg-page)]/95 backdrop-blur-md"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-1 sm:gap-2">
                {LINKS.map((l) => (
                  <a
                    key={l.id}
                    href={`#${l.id}`}
                    onClick={closeMobile}
                    className="text-sm sm:text-base text-[var(--ds-text-primary)] font-medium py-2.5 sm:py-3 border-b border-[var(--ds-border-default)]/40 last:border-0 hover:text-[var(--ds-blush-primary)] transition-colors"
                  >
                    {t(l.key)}
                  </a>
                ))}
                {user ? (
                  <>
                    <button
                      onClick={() => { logout(); closeMobile(); }}
                      className="text-sm sm:text-base text-[var(--ds-text-muted)] py-2.5 text-left hover:text-[var(--ds-text-primary)] transition-colors"
                    >
                      {t("auth.logout")} ({user.name})
                    </button>
                    {user.role === "admin" && (
                      <a
                        href="/admin"
                        onClick={closeMobile}
                        className="text-sm sm:text-base font-semibold text-[var(--ds-blush-deep)] py-2.5 text-left hover:underline transition-colors"
                      >
                        {t("admin.title")}
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <a
                      href="#reservar"
                      onClick={closeMobile}
                      className="text-sm sm:text-base font-semibold text-[var(--ds-blush-primary)] py-2.5 text-left hover:underline transition-colors"
                    >
                      {t("nav.book")}
                    </a>
                    <button
                      onClick={() => { setShowLogin(true); closeMobile(); setLoginError(""); }}
                      className="text-sm sm:text-base text-[var(--ds-text-muted)] py-2.5 text-left hover:text-[var(--ds-text-primary)] transition-colors"
                    >
                      {t("auth.login")}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Login modal — refined ── */}
      {showLogin && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={t("auth.login")}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="w-full max-w-sm rounded-2xl border border-[var(--ds-border-default)] bg-white p-6 sm:p-8 shadow-2xl shadow-black/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--ds-blush-tint)] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--ds-blush-deep)]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 4v1a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1M4 10v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6M4 10h14M4 10l2-2m-2 2l2 2" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-bold text-[var(--ds-text-primary)]">{t("auth.login")}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                aria-label="Cerrar"
                className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--ds-text-muted)] hover:bg-[var(--ds-bg-muted)] hover:text-[var(--ds-text-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitLogin} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-text-muted)]">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border border-[var(--ds-border-default)] bg-[var(--ds-bg-muted)]/50 px-4 py-2.5 sm:py-3 text-sm text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none focus:border-[var(--ds-blush-primary)] focus:ring-2 focus:ring-[var(--ds-blush-primary)]/20 transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--ds-text-muted)]">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[var(--ds-border-default)] bg-[var(--ds-bg-muted)]/50 px-4 py-2.5 sm:py-3 text-sm text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none focus:border-[var(--ds-blush-primary)] focus:ring-2 focus:ring-[var(--ds-blush-primary)]/20 transition-colors"
                />
              </div>
              {loginError && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-xs sm:text-sm text-red-600 text-center sm:text-left font-medium">{loginError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-full bg-[var(--ds-blush-primary)] px-5 py-2.5 sm:py-3 font-semibold text-white disabled:opacity-60 transition-colors shadow-sm hover:shadow-md"
              >
                {loggingIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {t("auth.login")}…
                  </span>
                ) : t("auth.login")}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
