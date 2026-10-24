import type { CartItem, MoneyMinor } from "@/types";
import { sumMinor } from "@/lib/money";

export interface CartTotals {
  subtotalMinor: MoneyMinor;
  itemDiscountMinor: MoneyMinor;
  couponDiscountMinor: MoneyMinor;
  shippingMinor: MoneyMinor;
  totalMinor: MoneyMinor;
}

export function mergeKey(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((acc, it) => acc + it.quantity, 0);
}

export function cartSubtotalMinor(items: CartItem[]): MoneyMinor {
  return items.reduce((acc, it) => acc + it.priceMinor * it.quantity, 0);
}

export function cartItemDiscountMinor(items: CartItem[]): MoneyMinor {
  return items.reduce(
    (acc, it) => acc + (it.regularPriceMinor - it.priceMinor) * it.quantity,
    0,
  );
}

export function cartTotals(
  items: CartItem[],
  opts: {
    couponDiscountMinor?: MoneyMinor;
    shippingMinor?: MoneyMinor;
  } = {},
): CartTotals {
  const subtotalMinor = cartSubtotalMinor(items);
  const itemDiscountMinor = cartItemDiscountMinor(items);
  const couponDiscountMinor = opts.couponDiscountMinor ?? 0;
  const shippingMinor = opts.shippingMinor ?? 0;
  const totalMinor = Math.max(
    0,
    sumMinor(subtotalMinor, -couponDiscountMinor, shippingMinor),
  );
  return {
    subtotalMinor,
    itemDiscountMinor,
    couponDiscountMinor,
    shippingMinor,
    totalMinor,
  };
}
