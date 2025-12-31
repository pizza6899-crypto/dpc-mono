"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode, useEffect, useState } from "react";
import { defaultLocale, type Locale, locales } from "@/i18n";
import { getStoredLocale } from "@/lib/i18n-utils";
// 초기 메시지를 동기적으로 로드하여 초기 렌더링 시 에러 방지
import koMessages from "@/locales/ko.json";
import enMessages from "@/locales/en.json";

const initialMessages: Record<Locale, Record<string, any>> = {
  ko: koMessages,
  en: enMessages,
};

type I18nProviderProps = {
  children: ReactNode;
  locale?: Locale;
  messages?: Record<string, any>;
};

export function I18nProvider({
  children,
  locale: localeProp,
  messages: messagesProp,
}: I18nProviderProps) {
  const initialLocale = localeProp || getStoredLocale() || defaultLocale;
  const [locale, setLocale] = useState<Locale>(initialLocale);
  // 초기 메시지를 동기적으로 제공하여 초기 렌더링 시 에러 방지
  const [messages, setMessages] = useState<Record<string, any>>(
    messagesProp || initialMessages[initialLocale] || {}
  );

  useEffect(() => {
    // props로 로케일이 전달된 경우 사용
    if (localeProp) {
      setLocale(localeProp);
    } else {
      // 저장된 로케일 사용
      const storedLocale = getStoredLocale();
      setLocale(storedLocale);
    }
  }, [localeProp]);

  // localStorage 변경 감지
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "locale" && e.newValue) {
        const newLocale = e.newValue as Locale;
        if (locales.includes(newLocale) && !localeProp) {
          setLocale(newLocale);
        }
      }
    };

    // 다른 탭에서의 변경 감지
    window.addEventListener("storage", handleStorageChange);

    // 같은 탭에서의 변경 감지를 위한 커스텀 이벤트
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === "locale" && e.detail?.value) {
        const newLocale = e.detail.value as Locale;
        if (locales.includes(newLocale) && !localeProp) {
          setLocale(newLocale);
        }
      }
    };

    window.addEventListener("localeChange" as any, handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localeChange" as any, handleCustomStorageChange);
    };
  }, [localeProp]);

  useEffect(() => {
    // props로 메시지가 전달된 경우 사용
    if (messagesProp) {
      setMessages(messagesProp);
      return;
    }

    // 동적으로 메시지 로드
    const loadMessages = async () => {
      try {
        const module = await import(`@/locales/${locale}.json`);
        setMessages(module.default);
      } catch (error) {
        console.error(`Failed to load messages for locale: ${locale}`, error);
        // 폴백으로 기본 로케일 메시지 로드
        try {
          const fallbackModule = await import(`@/locales/${defaultLocale}.json`);
          setMessages(fallbackModule.default);
        } catch (fallbackError) {
          console.error(`Failed to load fallback messages`, fallbackError);
          setMessages({});
        }
      }
    };

    loadMessages();
  }, [locale, messagesProp]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

