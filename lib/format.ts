import type { Locale, MoneyMinor } from "@/types";
import { POISHA_PER_TAKA } from "./money";

const moneyFmtCache: Partial<Record<Locale, Intl.NumberFormat>> = {};
const dateFmtCache: Partial<Record<Locale, Intl.DateTimeFormat>> = {};
const dateTimeFmtCache: Partial<Record<Locale, Intl.DateTimeFormat>> = {};
const numberFmtCache: Partial<Record<Locale, Intl.NumberFormat>> = {};

function localeTag(locale: Locale): string {
  return locale === "bn" ? "bn-BD" : "en-BD";
}

export function formatMoney(minor: MoneyMinor, locale: Locale): string {
  let fmt = moneyFmtCache[locale];
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(localeTag(locale), {
        style: "currency",
        currency: "BDT",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      fmt = new Intl.NumberFormat(localeTag(locale), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    moneyFmtCache[locale] = fmt;
  }
  return fmt.format(minor / POISHA_PER_TAKA);
}

export function formatNumber(n: number, locale: Locale): string {
  let fmt = numberFmtCache[locale];
  if (!fmt) {
    fmt = new Intl.NumberFormat(localeTag(locale));
    numberFmtCache[locale] = fmt;
  }
  return fmt.format(n);
}

export function formatDate(iso: string, locale: Locale): string {
  let fmt = dateFmtCache[locale];
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(localeTag(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    dateFmtCache[locale] = fmt;
  }
  return fmt.format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale): string {
  let fmt = dateTimeFmtCache[locale];
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(localeTag(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    dateTimeFmtCache[locale] = fmt;
  }
  return fmt.format(new Date(iso));
}

export function formatPercent(n: number, locale: Locale): string {
  return `${formatNumber(n, locale)}%`;
}
