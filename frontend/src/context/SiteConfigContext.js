import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  SERVICES,
  EXTRAS,
  ALL_SERVICE_OPTIONS,
  applyCatalogConfig,
  getAllServiceOptions,
  getServiceFromOptions,
  computePrice,
} from "@/data/services";

const SiteConfigContext = createContext(null);

const DEFAULT_THEME = {
  accent: "#E56B9E",
  background: "#FFFFFF",
  surface: "#FFF3F7",
  text: "#2E2126",
  muted: "#97707F",
  border: "#F5D3E2",
};

const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
};

const mixHex = (hex, target, amount) => {
  const source = hexToRgb(hex);
  const goal = hexToRgb(target);
  return `#${source.map((channel, index) => Math.round(channel + (goal[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  const accent = theme.accent || DEFAULT_THEME.accent;
  root.style.setProperty("--accent-rgb", hexToRgb(accent).join(" "));
  root.style.setProperty("--accent-color", accent);
  root.style.setProperty("--accent-hover", mixHex(accent, "#000000", 0.08));
  root.style.setProperty("--page-bg", theme.background || DEFAULT_THEME.background);
  root.style.setProperty("--surface", theme.background || DEFAULT_THEME.background);
  root.style.setProperty("--surface-soft", theme.surface || DEFAULT_THEME.surface);
  root.style.setProperty("--border-soft", theme.border || DEFAULT_THEME.border);
  root.style.setProperty("--muted-text", theme.muted || DEFAULT_THEME.muted);
  root.style.setProperty("--foreground-strong", theme.text || DEFAULT_THEME.text);
};

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  const loadConfig = useCallback(() => {
    api.get("/config")
      .then((r) => setConfig(r.data))
      .catch(() => {
        // Fallback local: usar datos estáticos del catálogo cuando no hay backend
        setConfig({});
      });
  }, []);

  useEffect(() => {
    loadConfig();
    window.addEventListener("site-config-updated", loadConfig);
    return () => window.removeEventListener("site-config-updated", loadConfig);
  }, [loadConfig]);

  useEffect(() => {
    applyTheme({ ...DEFAULT_THEME, ...(config?.theme || {}) });
  }, [config]);

  const value = useMemo(() => {
    const catalog = applyCatalogConfig(config || {});
    const services = config ? catalog.services : SERVICES;
    const extras = config ? catalog.extras : EXTRAS;
    const allServiceOptions = getAllServiceOptions(services);
    return {
      config,
      services,
      extras,
      allServiceOptions: config ? allServiceOptions : ALL_SERVICE_OPTIONS,
      siteContent: config?.site_content || { es: {}, en: {} },
      promo: config?.promo || { enabled: false, text_es: "", text_en: "" },
      theme: { ...DEFAULT_THEME, ...(config?.theme || {}) },
      getService: (value) => getServiceFromOptions(config ? allServiceOptions : ALL_SERVICE_OPTIONS, value),
      computePrice: (service, length, size, selectedExtras) =>
        computePrice(service, length, size, selectedExtras, extras),
    };
  }, [config]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export const useSiteConfig = () => useContext(SiteConfigContext);
