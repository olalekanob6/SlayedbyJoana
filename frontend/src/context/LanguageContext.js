import { createContext, useContext, useState } from "react";
import { translations } from "@/i18n/translations";
import { useSiteConfig } from "@/context/SiteConfigContext";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("es");
  const { siteContent } = useSiteConfig();
  const t = (key) => {
    const override = siteContent?.[lang]?.[key];
    if (override !== undefined) return override;
    const value = key.split(".").reduce((obj, k) => (obj != null ? obj[k] : undefined), translations[lang]);
    return value !== undefined ? value : key;
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
