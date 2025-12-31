"use client";

import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { type Locale, locales, defaultLocale } from "@/i18n";

/**
 * 현재 로케일을 가져오고 변경할 수 있는 훅
 */
export function useLocale() {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!locales.includes(newLocale)) {
        console.warn(`Unsupported locale: ${newLocale}`);
        return;
      }

      // 로케일을 localStorage에 저장
      if (typeof window !== "undefined") {
        localStorage.setItem("locale", newLocale);
        
        // 같은 탭에서의 변경을 감지하기 위한 커스텀 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("localeChange", {
            detail: { key: "locale", value: newLocale },
          })
        );
      }

      // 페이지 새로고침 (실제로는 URL 기반 라우팅을 사용하는 것이 좋지만,
      // 현재 구조에서는 간단하게 localStorage 기반으로 처리)
      router.refresh();
    },
    [router]
  );

  return {
    locale,
    setLocale,
    locales,
    defaultLocale,
  };
}

