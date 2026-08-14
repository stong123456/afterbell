import { createContext, useContext, useEffect, useState } from "react";
import { messages } from "./translations.js";

const STORAGE_KEY = "askstone.locale.v1";
const LEGACY_STORAGE_KEY = "eventedge.locale.v1";
const I18nContext = createContext(null);

function getInitialLocale() {
  try {
    const savedLocale = window.localStorage.getItem(STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return savedLocale === "zh" || savedLocale === "en" ? savedLocale : "en";
  } catch {
    return "en";
  }
}

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
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The interface still works when storage is unavailable.
    }
  }, [locale]);

  const t = (key, params = {}) => {
    const message = getMessage(locale, key) ?? getMessage("en", key) ?? key;
    return interpolate(message, params);
  };

  const toggleLocale = () => setLocale((current) => (current === "en" ? "zh" : "en"));

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
