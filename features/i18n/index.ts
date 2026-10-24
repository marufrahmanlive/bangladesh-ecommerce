"use client";

import { useCallback } from "react";
import { create } from "zustand";
import type { Locale } from "@/types";
import { keyFor, readJson, writeJson } from "@/lib/storage";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

const catalogs = { en, bn } as const;

export function translate(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const catalog = catalogs[locale] as Record<string, unknown>;
  const value = path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, catalog);
  if (typeof value !== "string") return path;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

const LOCALE_KEY = keyFor("locale");

function loadLocale(): Locale {
  const value = readJson(LOCALE_KEY);
  return value === "bn" ? "bn" : "en";
}

interface I18nState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
}

export const useI18nStore = create<I18nState>()((set) => ({
  locale: "en",
  hydrated: false,
  setLocale: (locale) => {
    writeJson(LOCALE_KEY, locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "bn" ? "bn" : "en";
    }
    set({ locale });
  },
  hydrate: () => set({ locale: loadLocale(), hydrated: true }),
}));

export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      translate(locale, path, vars),
    [locale],
  );
  return { locale, setLocale, t };
}
