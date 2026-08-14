export const DEFAULT_LOCALE = "zh";
export const LOCALE_STORAGE_KEY = "askstone.locale.v2";

export function getInitialLocale(storage = globalThis.window?.localStorage) {
  try {
    const savedLocale = storage?.getItem(LOCALE_STORAGE_KEY);
    return savedLocale === "zh" || savedLocale === "en" ? savedLocale : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(locale, storage = globalThis.window?.localStorage) {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Language switching still works when storage is unavailable.
  }
}
