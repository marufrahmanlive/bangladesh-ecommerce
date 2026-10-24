import type { MoneyMinor } from "@/types";

export const POISHA_PER_TAKA = 100;

export function toMinor(taka: number): MoneyMinor {
  return Math.round(taka * POISHA_PER_TAKA);
}

export function toTaka(minor: MoneyMinor): number {
  return minor / POISHA_PER_TAKA;
}

export function sumMinor(...values: MoneyMinor[]): MoneyMinor {
  return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

/** Discount percentage from regular -> offer price (0-100, rounded to 1 decimal). */
export function discountPercent(regularMinor: MoneyMinor, offerMinor: MoneyMinor): number {
  if (regularMinor <= 0) return 0;
  const pct = ((regularMinor - offerMinor) / regularMinor) * 100;
  return Math.round(Math.max(0, pct) * 10) / 10;
}

export function discountAmount(regularMinor: MoneyMinor, offerMinor: MoneyMinor): MoneyMinor {
  return Math.max(0, regularMinor - offerMinor);
}

/** Human-readable order number, e.g. ORD-2026-000123. */
export function formatOrderNumber(n: number): string {
  return `ORD-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}
