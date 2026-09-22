import { useState } from "react";
import { Menu, X, Calendar, LogOut, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const LINKS = [
  { id: "servicios", key: "nav.services", testId: "nav-link-services" },
  { id: "por-que", key: "nav.why", testId: "nav-link-why-us" },
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

  const submitLogin = async (event) => {
    event.preventDefault();
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

  return (
    <header data-testid="header-navigation" className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-soft)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-4">
        <a href="#inicio" data-testid="brand-logo" className="font-display font-extrabold tracking-tight text-lg sm:text-xl leading-none">
          <span className="text-gold">SLAYED</span>
          <span className="block text-[10px] sm:text-xs font-body font-medium tracking-[0.3em] text-[var(--muted-text)] uppercase">by Joana17</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} data-testid={l.testId}
               className="text-sm text-[var(--muted-text)] hover:text-gold transition-colors duration-300">
              {t(l.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-full border border-[var(--border-soft)] p-0.5 text-xs font-semibold">
            <button data-testid="language-toggle-es" onClick={() => setLang("es")}
                    className={`px-2.5 py-1 rounded-full transition-colors duration-300 ${lang === "es" ? "bg-gold text-[#FFFFFF]" : "text-[var(--muted-text)] hover:text-[var(--foreground-strong)]"}`}>
              ES
            </button>
            <button data-testid="language-toggle-en" onClick={() => setLang("en")}
                    className={`px-2.5 py-1 rounded-full transition-colors duration-300 ${lang === "en" ? "bg-gold text-[#FFFFFF]" : "text-[var(--muted-text)] hover:text-[var(--foreground-strong)]"}`}>
              EN
            </button>
          </div>

          {!user && (
            <button data-testid="header-login-button" onClick={() => { setShowLogin(true); setLoginError(""); }}
                    className="hidden sm:inline-flex rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--foreground-strong)] hover:border-gold hover:text-gold transition-colors">
              Iniciar sesión
            </button>
          )}
          {user ? (
            <div data-testid="header-user-chip" className="hidden sm:flex items-center gap-2">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full border border-gold/40" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-xs font-bold text-gold">
                  {(user.name || "J")[0].toUpperCase()}
                </div>
              )}
              {user.role === "admin" && (
                <a href="/admin" data-testid="header-admin-link" title="Panel"
                   className="h-8 w-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--muted-text)] hover:text-gold hover:border-gold/50 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                </a>
              )}
              <button data-testid="header-logout-button" onClick={logout} title={t("auth.logout")}
                      className="h-8 w-8 rounded-full border border-[var(--border-soft)] flex items-center justify-center text-[var(--muted-text)] hover:text-red-400 hover:border-red-400/50 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <a href="#reservar" data-testid="header-booking-cta-button"
             className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 transition-all duration-300">
            <Calendar className="h-4 w-4" />
            {t("nav.book")}
          </a>
          <button data-testid="mobile-menu-button" onClick={() => setOpen(!open)} className="lg:hidden text-[var(--foreground-strong)] p-2">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div data-testid="mobile-menu" className="lg:hidden border-t border-[var(--border-soft)] bg-[var(--surface)]/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)}
               className="text-base text-[var(--foreground-strong)] hover:text-gold transition-colors">
              {t(l.key)}
            </a>
          ))}
          {!user && <button data-testid="mobile-login-button" onClick={() => { setShowLogin(true); setOpen(false); setLoginError(""); }} className="text-left text-base font-semibold text-[var(--foreground-strong)]">Iniciar sesión</button>}
          {user && (
            <button data-testid="mobile-logout-button" onClick={() => { logout(); setOpen(false); }}
                    className="text-left text-base text-[var(--muted-text)]">
              {t("auth.logout")} ({user.name})
            </button>
          )}
          <a href="#reservar" onClick={() => setOpen(false)}
             className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-[#FFFFFF]">
            <Calendar className="h-4 w-4" />
            {t("nav.book")}
          </a>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Iniciar sesión">
          <form onSubmit={submitLogin} className="w-full max-w-md rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Iniciar sesión</h2><button type="button" onClick={() => setShowLogin(false)} aria-label="Cerrar" className="text-2xl text-[var(--muted-text)]">×</button></div>
            <label className="mb-4 block text-sm font-semibold">Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-transparent px-4 py-3" /></label>
            <label className="mb-4 block text-sm font-semibold">Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-transparent px-4 py-3" /></label>
            {loginError && <p role="alert" className="mb-4 text-sm text-red-500">{loginError}</p>}
            <button type="submit" disabled={loggingIn} className="w-full rounded-full bg-gold px-5 py-3 font-semibold text-white disabled:opacity-60">{loggingIn ? "Iniciando sesión…" : "Iniciar sesión"}</button>
          </form>
        </div>
      )}
    </header>
  );
}
