"use client";

import { Languages } from "lucide-react";
import type { Locale } from "@/types";
import { useI18n } from "@/features/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const options: { value: Locale; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "bn", label: "বাংলা" },
  ];
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Languages className="h-4 w-4 text-muted-foreground" />
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium",
            locale === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
