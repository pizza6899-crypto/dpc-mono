import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// 지원하는 로케일 목록
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];

// 기본 로케일
export const defaultLocale: Locale = "ko";

export default getRequestConfig(async ({ locale }) => {
  // 지원하지 않는 로케일인 경우 404
  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});

