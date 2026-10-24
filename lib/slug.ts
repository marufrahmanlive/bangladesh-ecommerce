import type { Locale } from "@/types";

/** Lowercase, strip Latin diacritics, collapse whitespace. Keeps Bengali script. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Case/diacritic-insensitive substring match that also works for Bengali. */
export function textMatches(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle));
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug from a bilingual name, preferring the English form for SEO-friendly URLs. */
export function localizedSlug(name: { en: string; bn: string }): string {
  return slugify(name.en || name.bn || "item");
}

export function uniqueSlug(base: string, exists: (slug: string) => boolean): string {
  if (!exists(base)) return base;
  let i = 2;
  while (exists(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

const BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BENGALI_DIGITS[d]);
}

export function t(locale: Locale, value: { en: string; bn: string }): string {
  return locale === "bn" ? value.bn : value.en;
}
