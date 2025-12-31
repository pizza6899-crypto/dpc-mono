"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@refinedev/core";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const translate = useTranslate();
  const router = useRouter();

  useEffect(() => {
    // 에러를 로깅하거나 에러 리포팅 서비스에 전송할 수 있습니다
    console.error("Error boundary caught an error:", error);
  }, [error]);

  return (
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
      <div className={cn("text-center", "space-y-6", "max-w-md", "w-full")}>
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
            {translate(
              "pages.error.unexpectedError",
              "An unexpected error occurred."
            )}
          </h1>

          <p className={cn("text-muted-foreground", "text-sm")}>
            {translate(
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
              Error ID: {error.digest}
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
            {translate("pages.error.tryAgain", "Try again")}
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className={cn("flex", "items-center", "gap-2")}
          >
            <Home className={cn("h-4", "w-4")} />
            {translate("pages.error.backHome", "Back to homepage")}
          </Button>
        </div>
      </div>
    </div>
  );
}

