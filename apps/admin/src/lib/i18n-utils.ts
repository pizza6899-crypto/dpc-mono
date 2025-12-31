import { type Locale, defaultLocale, locales } from "@/i18n";

/**
 * 브라우저에서 저장된 로케일을 가져옵니다
 */
export function getStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const stored = localStorage.getItem("locale");
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }

  // 브라우저 언어 감지
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language.split("-")[0];
    if (locales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
  }

  return defaultLocale;
}

/**
 * 로케일을 저장합니다
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  if (locales.includes(locale)) {
    localStorage.setItem("locale", locale);
  }
}

