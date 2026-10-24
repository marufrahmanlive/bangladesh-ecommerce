"use client";

import { create } from "zustand";
import { keyFor, readJson, writeJson } from "@/lib/storage";

const KEY = keyFor("recently_viewed");
const MAX = 12;

interface RecentState {
  ids: string[];
  hydrated: boolean;
  hydrate: () => void;
  add: (id: string) => void;
}

function load(): string[] {
  const value = readJson<unknown>(KEY);
  return Array.isArray(value) ? (value as string[]).filter((x) => typeof x === "string") : [];
}

export const useRecentStore = create<RecentState>()((set, get) => ({
  ids: [],
  hydrated: false,
  hydrate: () => set({ ids: load(), hydrated: true }),
  add: (id) => {
    const ids = [id, ...get().ids.filter((x) => x !== id)].slice(0, MAX);
    writeJson(KEY, ids);
    set({ ids });
  },
}));
