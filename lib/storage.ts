import { z } from "zod";

/**
 * Safe localStorage wrapper.
 *
 * - Namespaced, versioned keys (`be.v1.*`).
 * - JSON parse/serialize with try/catch.
 * - Handles missing keys, invalid JSON, quota errors and unavailable storage.
 * - Optional Zod validation on read.
 */

export const STORAGE_PREFIX = "be.v1.";

export function keyFor(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

export function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const k = `${STORAGE_PREFIX}__probe__`;
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded or storage disabled.
    return false;
  }
}

export function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readJson<T = unknown>(key: string): T | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Invalid JSON — treat as missing.
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return writeRaw(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function readValidated<T>(key: string, schema: z.ZodType<T>): T | null {
  const value = readJson(key);
  if (value === null) return null;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function hasKey(key: string): boolean {
  return readRaw(key) !== null;
}

export function listKeys(prefix: string = STORAGE_PREFIX): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}
