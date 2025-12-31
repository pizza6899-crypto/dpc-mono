"use client";

import React from "react";
import { useLocale } from "@/hooks/use-locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Locale } from "@/i18n";

type LocaleOption = {
  value: Locale;
  label: string;
  nativeLabel: string;
};

const localeOptions: LocaleOption[] = [
  {
    value: "ko",
    label: "Korean",
    nativeLabel: "한국어",
  },
  {
    value: "en",
    label: "English",
    nativeLabel: "English",
  },
];

export function LocaleSelect() {
  const { locale, setLocale } = useLocale();

  const currentLocale = localeOptions.find((option) => option.value === locale) || localeOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full",
            "justify-between",
            "px-3",
            "text-left",
            "text-sm",
            "font-normal",
            "text-foreground",
            "hover:bg-accent",
            "hover:text-accent-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-ring"
          )}
        >
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span>{currentLocale?.nativeLabel || currentLocale?.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 space-y-1">
        {localeOptions.map((option) => {
          const isSelected = locale === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setLocale(option.value)}
              className={cn(
                "flex items-center gap-2 cursor-pointer relative pr-8",
                {
                  "bg-accent text-accent-foreground": isSelected,
                }
              )}
            >
              <span>{option.nativeLabel}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {option.label}
              </span>
              {isSelected && (
                <Check className="h-4 w-4 absolute right-2 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

LocaleSelect.displayName = "LocaleSelect";

