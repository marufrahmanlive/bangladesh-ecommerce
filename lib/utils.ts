import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rnd}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function pluralize(
  n: number,
  locale: "en" | "bn",
  one: string,
  many: string,
): string {
  if (locale === "bn") return `${n} ${many}`;
  return `${n} ${n === 1 ? one : many}`;
}
