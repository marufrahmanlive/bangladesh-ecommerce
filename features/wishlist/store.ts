"use client";

import { create } from "zustand";
import type { WishlistItem } from "@/types";
import { wishlistItemSchema, collection } from "@/types/schemas";
import { keyFor, readValidated, writeJson } from "@/lib/storage";
import { nowIso } from "@/lib/utils";

const KEY = keyFor("wishlist");

function load(): WishlistItem[] {
  return readValidated(KEY, collection(wishlistItemSchema)) ?? [];
}

interface WishlistState {
  items: WishlistItem[];
  hydrated: boolean;
  hydrate: () => void;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: () => set({ items: load(), hydrated: true }),
  toggle: (productId) => {
    const exists = get().items.some((i) => i.productId === productId);
    const items = exists
      ? get().items.filter((i) => i.productId !== productId)
      : [...get().items, { productId, addedAt: nowIso() }];
    writeJson(KEY, items);
    set({ items });
  },
  remove: (productId) => {
    const items = get().items.filter((i) => i.productId !== productId);
    writeJson(KEY, items);
    set({ items });
  },
  has: (productId) => get().items.some((i) => i.productId === productId),
}));
