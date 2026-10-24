"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCartStore } from "@/features/cart/store";
import { formatMoney } from "@/lib/format";
import { t } from "@/lib/slug";
import { cartTotals } from "@/services/cart";
import { ProductImage } from "./product-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";

export function CartPage() {
  const { locale, t: tr } = useI18n();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);
  const totals = cartTotals(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState
          icon={ShoppingCart}
          title={tr("common.emptyCart")}
          description={tr("cart.emptyMessage")}
          action={
            <Link href="/products">
              <Button>{tr("common.continueShopping")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{tr("cart.title")}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="divide-y rounded-lg border">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0">
                <ProductImage src={item.image} alt={t(locale, item.name)} className="h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary">
                  {t(locale, item.name)}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {[item.sku, item.color, item.size].filter(Boolean).join(" · ")}
                </span>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      aria-label="decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        setQuantity(item.id, Math.min(item.stockAvailable, item.quantity + 1))
                      }
                      aria-label="increase"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-semibold">
                    {formatMoney(item.priceMinor * item.quantity, locale)}
                  </span>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(item.id)} aria-label="remove">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-lg border p-4">
          <h2 className="mb-4 font-semibold">{tr("cart.title")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{tr("common.subtotal")}</span>
              <span>{formatMoney(totals.subtotalMinor, locale)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>{tr("cart.itemDiscount")}</span>
              <span>-{formatMoney(totals.itemDiscountMinor, locale)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>{tr("cart.grandTotal")}</span>
              <span>{formatMoney(totals.totalMinor, locale)}</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={() => setConfirmClear(true)}
          >
            {tr("cart.clearCart")}
          </Button>
          <Link href="/checkout" className="mt-2 block">
            <Button className="w-full">{tr("common.proceedToCheckout")}</Button>
          </Link>
        </div>
      </div>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title={tr("cart.clearCart")}>
        <p className="text-sm">{tr("cart.clearConfirm")}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmClear(false)}>
            {tr("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              clear();
              setConfirmClear(false);
            }}
          >
            {tr("common.confirm")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
