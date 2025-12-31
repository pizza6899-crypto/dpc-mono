"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStoredLocale } from "@/lib/i18n-utils";
import { type Locale, defaultLocale } from "@/i18n";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

type Messages = Record<string, any>;

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    // 에러를 로깅하거나 에러 리포팅 서비스에 전송할 수 있습니다
    console.error("Global error boundary caught an error:", error);
  }, [error]);

  useEffect(() => {
    // 로케일 감지 및 메시지 로드
    const loadLocale = async () => {
      try {
        const currentLocale = getStoredLocale();
        setLocale(currentLocale);

        // 동적으로 메시지 로드
        const messagesModule = await import(`@/locales/${currentLocale}.json`);
        setMessages(messagesModule.default);
      } catch (error) {
        console.error("Failed to load locale messages:", error);
        // 폴백으로 기본 로케일 메시지 로드
        try {
          const fallbackModule = await import(`@/locales/${defaultLocale}.json`);
          setMessages(fallbackModule.default);
          setLocale(defaultLocale);
        } catch (fallbackError) {
          console.error("Failed to load fallback messages:", fallbackError);
        }
      }
    };

    loadLocale();

    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "locale" && e.newValue) {
        loadLocale();
      }
    };

    // 커스텀 이벤트 감지
    const handleCustomLocaleChange = () => {
      loadLocale();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localeChange" as any, handleCustomLocaleChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localeChange" as any, handleCustomLocaleChange);
    };
  }, []);

  // 메시지가 로드될 때까지 기본값 사용
  const t = (key: string, fallback: string): string => {
    if (!messages) return fallback;
    
    const keys = key.split(".");
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return fallback;
      }
    }
    
    return typeof value === "string" ? value : fallback;
  };

  return (
    <html lang={locale}>
      <body>
        <div
          className={cn(
            "flex",
            "min-h-screen",
            "items-center",
            "justify-center",
            "bg-background",
            "p-4"
          )}
        >
          <div
            className={cn("text-center", "space-y-6", "max-w-md", "w-full")}
          >
            <div className={cn("flex", "justify-center")}>
              <div
                className={cn(
                  "rounded-full",
                  "bg-destructive/10",
                  "p-4",
                  "dark:bg-destructive/20"
                )}
              >
                <AlertCircle
                  className={cn("h-12", "w-12", "text-destructive")}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className={cn("space-y-2")}>
              <h1
                className={cn(
                  "text-2xl",
                  "font-semibold",
                  "text-foreground",
                  "tracking-tight"
                )}
              >
                {t(
                  "pages.error.unexpectedError",
                  "An unexpected error occurred."
                )}
              </h1>

              <p className={cn("text-muted-foreground", "text-sm")}>
                {t(
                  "pages.error.unexpectedErrorDescription",
                  "If the problem persists, please refresh the page or try again later."
                )}
              </p>

              {error.digest && (
                <p
                  className={cn(
                    "text-xs",
                    "text-muted-foreground",
                    "font-mono",
                    "mt-2",
                    "opacity-70"
                  )}
                >
                  {t("pages.error.errorId", "Error ID")}: {error.digest}
                </p>
              )}
            </div>

            <div
              className={cn(
                "flex",
                "flex-col",
                "sm:flex-row",
                "gap-3",
                "justify-center",
                "items-center"
              )}
            >
              <Button
                onClick={reset}
                variant="default"
                className={cn("flex", "items-center", "gap-2")}
              >
                <RefreshCw className={cn("h-4", "w-4")} />
                {t("pages.error.tryAgain", "Try again")}
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className={cn("flex", "items-center", "gap-2")}
              >
                <Home className={cn("h-4", "w-4")} />
                {t("pages.error.backHome", "Back to homepage")}
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

