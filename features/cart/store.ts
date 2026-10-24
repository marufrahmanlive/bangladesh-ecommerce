"use client";

import { create } from "zustand";
import type { CartItem, Product, ProductVariant } from "@/types";
import { cartItemSchema, collection } from "@/types/schemas";
import { keyFor, readValidated, writeJson } from "@/lib/storage";
import { mergeKey } from "@/services/cart";
import { nowIso } from "@/lib/utils";

const CART_KEY = keyFor("cart");

function load(): CartItem[] {
  return readValidated(CART_KEY, collection(cartItemSchema)) ?? [];
}

function persist(items: CartItem[]): void {
  writeJson(CART_KEY, items);
}

export function toCartItem(
  product: Product,
  variant: ProductVariant,
  quantity: number,
): CartItem {
  return {
    id: mergeKey(product.id, variant.id),
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    slug: product.slug,
    sku: variant.sku,
    image: variant.image ?? product.images[0],
    color: variant.color,
    size: variant.size,
    regularPriceMinor: variant.regularPriceMinor,
    priceMinor: variant.offerPriceMinor,
    quantity,
    stockAvailable: variant.stock,
    addedAt: nowIso(),
  };
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => void;
  add: (item: CartItem) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: () => set({ items: load(), hydrated: true }),
  add: (item) => {
    const items = [...get().items];
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity = Math.min(
        existing.stockAvailable,
        existing.quantity + item.quantity,
      );
      existing.priceMinor = item.priceMinor;
      existing.regularPriceMinor = item.regularPriceMinor;
      existing.stockAvailable = item.stockAvailable;
      existing.image = item.image;
    } else {
      items.push({ ...item, quantity: Math.min(item.stockAvailable, item.quantity) });
    }
    persist(items);
    set({ items });
  },
  setQuantity: (itemId, quantity) => {
    const items = get()
      .items.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    persist(items);
    set({ items });
  },
  remove: (itemId) => {
    const items = get().items.filter((i) => i.id !== itemId);
    persist(items);
    set({ items });
  },
  clear: () => {
    persist([]);
    set({ items: [] });
  },
}));

export function useCartCount(): number {
  return useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
}
