"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCartStore } from "@/features/cart/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { t } from "@/lib/slug";
import { cartCount, cartSubtotalMinor } from "@/services/cart";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "./product-image";

export function CartDrawer() {
  const { locale, t: tr } = useI18n();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const subtotal = cartSubtotalMinor(items);

  return (
    <>
      <div
        className={open ? "fixed inset-0 z-40 bg-black/50" : "hidden"}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">
            {tr("cart.title")} ({cartCount(items)})
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <EmptyState icon={ShoppingCart} title={tr("common.emptyCart")} />
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 border-b py-3">
                <div className="relative h-16 w-16 shrink-0">
                  <ProductImage src={item.image} alt={t(locale, item.name)} className="h-full w-full" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-medium">{t(locale, item.name)}</span>
                  <span className="text-xs text-muted-foreground">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </span>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        aria-label="decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          setQuantity(item.id, Math.min(item.stockAvailable, item.quantity + 1))
                        }
                        aria-label="increase"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatMoney(item.priceMinor * item.quantity, locale)}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => remove(item.id)}
                  aria-label="remove"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>{tr("common.subtotal")}</span>
              <span className="font-semibold">{formatMoney(subtotal, locale)}</span>
            </div>
            <div className="flex gap-2">
              <Link href="/cart" className="flex-1">
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  {tr("cart.title")}
                </Button>
              </Link>
              <Link href="/checkout" className="flex-1">
                <Button className="w-full" onClick={() => setOpen(false)}>
                  {tr("common.proceedToCheckout")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
