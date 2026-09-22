import { useEffect } from "react";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function PushNotification({ show, onClose }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onClose, 8000);
    return () => clearTimeout(id);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-testid="simulated-mobile-notification"
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
        >
          <div className="rounded-2xl border border-gold/30 bg-[var(--surface-soft)]/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gold flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-[#FFFFFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-text)]">{t("push.title")}</p>
              <p className="text-sm font-bold text-[var(--foreground-strong)] mt-0.5">{t("push.heading")}</p>
              <p className="text-xs text-[var(--muted-text)] mt-1 leading-relaxed">{t("push.text")}</p>
            </div>
            <button data-testid="push-notification-close" onClick={onClose}
                    className="text-[var(--muted-text)] hover:text-[var(--foreground-strong)] transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
