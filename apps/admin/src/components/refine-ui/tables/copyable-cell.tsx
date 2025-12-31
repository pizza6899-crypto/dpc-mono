"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CopyableCellProps = {
  value: string | null | undefined;
  className?: string;
  displayValue?: string;
  enabled?: boolean;
};

export function CopyableCell({
  value,
  className,
  displayValue,
  enabled = false, // 임시로 비활성화
}: CopyableCellProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useTranslations("table");

  if (!value || value === "-") {
    return <div className={cn("truncate", className)}>-</div>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setOpen(true);
      setTimeout(() => {
        setCopied(false);
        // setOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const textToShow = displayValue || value;

  // 복사 기능이 비활성화된 경우 일반 텍스트로 표시
  if (!enabled) {
    return (
      <div className={cn("truncate", className)}>
        {textToShow}
      </div>
    );
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "truncate cursor-pointer group relative",
            "hover:bg-muted/50 active:bg-muted transition-all duration-150",
            "rounded px-1.5 py-0.5 -mx-1.5 -my-0.5",
            "border border-transparent hover:border-border/50",
            className
          )}
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCopy(e as any);
            }
          }}
        >
          {textToShow}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className={cn(
          "max-w-md p-0 bg-popover border shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          "[&>svg]:hidden"
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-3 space-y-2">
          <div className={cn(
            "text-xs font-medium",
            copied ? "text-primary" : "text-muted-foreground"
          )}>
            {copied ? t("copy.copied") : t("copy.clickToCopy")}
          </div>
          <div className="text-sm font-mono break-all text-foreground bg-muted/30 rounded px-2 py-1.5 border">
            {value}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

