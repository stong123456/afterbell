import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getInitialLocale, persistLocale } from "./locale.js";
import { messages } from "./translations.js";

const I18nContext = createContext(null);

function getMessage(locale, key) {
  return key.split(".").reduce((value, part) => value?.[part], messages[locale]);
}

function interpolate(message, params) {
  if (typeof message !== "string") return message;
  return message.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = messages[locale].meta.title;
    persistLocale(locale);
  }, [locale]);

  const t = useCallback((key, params = {}) => {
    const message = getMessage(locale, key) ?? getMessage("en", key) ?? key;
    return interpolate(message, params);
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "en" ? "zh" : "en"));
  }, []);

  const value = useMemo(() => ({ locale, t, toggleLocale }), [locale, t, toggleLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
