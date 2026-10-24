import { z } from "zod";
import { listKeys, readJson, removeRaw, STORAGE_PREFIX, writeJson } from "./storage";
import { nowIso } from "./utils";

export const EXPORT_VERSION = 1;

export interface DataExport {
  version: number;
  exportedAt: string;
  collections: Record<string, unknown>;
}

const exportSchema = z.object({
  version: z.number(),
  exportedAt: z.string().optional(),
  collections: z.record(z.string(), z.unknown()),
});

/** Remove all namespaced demo data. Repositories re-seed on next access. */
export function resetDemoData(): void {
  for (const key of listKeys()) {
    removeRaw(key);
  }
}

export function exportAllData(): DataExport {
  const collections: Record<string, unknown> = {};
  for (const key of listKeys()) {
    collections[key] = readJson(key);
  }
  return { version: EXPORT_VERSION, exportedAt: nowIso(), collections };
}

export function importAllData(input: unknown): { ok: boolean; error?: string } {
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid-format" };
  for (const [key, value] of Object.entries(parsed.data.collections)) {
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    writeJson(key, value);
  }
  return { ok: true };
}
